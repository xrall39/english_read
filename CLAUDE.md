# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Next.js 14 的英语阅读应用，使用 App Router 架构。项目采用 TypeScript 开发，使用 Tailwind CSS v4 进行样式设计，并集成了 shadcn/ui 组件库的工具函数。

## 开发命令

### 基本开发命令
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行 ESLint 检查
npm run lint
```

### 项目结构
- `src/app/` - Next.js App Router 页面和布局
- `src/lib/` - 工具函数和共享逻辑
- `public/` - 静态资源文件
- 项目使用 `@/*` 路径别名指向 `./src/*`

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

### 开发工具
- **ESLint** - 代码检查，使用 Next.js 推荐配置
- **PostCSS** - CSS 处理，配置了 Tailwind CSS v4 插件

## 样式系统

项目使用 Tailwind CSS v4 的新特性：
- 自定义变体：`@custom-variant dark (&:is(.dark *))`
- 内联主题配置：`@theme inline`
- 支持亮色/暗色主题切换
- 使用 OKLCH 颜色空间定义颜色变量
- 预设了完整的设计系统颜色（primary, secondary, muted, accent, destructive 等）

## 开发约定

### 任务管理
- 项目根目录下有 todo 文件用于跟踪开发任务
- 开发前应将商量好的待办任务添加到文件中
- 完成任务时标记为已完成以跟踪进度
- 合理使用 Task 工具创建多个子代理并行开发

### 代码组织
- 使用 `src/lib/utils.ts` 中的 `cn()` 函数合并 CSS 类名
- 遵循 Next.js App Router 的文件约定
- TypeScript 严格模式已启用
- 使用 Geist 字体系列（Sans 和 Mono）

## 配置文件说明

- `next.config.ts` - Next.js 配置（当前为默认配置）
- `tsconfig.json` - TypeScript 配置，包含路径别名
- `eslint.config.mjs` - ESLint 配置，使用 Next.js 推荐规则
- `postcss.config.mjs` - PostCSS 配置，仅包含 Tailwind CSS v4 插件