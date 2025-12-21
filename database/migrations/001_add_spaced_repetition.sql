-- 间隔重复学习系统数据库迁移
-- 版本: 001
-- 日期: 2025-12-21
-- 描述: 添加间隔重复算法所需的字段和学习会话表

-- ============================================
-- 1. vocabulary 表新增字段
-- ============================================

-- 下次复习时间
ALTER TABLE vocabulary ADD COLUMN next_review DATETIME;

-- 难度因子 (SM-2算法核心参数，默认2.5)
ALTER TABLE vocabulary ADD COLUMN ease_factor REAL DEFAULT 2.5;

-- 当前间隔天数
ALTER TABLE vocabulary ADD COLUMN interval_days INTEGER DEFAULT 0;

-- 连续正确次数
ALTER TABLE vocabulary ADD COLUMN consecutive_correct INTEGER DEFAULT 0;

-- ============================================
-- 2. 新增索引优化查询性能
-- ============================================

-- 按下次复习时间查询索引
CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review ON vocabulary(next_review);

-- 用户+下次复习时间复合索引（获取用户待复习单词）
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_next_review ON vocabulary(user_id, next_review);

-- 用户+掌握程度复合索引（统计查询）
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_mastery ON vocabulary(user_id, mastery_level);

-- ============================================
-- 3. 学习会话表
-- ============================================

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

-- 学习会话索引
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_date ON learning_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_date ON learning_sessions(user_id, started_at);

-- ============================================
-- 4. 更新 learning_stats 表（如果需要）
-- ============================================

-- 确保 learning_stats 表有正确的结构（已存在则跳过）
-- 该表用于每日学习统计汇总
