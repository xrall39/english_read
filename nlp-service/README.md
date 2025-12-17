# 英语阅读NLP微服务

基于FastAPI和spaCy的英语文本分析服务，为英语阅读应用提供文本处理功能。

## 功能特性

- 📝 **句子分割** - 智能识别句子边界
- 🏷️ **词性标注** - 识别词汇的语法角色
- 🎯 **命名实体识别** - 识别人名、地名、组织等
- 📊 **难度评估** - 多种算法评估文本难度
- ⚡ **高性能** - 异步处理，支持并发请求
- 📚 **完整文档** - 自动生成的API文档

## 快速开始

### 1. 安装依赖

```bash
# 进入NLP服务目录
cd nlp-service

# 运行安装脚本（推荐）
python setup.py

# 或手动安装
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. 启动服务

```bash
# 方式1：直接运行
python main.py

# 方式2：使用uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 验证安装

```bash
# 运行测试
python test_nlp.py

# 或访问健康检查端点
curl http://localhost:8000/health
```

## API接口

### 基础端点

- `GET /` - 服务状态
- `GET /health` - 健康检查
- `GET /docs` - API文档（Swagger UI）

### 文本分析

#### 完整分析 `POST /analyze`

```json
{
  "text": "Apple Inc. is a technology company. Tim Cook is the CEO.",
  "include_sentences": true,
  "include_pos": true,
  "include_ner": true,
  "include_dependencies": false,
  "include_difficulty": true
}
```

**响应示例：**

```json
{
  "text": "Apple Inc. is a technology company. Tim Cook is the CEO.",
  "word_count": 10,
  "sentence_count": 2,
  "sentences": [
    {
      "text": "Apple Inc. is a technology company.",
      "start": 0,
      "end": 35,
      "tokens": [
        {
          "text": "Apple",
          "lemma": "Apple",
          "pos": "PROPN",
          "tag": "NNP",
          "is_alpha": true,
          "is_stop": false,
          "start": 0,
          "end": 5
        }
      ]
    }
  ],
  "entities": [
    {
      "text": "Apple Inc.",
      "label": "ORG",
      "start": 0,
      "end": 10,
      "description": "Companies, agencies, institutions, etc."
    },
    {
      "text": "Tim Cook",
      "label": "PERSON",
      "start": 36,
      "end": 44,
      "description": "People, including fictional"
    }
  ],
  "difficulty": {
    "flesch_reading_ease": 83.66,
    "flesch_kincaid_grade": 2.9,
    "automated_readability_index": 3.4,
    "coleman_liau_index": 8.71,
    "gunning_fog": 4.8,
    "smog_index": 3.1,
    "difficulty_level": "容易"
  }
}
```

#### 简化接口

**句子提取** `POST /sentences`
```bash
curl -X POST "http://localhost:8000/sentences" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Hello world! This is a test."
```

**实体提取** `POST /entities`
```bash
curl -X POST "http://localhost:8000/entities" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Apple Inc. was founded by Steve Jobs."
```

## 难度评估算法

服务使用多种算法评估文本难度：

| 算法 | 描述 | 适用场景 |
|------|------|----------|
| Flesch Reading Ease | 基于句长和音节数 | 通用可读性评估 |
| Flesch-Kincaid Grade | 美国学年等级 | 教育内容分级 |
| Automated Readability Index | 基于字符和句子 | 技术文档评估 |
| Coleman-Liau Index | 基于字符数 | 学术文本评估 |
| Gunning Fog Index | 复杂词汇比例 | 商业文档评估 |
| SMOG Index | 多音节词汇 | 健康教育材料 |

### 难度等级

- **非常容易** (90-100): 小学5年级水平
- **容易** (80-89): 小学6年级水平
- **较容易** (70-79): 初中7年级水平
- **标准** (60-69): 初中8-9年级水平
- **较困难** (50-59): 高中水平
- **困难** (30-49): 大学水平
- **非常困难** (0-29): 研究生水平

## 开发指南

### 项目结构

```
nlp-service/
├── main.py           # FastAPI应用主文件
├── requirements.txt  # Python依赖
├── setup.py         # 安装脚本
├── test_nlp.py      # 测试文件
└── README.md        # 文档
```

### 扩展功能

要添加新的分析功能，可以：

1. 在 `main.py` 中添加新的端点
2. 扩展 `TextAnalysisRequest` 模型
3. 在 `analyze_text` 函数中添加处理逻辑
4. 更新测试文件

### 性能优化

- 服务启动时预加载spaCy模型
- 使用异步处理支持并发
- 可选择性启用分析功能
- 缓存常用分析结果（待实现）

## 故障排除

### 常见问题

1. **spaCy模型未找到**
   ```bash
   python -m spacy download en_core_web_sm
   ```

2. **端口被占用**
   ```bash
   # 更改端口
   uvicorn main:app --port 8001
   ```

3. **依赖安装失败**
   ```bash
   # 升级pip
   pip install --upgrade pip
   # 使用国内镜像
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
   ```

### 日志调试

服务使用Python logging模块，可以通过环境变量调整日志级别：

```bash
export PYTHONPATH=.
export LOG_LEVEL=DEBUG
python main.py
```

## 集成示例

### Next.js集成

```typescript
// lib/nlp-client.ts
export async function analyzeText(text: string) {
  const response = await fetch('http://localhost:8000/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      include_sentences: true,
      include_pos: true,
      include_ner: true,
      include_difficulty: true,
    }),
  });

  if (!response.ok) {
    throw new Error('NLP分析失败');
  }

  return response.json();
}
```

### Python客户端

```python
import httpx

async def analyze_text(text: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/analyze",
            json={
                "text": text,
                "include_sentences": True,
                "include_pos": True,
                "include_ner": True,
                "include_difficulty": True,
            }
        )
        return response.json()
```

## 许可证

MIT License