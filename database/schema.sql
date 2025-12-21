-- 英语阅读应用数据库模式
-- SQLite数据库表结构定义

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    preferences TEXT, -- JSON格式存储用户偏好设置
    reading_level VARCHAR(20) DEFAULT 'intermediate' -- beginner, intermediate, advanced
);

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    source_url VARCHAR(500),
    author VARCHAR(100),
    published_date DATE,
    difficulty_level VARCHAR(20), -- 自动计算的难度等级
    word_count INTEGER,
    sentence_count INTEGER,
    flesch_score REAL, -- Flesch Reading Ease分数
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tags TEXT, -- JSON格式存储标签
    category VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en'
);

-- 生词本表
CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    word VARCHAR(100) NOT NULL,
    definition TEXT,
    pronunciation VARCHAR(200),
    example_sentence TEXT,
    translation TEXT, -- 中文翻译
    difficulty_level INTEGER DEFAULT 1, -- 1-5难度等级
    mastery_level INTEGER DEFAULT 0, -- 0-5掌握程度
    first_encountered DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_reviewed DATETIME,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    source_article_id INTEGER,
    context TEXT, -- 遇到这个词的上下文
    word_type VARCHAR(20), -- noun, verb, adjective等
    -- 间隔重复算法字段
    next_review DATETIME, -- 下次复习时间
    ease_factor REAL DEFAULT 2.5, -- 难度因子 (SM-2算法)
    interval_days INTEGER DEFAULT 0, -- 当前间隔天数
    consecutive_correct INTEGER DEFAULT 0, -- 连续正确次数
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (source_article_id) REFERENCES articles(id) ON DELETE SET NULL,
    UNIQUE(user_id, word)
);

-- 翻译缓存表
CREATE TABLE IF NOT EXISTS translation_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_text VARCHAR(500) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    translation_service VARCHAR(50), -- 翻译服务来源
    confidence_score REAL, -- 翻译置信度
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 1,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    context_hash VARCHAR(64), -- 上下文哈希，用于上下文相关翻译
    UNIQUE(source_text, target_language, context_hash)
);

-- 阅读历史表
CREATE TABLE IF NOT EXISTS reading_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    reading_progress REAL DEFAULT 0.0, -- 阅读进度百分比
    reading_time INTEGER DEFAULT 0, -- 阅读时间（秒）
    words_looked_up INTEGER DEFAULT 0, -- 查词次数
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_position INTEGER DEFAULT 0, -- 最后阅读位置
    completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    reading_speed REAL, -- 阅读速度（词/分钟）
    comprehension_score REAL, -- 理解度评分
    notes TEXT, -- 用户笔记
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE(user_id, article_id)
);

-- 学习统计表
CREATE TABLE IF NOT EXISTS learning_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    words_learned INTEGER DEFAULT 0,
    articles_read INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0, -- 总阅读时间（秒）
    vocabulary_reviewed INTEGER DEFAULT 0,
    accuracy_rate REAL DEFAULT 0.0, -- 词汇测试准确率
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

-- 学习会话表（间隔重复学习系统）
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_type VARCHAR(20) NOT NULL,  -- 'learn' 新学习 或 'review' 复习
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    words_studied INTEGER DEFAULT 0,     -- 学习的单词数
    words_correct INTEGER DEFAULT 0,     -- 正确数
    words_incorrect INTEGER DEFAULT 0,   -- 错误数
    duration_seconds INTEGER DEFAULT 0,  -- 学习时长（秒）
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE INDEX IF NOT EXISTS idx_articles_difficulty ON articles(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);

CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON vocabulary(word);
CREATE INDEX IF NOT EXISTS idx_vocabulary_mastery ON vocabulary(mastery_level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_last_reviewed ON vocabulary(last_reviewed);

CREATE INDEX IF NOT EXISTS idx_translation_cache_source ON translation_cache(source_text);
CREATE INDEX IF NOT EXISTS idx_translation_cache_created_at ON translation_cache(created_at);

CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_article_id ON reading_history(article_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_started_at ON reading_history(started_at);

CREATE INDEX IF NOT EXISTS idx_learning_stats_user_date ON learning_stats(user_id, date);

-- 间隔重复学习相关索引
CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review ON vocabulary(next_review);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_next_review ON vocabulary(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_mastery ON vocabulary(user_id, mastery_level);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_date ON learning_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_date ON learning_sessions(user_id, started_at);

-- 创建触发器自动更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_articles_updated_at
    AFTER UPDATE ON articles
    FOR EACH ROW
    BEGIN
        UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;