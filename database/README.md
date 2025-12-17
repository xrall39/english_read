# 数据库模块

英语阅读应用的数据库层，提供SQLite数据库支持和完整的数据管理功能。

## 文件结构

```
database/
├── schema.sql          # 数据库表结构定义
├── db_manager.py       # 数据库管理器（主要接口）
├── config.py          # 数据库配置
├── init_db.py         # 数据库初始化脚本
├── simple_init.py     # 简化版初始化脚本
├── test_db.py         # 数据库测试脚本
├── english_reading.db # SQLite数据库文件（运行后生成）
└── README.md          # 本文档
```

## 数据库表结构

### 核心表

1. **users** - 用户表
   - 存储用户基本信息、偏好设置、阅读等级
   - 支持用户认证和个性化配置

2. **articles** - 文章表
   - 存储文章内容、元数据、难度评估
   - 支持分类、标签、搜索功能

3. **vocabulary** - 生词本表
   - 用户个人生词收集和学习进度
   - 支持掌握程度跟踪和复习算法

4. **translation_cache** - 翻译缓存表
   - 缓存翻译结果，提高响应速度
   - 支持上下文相关翻译

5. **reading_history** - 阅读历史表
   - 跟踪用户阅读进度和行为
   - 支持断点续读和统计分析

6. **learning_stats** - 学习统计表
   - 每日学习数据统计
   - 支持学习进度可视化

## 快速开始

### 1. 初始化数据库

```bash
# 方法1：使用简化脚本
cd database
python simple_init.py

# 方法2：使用完整脚本
python init_db.py

# 重置数据库
python init_db.py reset

# 检查数据库状态
python init_db.py check

# 插入示例数据
python init_db.py sample
```

### 2. 使用数据库管理器

```python
from database.db_manager import DatabaseManager

# 创建数据库管理器实例
db = DatabaseManager()

# 创建文章
article_id = db.create_article(
    title="示例文章",
    content="文章内容...",
    difficulty_level="intermediate",
    category="education"
)

# 获取文章
article = db.get_article_by_id(article_id)

# 搜索文章
results = db.search_articles("关键词")

# 缓存翻译
db.cache_translation("hello", "zh", "你好")

# 获取翻译
translation = db.get_translation("hello", "zh")
```

### 3. 测试数据库功能

```bash
cd database
python test_db.py
```

## API参考

### DatabaseManager类

#### 文章操作
- `create_article(title, content, **kwargs)` - 创建文章
- `get_article_by_id(article_id)` - 获取文章
- `get_articles_by_difficulty(difficulty_level, limit)` - 按难度获取文章
- `search_articles(keyword, limit)` - 搜索文章

#### 用户操作
- `create_user(username, email, password_hash, **kwargs)` - 创建用户
- `get_user_by_email(email)` - 根据邮箱获取用户
- `get_user_by_id(user_id)` - 根据ID获取用户
- `update_user_login(user_id)` - 更新登录时间

#### 生词本操作
- `add_vocabulary(user_id, word, **kwargs)` - 添加生词
- `get_user_vocabulary(user_id, limit)` - 获取用户生词本
- `update_vocabulary_mastery(vocab_id, mastery_level, correct)` - 更新掌握程度

#### 翻译缓存操作
- `get_translation(source_text, target_language, context_hash)` - 获取翻译
- `cache_translation(source_text, target_language, translated_text, **kwargs)` - 缓存翻译

#### 阅读历史操作
- `update_reading_progress(user_id, article_id, progress, **kwargs)` - 更新阅读进度
- `get_reading_history(user_id, limit)` - 获取阅读历史
- `mark_article_completed(user_id, article_id, comprehension_score)` - 标记完成

#### 学习统计操作
- `update_daily_stats(user_id, **kwargs)` - 更新每日统计
- `get_user_stats(user_id, days)` - 获取学习统计

#### 维护操作
- `cleanup_old_cache(days)` - 清理旧缓存
- `get_database_stats()` - 获取数据库统计

## 配置说明

### 数据库配置 (config.py)

```python
# SQLite配置（开发环境）
DATABASE_CONFIG = {
    'sqlite': {
        'path': 'english_reading.db',
        'timeout': 30.0,
    }
}

# PostgreSQL配置（生产环境）
DATABASE_CONFIG = {
    'postgresql': {
        'host': 'localhost',
        'port': 5432,
        'database': 'english_reading',
        # ...
    }
}
```

### 环境变量

- `DATABASE_TYPE` - 数据库类型 (sqlite/postgresql)
- `DB_HOST` - 数据库主机
- `DB_PORT` - 数据库端口
- `DB_NAME` - 数据库名称
- `DB_USER` - 数据库用户
- `DB_PASSWORD` - 数据库密码

## 性能优化

### 索引策略
- 为常用查询字段创建索引
- 复合索引优化多字段查询
- 定期分析查询性能

### 缓存策略
- 翻译结果缓存减少API调用
- 定期清理过期缓存数据
- 使用使用频率优化缓存策略

### 数据维护
- 定期清理过期数据
- 优化数据库文件大小
- 监控数据库性能指标

## 迁移到PostgreSQL

生产环境建议使用PostgreSQL：

1. 安装PostgreSQL
2. 创建数据库和用户
3. 设置环境变量
4. 运行迁移脚本（待开发）

## 故障排除

### 常见问题

1. **数据库文件权限错误**
   ```bash
   chmod 664 english_reading.db
   ```

2. **编码问题**
   - 确保所有Python文件使用UTF-8编码
   - 数据库连接使用正确的字符集

3. **并发访问问题**
   - SQLite支持读并发，写操作需要排队
   - 生产环境建议使用PostgreSQL

### 调试技巧

1. 启用SQL日志
2. 使用数据库浏览器工具
3. 监控查询性能
4. 检查索引使用情况

## 开发指南

### 添加新表
1. 在`schema.sql`中定义表结构
2. 在`db_manager.py`中添加操作方法
3. 更新测试脚本
4. 更新文档

### 数据迁移
1. 创建迁移脚本
2. 备份现有数据
3. 执行迁移
4. 验证数据完整性

## 许可证

MIT License