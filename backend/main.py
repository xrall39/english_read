"""
英语阅读NLP微服务
提供文本分析、句子分割、词性标注、命名实体识别等功能
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import spacy
import logging
from contextlib import asynccontextmanager

# 词典相关导入
from dictionary_parser import DictionaryParser, scan_dictionary_files
from dictionary_importer import DictionaryImporter, get_importer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局变量存储spaCy模型
nlp_model = None

# 词典文件目录（相对于项目根目录）
DICTIONARIES_DIR = Path(__file__).parent.parent / "data" / "dictionaries"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global nlp_model
    try:
        # 启动时加载spaCy模型
        logger.info("正在加载spaCy英语模型...")
        nlp_model = spacy.load("en_core_web_sm")
        logger.info("spaCy模型加载成功")
        yield
    except OSError as e:
        logger.error(f"无法加载spaCy模型: {e}")
        logger.error("请运行: python -m spacy download en_core_web_sm")
        raise
    finally:
        # 清理资源
        logger.info("正在清理资源...")

# 创建FastAPI应用
app = FastAPI(
    title="英语阅读NLP服务",
    description="提供文本分析、句子分割、词性标注、命名实体识别等功能",
    version="1.0.0",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class TextAnalysisRequest(BaseModel):
    text: str
    include_sentences: bool = True
    include_pos: bool = True
    include_ner: bool = True
    include_dependencies: bool = False
    include_difficulty: bool = True

class SentenceInfo(BaseModel):
    text: str
    start: int
    end: int
    tokens: List[Dict[str, Any]]

class EntityInfo(BaseModel):
    text: str
    label: str
    start: int
    end: int
    description: str

class DifficultyInfo(BaseModel):
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    automated_readability_index: float
    coleman_liau_index: float
    gunning_fog: float
    smog_index: float
    difficulty_level: str

class TextAnalysisResponse(BaseModel):
    text: str
    sentences: Optional[List[SentenceInfo]] = None
    entities: Optional[List[EntityInfo]] = None
    difficulty: Optional[DifficultyInfo] = None
    word_count: int
    sentence_count: int

@app.get("/")
async def root():
    """健康检查端点"""
    return {
        "message": "英语阅读NLP服务运行正常",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """详细健康检查"""
    global nlp_model
    return {
        "status": "healthy" if nlp_model is not None else "unhealthy",
        "spacy_model_loaded": nlp_model is not None,
        "model_name": "en_core_web_sm" if nlp_model else None
    }

@app.post("/analyze", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    分析英语文本

    提供以下功能：
    - 句子分割
    - 词性标注
    - 命名实体识别
    - 语法依赖分析
    - 文本难度评估
    """
    global nlp_model

    if nlp_model is None:
        raise HTTPException(status_code=500, detail="NLP模型未加载")

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="文本不能为空")

    try:
        # 使用spaCy处理文本
        doc = nlp_model(request.text)

        # 基础统计
        word_count = len([token for token in doc if not token.is_space and not token.is_punct])
        sentence_count = len(list(doc.sents))

        response = TextAnalysisResponse(
            text=request.text,
            word_count=word_count,
            sentence_count=sentence_count
        )

        # 句子分割和词性标注
        if request.include_sentences or request.include_pos:
            sentences = []
            for sent in doc.sents:
                tokens = []
                if request.include_pos:
                    for token in sent:
                        if not token.is_space:
                            tokens.append({
                                "text": token.text,
                                "lemma": token.lemma_,
                                "pos": token.pos_,
                                "tag": token.tag_,
                                "is_alpha": token.is_alpha,
                                "is_stop": token.is_stop,
                                "start": token.idx,
                                "end": token.idx + len(token.text)
                            })

                sentences.append(SentenceInfo(
                    text=sent.text.strip(),
                    start=sent.start_char,
                    end=sent.end_char,
                    tokens=tokens
                ))

            response.sentences = sentences

        # 命名实体识别
        if request.include_ner:
            entities = []
            for ent in doc.ents:
                entities.append(EntityInfo(
                    text=ent.text,
                    label=ent.label_,
                    start=ent.start_char,
                    end=ent.end_char,
                    description=spacy.explain(ent.label_) or ent.label_
                ))
            response.entities = entities

        # 文本难度评估
        if request.include_difficulty:
            try:
                import textstat

                flesch_ease = textstat.flesch_reading_ease(request.text)
                flesch_grade = textstat.flesch_kincaid_grade(request.text)
                ari = textstat.automated_readability_index(request.text)
                coleman_liau = textstat.coleman_liau_index(request.text)
                gunning_fog = textstat.gunning_fog(request.text)
                smog = textstat.smog_index(request.text)

                # 根据Flesch Reading Ease确定难度等级
                if flesch_ease >= 90:
                    difficulty_level = "非常容易"
                elif flesch_ease >= 80:
                    difficulty_level = "容易"
                elif flesch_ease >= 70:
                    difficulty_level = "较容易"
                elif flesch_ease >= 60:
                    difficulty_level = "标准"
                elif flesch_ease >= 50:
                    difficulty_level = "较困难"
                elif flesch_ease >= 30:
                    difficulty_level = "困难"
                else:
                    difficulty_level = "非常困难"

                response.difficulty = DifficultyInfo(
                    flesch_reading_ease=flesch_ease,
                    flesch_kincaid_grade=flesch_grade,
                    automated_readability_index=ari,
                    coleman_liau_index=coleman_liau,
                    gunning_fog=gunning_fog,
                    smog_index=smog,
                    difficulty_level=difficulty_level
                )
            except Exception as e:
                logger.warning(f"难度评估失败: {e}")

        return response

    except Exception as e:
        logger.error(f"文本分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"文本分析失败: {str(e)}")

@app.post("/sentences")
async def extract_sentences(text: str):
    """提取句子（简化接口）"""
    global nlp_model

    if nlp_model is None:
        raise HTTPException(status_code=500, detail="NLP模型未加载")

    doc = nlp_model(text)
    sentences = [sent.text.strip() for sent in doc.sents]

    return {
        "sentences": sentences,
        "count": len(sentences)
    }

@app.post("/entities")
async def extract_entities(text: str):
    """提取命名实体（简化接口）"""
    global nlp_model

    if nlp_model is None:
        raise HTTPException(status_code=500, detail="NLP模型未加载")

    doc = nlp_model(text)
    entities = [
        {
            "text": ent.text,
            "label": ent.label_,
            "description": spacy.explain(ent.label_) or ent.label_
        }
        for ent in doc.ents
    ]

    return {
        "entities": entities,
        "count": len(entities)
    }

# =====================================================
# 词典管理API
# =====================================================

class DictionaryImportRequest(BaseModel):
    """词典导入请求"""
    file_name: str
    name: str
    description: str = ''
    priority: int = 100

class DictionaryUpdateRequest(BaseModel):
    """词典更新请求"""
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    is_enabled: Optional[bool] = None

class WordLookupRequest(BaseModel):
    """单词查询请求"""
    word: str
    dictionary_ids: Optional[List[int]] = None

@app.get("/dictionary/scan")
async def scan_dictionaries():
    """
    扫描可导入的词典文件

    扫描 data/dictionaries/ 目录下的词典文件
    """
    # 确保目录存在
    DICTIONARIES_DIR.mkdir(parents=True, exist_ok=True)

    files = scan_dictionary_files(str(DICTIONARIES_DIR))
    return {
        "directory": str(DICTIONARIES_DIR),
        "files": files,
        "count": len(files)
    }

@app.get("/dictionary/list")
async def list_dictionaries(enabled_only: bool = False):
    """获取已导入的词典列表"""
    importer = get_importer()
    dictionaries = importer.get_all_dictionaries(enabled_only)
    return {
        "dictionaries": dictionaries,
        "count": len(dictionaries)
    }

@app.get("/dictionary/lookup")
async def lookup_word(word: str, dictionary_ids: Optional[str] = None):
    """
    查询单词

    Args:
        word: 要查询的单词
        dictionary_ids: 指定词典ID，逗号分隔（可选）
    """
    if not word or not word.strip():
        raise HTTPException(status_code=400, detail="单词不能为空")

    importer = get_importer()

    # 解析词典ID列表
    dict_ids = None
    if dictionary_ids:
        try:
            dict_ids = [int(id.strip()) for id in dictionary_ids.split(',')]
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的词典ID格式")

    entries = importer.lookup_word(word.strip())

    return {
        "word": word,
        "entries": entries,
        "count": len(entries)
    }

@app.post("/dictionary/lookup")
async def lookup_word_post(request: WordLookupRequest):
    """查询单词（POST方式）"""
    if not request.word or not request.word.strip():
        raise HTTPException(status_code=400, detail="单词不能为空")

    importer = get_importer()
    entries = importer.lookup_word(request.word.strip())

    return {
        "word": request.word,
        "entries": entries,
        "count": len(entries)
    }

@app.get("/dictionary/{dictionary_id}")
async def get_dictionary(dictionary_id: int):
    """获取词典详情"""
    importer = get_importer()
    status = importer.get_import_status(dictionary_id)
    if not status:
        raise HTTPException(status_code=404, detail="词典不存在")
    return status

@app.get("/dictionary/{dictionary_id}/status")
async def get_dictionary_status(dictionary_id: int):
    """获取词典导入状态"""
    importer = get_importer()
    status = importer.get_import_status(dictionary_id)
    if not status:
        raise HTTPException(status_code=404, detail="词典不存在")
    return status

@app.post("/dictionary/import")
async def import_dictionary(request: DictionaryImportRequest, background_tasks: BackgroundTasks):
    """
    导入词典文件

    从 data/dictionaries/ 目录导入指定的词典文件
    """
    file_path = DICTIONARIES_DIR / request.file_name

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"文件不存在: {request.file_name}")

    # 检查文件格式
    try:
        file_info = DictionaryParser.get_file_info(str(file_path))
        if file_info['format'] == 'unknown':
            raise HTTPException(status_code=400, detail="不支持的文件格式")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"文件解析失败: {str(e)}")

    importer = get_importer()

    # 检查是否已存在同名词典
    existing = importer.db.get_dictionary_by_name(request.name)
    if existing:
        raise HTTPException(status_code=400, detail=f"词典 '{request.name}' 已存在")

    # 创建词典记录
    dictionary_id = importer.db.create_dictionary(
        name=request.name,
        source_format=file_info['format'],
        description=request.description,
        source_file=str(file_path),
        file_size=file_info['size'],
        priority=request.priority,
        import_status='pending',
        import_progress=0.0
    )

    # 在后台执行导入
    def do_import():
        try:
            importer.db.update_import_progress(dictionary_id, 0.0, 'importing')
            importer.import_dictionary(
                str(file_path),
                request.name,
                request.description,
                request.priority
            )
        except Exception as e:
            logger.error(f"导入词典失败: {e}")
            importer.db.update_import_progress(dictionary_id, 0.0, 'failed', error=str(e))

    # 由于词典记录已创建，需要删除后重新导入
    importer.db.delete_dictionary(dictionary_id)

    background_tasks.add_task(
        importer.import_dictionary,
        str(file_path),
        request.name,
        request.description,
        request.priority
    )

    return {
        "message": "导入任务已启动",
        "file_name": request.file_name,
        "name": request.name,
        "format": file_info['format'],
        "size_mb": file_info['size_mb']
    }

@app.put("/dictionary/{dictionary_id}")
async def update_dictionary(dictionary_id: int, request: DictionaryUpdateRequest):
    """更新词典信息"""
    importer = get_importer()

    # 检查词典是否存在
    existing = importer.db.get_dictionary_by_id(dictionary_id)
    if not existing:
        raise HTTPException(status_code=404, detail="词典不存在")

    # 构建更新字段
    updates = {}
    if request.name is not None:
        updates['name'] = request.name
    if request.description is not None:
        updates['description'] = request.description
    if request.priority is not None:
        updates['priority'] = request.priority
    if request.is_enabled is not None:
        updates['is_enabled'] = request.is_enabled

    if updates:
        importer.update_dictionary(dictionary_id, **updates)

    return {"message": "更新成功", "dictionary_id": dictionary_id}

@app.delete("/dictionary/{dictionary_id}")
async def delete_dictionary(dictionary_id: int):
    """删除词典"""
    importer = get_importer()

    # 检查词典是否存在
    existing = importer.db.get_dictionary_by_id(dictionary_id)
    if not existing:
        raise HTTPException(status_code=404, detail="词典不存在")

    importer.delete_dictionary(dictionary_id)
    return {"message": "删除成功", "dictionary_id": dictionary_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)