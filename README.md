# 英语阅读应用

一个基于Next.js和Python的智能英语阅读学习平台，提供文本分析、翻译和生词本功能。

## 项目结构

```
english_read/
├── frontend/           # Next.js 16前端应用
│   ├── src/
│   │   ├── app/       # App Router页面
│   │   ├── components/ # React组件
│   │   ├── lib/       # 工具函数
│   │   └── types/     # TypeScript类型
│   ├── public/        # 静态资源
│   └── package.json
├── backend/           # Python NLP微服务
│   ├── main.py        # FastAPI应用
│   ├── requirements.txt
│   └── test_nlp.py    # 测试文件
├── database/          # 数据库相关文件
├── docs/             # 项目文档
│   ├── frontend.md   # 前端文档
│   └── nlp-service.md # NLP服务文档
├── CLAUDE.md         # Claude Code配置
└── todo.md          # 开发任务清单
```

## 技术栈

### 前端 (Frontend)
- **Next.js 16** - React框架，使用App Router
- **TypeScript** - 类型安全
- **Tailwind CSS v4** - 样式框架
- **shadcn/ui** - UI组件库工具函数

### 后端 (Backend)
- **FastAPI** - Python异步Web框架
- **spaCy 3.8.11** - 自然语言处理
- **textstat** - 文本难度评估
- **uvicorn** - ASGI服务器

### 数据库
- **SQLite** - 轻量级数据库（开发环境）
- **PostgreSQL** - 生产环境数据库（计划）

## 快速开始

### 1. 启动后端NLP服务

```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python main.py
```

NLP服务将在 http://localhost:8000 启动

### 2. 启动前端应用

```bash
cd frontend
pnpm install
pnpm run dev
```

前端应用将在 http://localhost:3000 启动

### 3. 验证服务

```bash
# 测试NLP服务
cd backend
python simple_test.py

# 访问API文档
# http://localhost:8000/docs
```

## 功能特性

### 已完成 ✅
- **NLP文本分析服务**
  - 句子分割和词性标注
  - 命名实体识别(NER)
  - 文本难度评估（多种算法）
  - RESTful API接口
- **项目基础架构**
  - Next.js 14项目搭建
  - TypeScript配置
  - Tailwind CSS v4样式系统
  - 项目文档和测试

### 开发中 🔄
- SQLite数据库配置
- Next.js API路由开发
- 基础阅读器组件

### 计划中 📋
- 翻译服务集成
- 生词本系统
- 用户界面开发
- AI增强功能

## API接口

### NLP服务端点

- `GET /health` - 健康检查
- `POST /analyze` - 完整文本分析
- `POST /sentences` - 句子提取
- `POST /entities` - 实体提取

详细API文档：http://localhost:8000/docs

## 开发指南

### 环境要求
- Node.js 18+
- Python 3.8+
- Git

### 开发流程
1. 查看 `todo.md` 了解当前开发任务
2. 按照任务优先级进行开发
3. 完成后更新任务状态并提交代码

### 代码规范
- 前端：遵循Next.js和TypeScript最佳实践
- 后端：遵循FastAPI和Python PEP8规范
- 提交：使用语义化提交信息

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！