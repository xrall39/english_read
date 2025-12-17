"""
英语阅读NLP微服务
提供文本分析、句子分割、词性标注、命名实体识别等功能
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import spacy
import logging
from contextlib import asynccontextmanager

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局变量存储spaCy模型
nlp_model = None

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)