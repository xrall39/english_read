# 英语阅读网页开发任务清单

## 第一阶段：项目基础搭建（后端优先）

### 1. Next.js项目初始化
- [x] 创建Next.js 14项目（App Router）
- [x] 配置TypeScript和ESLint
- [x] 设置Tailwind CSS v4
- [x] 初始化shadcn/ui组件库
- [x] 创建基础项目目录结构

### 2. Python NLP微服务开发（优先）
- [x] 创建FastAPI应用框架
- [x] 安装和配置spaCy英语模型
- [x] 实现文本分析API
  - [x] 句子分割（sentence segmentation）
  - [x] 词性标注（POS tagging）
  - [x] 命名实体识别（NER）
  - [x] 语法分析（dependency parsing）
- [x] 添加难度评估算法
- [x] 创建API文档和测试

### 3. 数据库配置
- [x] 配置SQLite数据库
- [x] 创建数据库模式
  - [x] 文章表（articles）
  - [x] 用户表（users）
  - [x] 生词本表（vocabulary）
  - [x] 翻译缓存表（translation_cache）
  - [x] 阅读历史表（reading_history）
  - [x] 学习统计表（learning_stats）
- [x] 创建数据库初始化脚本
- [x] 实现完整数据库管理器（DatabaseManager）
- [x] 添加索引和触发器优化
- [x] 创建数据库测试脚本

### 4. Next.js后端API开发
- [x] 创建翻译API路由（/api/translate）
  - [x] POST: 文本翻译，支持缓存和上下文
  - [x] GET: 简单翻译查询
  - [x] 集成本地词典（100+常用词汇）
- [x] 创建NLP分析API路由（/api/nlp）
  - [x] POST: 完整文本分析
  - [x] GET: 健康检查和服务状态
- [x] 创建文章管理API路由（/api/articles）
  - [x] POST: 创建文章，自动NLP分析
  - [x] GET: 获取文章列表，支持搜索筛选
  - [x] PUT/DELETE: 单个文章操作（/api/articles/[id]）
- [x] 实现NLP服务集成和代理
- [x] 添加完整错误处理和参数验证
- [x] TypeScript类型安全和接口定义

## 第二阶段：核心翻译功能

### 5. 翻译服务开发
- [x] 实现混合翻译策略
  - [x] 本地词典查询（优先级最高）
  - [ ] 在线翻译API集成（Google/百度等）
  - [ ] AI翻译接口预留
- [x] 开发翻译缓存机制
- [x] 实现上下文感知翻译（context_hash）
- [ ] 添加翻译质量评估
- [ ] 翻译服务性能优化

### 6. 前端基础组件
- [x] 创建基础Layout组件（Header.tsx, MainLayout.tsx）
- [x] 开发文章阅读器组件（Reader.tsx, ArticleContent.tsx等）
- [x] 实现文本选择逻辑（useTextSelection.ts Hook）
- [x] 创建翻译弹窗组件（TranslationPopup.tsx）
- [x] 添加键盘快捷键支持（ESC关闭弹窗）

## 第三阶段：用户界面开发

### 7. 阅读器界面
- [x] 开发文章导入功能（/reader页面）
- [x] 实现阅读进度跟踪（ReadingProgress.tsx）
- [x] 创建阅读历史记录页面（/history）
- [x] 添加响应式布局
- [x] 实现主题切换功能（useTheme.ts Hook）

### 8. 交互优化
- [x] 优化文本选择体验
- [x] 改进翻译弹窗定位（智能避免超出视口）
- [x] 添加动画效果（弹窗淡入动画）
- [x] 实现沉浸式阅读模式（ReaderToolbar.tsx）

## 第四阶段：高级功能

### 9. 生词本系统
- [x] 开发生词本组件（VocabularyCard、VocabularyList）
- [x] 实现单词收藏功能（翻译弹窗集成）
- [x] 创建生词本页面（/vocabulary）
- [x] 创建生词本API路由（/api/vocabulary）
- [ ] 添加学习模式
- [ ] 创建复习算法
- [ ] 实现学习进度统计

### 10. AI增强功能
- [ ] 集成AI翻译服务
- [ ] 实现智能翻译建议
- [ ] 添加个性化学习推荐
- [ ] 优化翻译准确性

## 第五阶段：测试和优化

### 11. 测试
- [ ] 单元测试核心功能
- [ ] 集成测试用户流程
- [ ] 性能测试和优化
- [ ] 跨浏览器兼容性测试

### 12. 部署和监控
- [ ] 配置生产环境部署
- [ ] 数据库迁移到PostgreSQL
- [ ] 添加监控和日志系统
- [ ] 用户反馈收集

## 当前进度

