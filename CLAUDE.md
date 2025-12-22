# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Next.js 16 的英语阅读应用，使用 App Router 架构。项目采用 TypeScript 开发，使用 Tailwind CSS v4 进行样式设计，并集成了 shadcn/ui 组件库的工具函数。

## 开发命令

### 前端开发命令
```bash
# 进入前端目录
cd frontend

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行 ESLint 检查
npm run lint
```

### 后端开发命令
```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 下载spaCy模型
python -m spacy download en_core_web_sm

# 启动NLP服务 (默认端口8000)
python main.py

# 运行测试
python simple_test.py
```

### 数据库开发命令
```bash
# 进入数据库目录
cd database

# 初始化数据库
python db_manager.py

# 运行数据库测试
python test_db.py
```

### 集成测试命令
```bash
# 在项目根目录运行 API 集成测试
python test_api.py
```

### 项目结构
- `frontend/` - Next.js 16.0.10前端应用
  - `src/app/` - App Router 页面和布局
  - `src/app/api/` - Next.js API路由层
  - `src/components/` - React 组件库
    - `layout/` - 布局组件（Header, MainLayout）
    - `reader/` - 阅读器组件（Reader, ArticleContent, ReaderToolbar）
    - `translation/` - 翻译组件（TranslationPopup）
    - `history/` - 阅读历史组件（HistoryCard, HistoryList）
    - `vocabulary/` - 生词本组件（VocabularyCard, VocabularyList）
    - `learn/` - 学习模式组件（FlashCard, LearningControls, LearningProgress, LearningComplete）
  - `src/hooks/` - 自定义 Hooks（useTextSelection, useTheme）
  - `src/types/` - TypeScript 类型定义（api.ts）
  - `src/lib/` - 工具函数和共享逻辑
  - `public/` - 静态资源文件
  - 使用 `@/*` 路径别名指向 `./src/*`
- `backend/` - Python NLP微服务 (FastAPI + spaCy)
  - `main.py` - FastAPI应用主文件
  - `requirements.txt` - Python依赖
- `database/` - SQLite数据库层
  - `schema.sql` - 数据库表结构定义
  - `db_manager.py` - 数据库管理器和CRUD操作
  - `test_db.py` - 数据库功能测试
- `docs/` - 项目文档

## 技术栈配置

### 核心技术
- **Next.js 16.0.10** - React 框架，使用 App Router
- **React 19.2.1** - UI 库
- **TypeScript 5** - 类型安全
- **Tailwind CSS v4** - 样式框架，使用 PostCSS 插件

### UI 组件
- **class-variance-authority** - 组件变体管理
- **clsx** + **tailwind-merge** - 条件样式合并（通过 `cn()` 工具函数）
- **lucide-react** - 图标库
- **tw-animate-css** - Tailwind 动画扩展

### 后端技术
- **FastAPI** - 异步Web框架
- **spaCy 3.8.11** + `en_core_web_sm` - NLP处理和英语模型
- **textstat** - 文本难度评估算法
- **uvicorn** - ASGI服务器
- **pydantic** - 数据验证

### 开发工具
- **ESLint 9** - 代码检查，使用 Next.js 推荐配置
- **PostCSS** - CSS 处理，配置了 Tailwind CSS v4 插件

## 样式系统

项目使用 Tailwind CSS v4 的新特性：
- 自定义变体：`@custom-variant dark (&:is(.dark *))`
- 内联主题配置：`@theme inline`
- 支持亮色/暗色主题切换
- 使用 OKLCH 颜色空间定义颜色变量
- 预设了完整的设计系统颜色（primary, secondary, muted, accent, destructive 等）

## API架构

### 前端页面路由
- `/` - 首页
- `/reader` - 文章阅读器
- `/history` - 阅读历史
- `/vocabulary` - 生词本
- `/learn` - 学习模式
- `/stats` - 学习统计

### 三层API结构
1. **Python NLP微服务** (端口8000)
   - `/analyze` - 完整文本分析（句子分割、词性标注、NER、难度评估）
   - `/sentences` - 句子提取
   - `/entities` - 命名实体识别
   - `/health` - 健康检查

2. **Next.js API路由层** (端口3000)
   - `/api/nlp` - NLP服务代理和健康检查
   - `/api/translate` - 翻译服务（本地词典 + 缓存机制）
   - `/api/articles` - 文章管理（CRUD + 搜索）
   - `/api/articles/[id]` - 单个文章操作
   - `/api/history` - 阅读历史管理
   - `/api/vocabulary` - 生词本管理
   - `/api/learn` - 学习模式（获取待复习单词、更新学习进度）
   - `/api/stats` - 学习统计数据

3. **数据库管理层**
   - `DatabaseManager`类提供完整CRUD操作
   - 支持7个核心表：users, articles, vocabulary, translation_cache, reading_history, learning_stats, learning_sessions
   - 事务支持和连接池管理

### 数据库设计
- **SQLite** (开发环境) → **PostgreSQL** (生产环境)
- 完整的索引策略和外键约束
- JSON字段存储复杂数据（用户偏好、标签等）
- 自动更新触发器和级联删除

## 开发约定

### 任务管理
- 项目根目录下有 `todo.md` 文件用于跟踪开发任务
- 开发前应将商量好的待办任务添加到文件中
- 完成任务时标记为已完成以跟踪进度
- 合理使用 Task 工具创建多个子代理并行开发

### 代码组织
- 使用 `src/lib/utils.ts` 中的 `cn()` 函数合并 CSS 类名
- 遵循 Next.js App Router 的文件约定
- TypeScript 严格模式已启用
- 使用 Geist 字体系列（Sans 和 Mono）

### 翻译服务策略
- **本地词典优先**：100+常用词汇，响应最快
- **翻译缓存**：上下文感知的缓存机制
- **在线API预留**：支持Google/百度等翻译服务扩展

### 学习算法
- **SM-2间隔重复算法**：基于艾宾浩斯遗忘曲线的复习调度
- 算法实现位于 `frontend/src/lib/spaced-repetition.ts`
- 支持简单模式（认识/不认识）和高级模式（0-5评分）

## 配置文件说明

- `next.config.ts` - Next.js 配置（当前为默认配置）
- `tsconfig.json` - TypeScript 配置，包含路径别名
- `eslint.config.mjs` - ESLint 配置，使用 Next.js 推荐规则
- `postcss.config.mjs` - PostCSS 配置，仅包含 Tailwind CSS v4 插件
- `components.json` - shadcn/ui配置（New York风格）

## 环境变量

- `NLP_SERVICE_URL` - Python NLP服务地址（默认：`http://localhost:8000`）