### ✅ 已完成（第一阶段 + 第二阶段 + 第三阶段 + 第四阶段部分）
- [x] 项目规划和架构设计
- [x] 初始化Next.js 14项目（App Router）
- [x] 配置TypeScript和ESLint
- [x] 设置Tailwind CSS v4
- [x] 初始化shadcn/ui组件库
- [x] 项目目录结构整理（前后端分离）
- [x] 创建Python NLP微服务（FastAPI + spaCy）
- [x] 实现完整文本分析API（句子分割、词性标注、NER、难度评估）
- [x] 配置SQLite数据库和完整数据模式
- [x] 实现数据库管理器和所有CRUD操作
- [x] 创建Next.js API路由（翻译、NLP、文章管理）
- [x] 集成本地词典和翻译缓存机制
- [x] 修复后端依赖（添加spaCy到requirements.txt）
- [x] 修复数据库SQL注入风险
- [x] 完善数据库测试覆盖
- [x] 统一TypeScript类型定义（frontend/src/types/）
- [x] 创建基础Layout组件（Header、MainLayout）
- [x] 实现主题切换功能（亮色/深色/系统）
- [x] 开发文章阅读器组件（Reader、ArticleContent等）
- [x] 实现阅读进度跟踪和沉浸式阅读模式
- [x] 创建翻译弹窗组件（TranslationPopup）
- [x] 实现文本选择Hook（useTextSelection）
- [x] 开发阅读器页面（/reader）
- [x] 创建阅读历史API路由（/api/history）
- [x] 创建阅读历史页面（/history）
- [x] 创建生词本API路由（/api/vocabulary）
- [x] 创建生词本页面（/vocabulary）
- [x] 集成翻译弹窗添加生词功能

### 🔄 正在进行
- [ ] 在线翻译API集成
- [ ] 学习模式开发

### 📋 下一步计划
- [ ] 用户认证功能
- [ ] AI翻译服务集成
- [ ] 学习统计可视化
- [ ] 复习算法实现

## 技术架构总览

### 🏗️ 项目结构
```
english_read/
├── frontend/                    # Next.js 16前端应用 ✅
│   ├── src/app/api/            # API路由层 ✅
│   │   ├── articles/           # 文章管理API ✅
│   │   ├── history/            # 阅读历史API ✅
│   │   ├── nlp/                # NLP分析API ✅
│   │   ├── translate/          # 翻译API ✅
│   │   └── vocabulary/         # 生词本API ✅
│   ├── src/app/reader/         # 阅读器页面 ✅
│   ├── src/app/history/        # 阅读历史页面 ✅
│   ├── src/app/vocabulary/     # 生词本页面 ✅
│   ├── src/components/layout/  # 布局组件 ✅
│   ├── src/components/reader/  # 阅读器组件 ✅
│   ├── src/components/translation/ # 翻译组件 ✅
│   ├── src/components/history/ # 阅读历史组件 ✅
│   ├── src/components/vocabulary/ # 生词本组件 ✅
│   ├── src/hooks/              # 自定义Hooks ✅
│   └── src/types/              # TypeScript类型 ✅
├── backend/                    # Python NLP微服务 ✅
├── database/                   # SQLite数据库层 ✅
├── docs/                       # 项目文档 ✅
└── test_api.py                 # API集成测试 ✅
```

### 🔧 技术栈
- **前端**: Next.js 14 + TypeScript + Tailwind CSS v4
- **后端**: FastAPI + spaCy 3.8.11 + uvicorn
- **数据库**: SQLite (开发) → PostgreSQL (生产)
- **NLP**: 句子分割、词性标注、NER、难度评估
- **翻译**: 本地词典 + 缓存机制 + 在线API预留

### 📊 开发进度
- **第一阶段**: 后端基础设施 ✅ (100%)
- **第二阶段**: 核心翻译功能 ✅ (90%)
- **第三阶段**: 前端界面开发 ✅ (100%)
- **第四阶段**: 高级功能 🔄 (40%)
- **第五阶段**: 测试和优化 📋 (0%)

## 备注
- ✅ 后端功能已完成（Python NLP微服务 + Next.js API + 数据库）
- ✅ 前端核心功能已完成（阅读器、翻译弹窗、主题切换）
- ✅ 阅读历史和生词本系统已完成
- 🔄 当前重点：在线翻译API集成、学习模式
- 📋 下一步：用户认证、AI翻译服务

## 最近更新记录

### 2025-12-17 更新（第二次）
- 创建阅读历史API路由 (`/api/history`)
- 创建阅读历史页面 (`/history`)
- 创建阅读历史组件 (HistoryCard, HistoryList)
- 创建生词本API路由 (`/api/vocabulary`)
- 创建生词本页面 (`/vocabulary`)
- 创建生词本组件 (VocabularyCard, VocabularyList)
- 集成翻译弹窗添加生词功能
- 支持按掌握程度筛选生词
- 支持搜索单词和翻译

### 2025-12-17 更新（第一次）
- 修复 `requirements.txt` 缺少 spaCy 依赖
- 修复 `db_manager.py` SQL注入风险
- 完善数据库测试覆盖
- 创建共享TypeScript类型定义 (`frontend/src/types/`)
- 创建基础Layout组件 (Header, MainLayout)
- 实现主题切换功能 (useTheme Hook)
- 开发文章阅读器组件 (Reader, ArticleContent等)
- 实现文本选择和翻译弹窗功能
- 创建阅读器页面 (/reader)