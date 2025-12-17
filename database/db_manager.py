# -*- coding: utf-8 -*-
"""
数据库管理模块
提供数据库连接和基础CRUD操作
"""

import sqlite3
import json
from datetime import datetime, date
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from contextlib import contextmanager

class DatabaseManager:
    """数据库管理器"""

    def __init__(self, db_path: Optional[str] = None):
        """
        初始化数据库管理器

        Args:
            db_path: 数据库文件路径，如果为None则使用默认路径
        """
        if db_path is None:
            current_dir = Path(__file__).parent
            db_path = current_dir / "english_reading.db"

        self.db_path = str(db_path)

    @contextmanager
    def get_connection(self):
        """获取数据库连接的上下文管理器"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 使结果可以通过列名访问
        try:
            yield conn
        finally:
            conn.close()

    def execute_query(self, query: str, params: tuple = ()) -> List[Dict]:
        """
        执行查询并返回结果

        Args:
            query: SQL查询语句
            params: 查询参数

        Returns:
            查询结果列表
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def execute_update(self, query: str, params: tuple = ()) -> int:
        """
        执行更新操作

        Args:
            query: SQL更新语句
            params: 更新参数

        Returns:
            受影响的行数
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount

    def execute_insert(self, query: str, params: tuple = ()) -> int:
        """
        执行插入操作

        Args:
            query: SQL插入语句
            params: 插入参数

        Returns:
            新插入记录的ID
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.lastrowid

    # 用户相关操作
    def create_user(self, username: str, email: str, password_hash: str,
                   preferences: Optional[Dict] = None, reading_level: str = 'intermediate') -> int:
        """创建新用户"""
        preferences_json = json.dumps(preferences) if preferences else None

        query = '''
            INSERT INTO users (username, email, password_hash, preferences, reading_level)
            VALUES (?, ?, ?, ?, ?)
        '''
        return self.execute_insert(query, (username, email, password_hash, preferences_json, reading_level))

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """根据邮箱获取用户"""
        query = "SELECT * FROM users WHERE email = ?"
        results = self.execute_query(query, (email,))
        return results[0] if results else None

    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """根据ID获取用户"""
        query = "SELECT * FROM users WHERE id = ?"
        results = self.execute_query(query, (user_id,))
        return results[0] if results else None

    def update_user_login(self, user_id: int) -> None:
        """更新用户最后登录时间"""
        query = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
        self.execute_update(query, (user_id,))

    # 文章相关操作
    def create_article(self, title: str, content: str, **kwargs) -> int:
        """创建新文章"""
        # 基础字段
        fields = ['title', 'content']
        values = [title, content]
        placeholders = ['?', '?']

        # 可选字段
        optional_fields = ['source_url', 'author', 'published_date', 'difficulty_level',
                          'word_count', 'sentence_count', 'flesch_score', 'category', 'language']

        for field in optional_fields:
            if field in kwargs:
                fields.append(field)
                values.append(kwargs[field])
                placeholders.append('?')

        # 处理tags（转换为JSON）
        if 'tags' in kwargs:
            fields.append('tags')
            values.append(json.dumps(kwargs['tags']) if isinstance(kwargs['tags'], list) else kwargs['tags'])
            placeholders.append('?')

        query = f'''
            INSERT INTO articles ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
        '''
        return self.execute_insert(query, tuple(values))

    def get_article_by_id(self, article_id: int) -> Optional[Dict]:
        """根据ID获取文章"""
        query = "SELECT * FROM articles WHERE id = ?"
        results = self.execute_query(query, (article_id,))
        if results:
            article = results[0]
            # 解析tags JSON
            if article['tags']:
                try:
                    article['tags'] = json.loads(article['tags'])
                except json.JSONDecodeError:
                    article['tags'] = []
            return article
        return None

    def get_articles_by_difficulty(self, difficulty_level: str, limit: int = 10) -> List[Dict]:
        """根据难度获取文章列表"""
        query = '''
            SELECT * FROM articles
            WHERE difficulty_level = ?
            ORDER BY created_at DESC
            LIMIT ?
        '''
        return self.execute_query(query, (difficulty_level, limit))

    def search_articles(self, keyword: str, limit: int = 10) -> List[Dict]:
        """搜索文章"""
        query = '''
            SELECT * FROM articles
            WHERE title LIKE ? OR content LIKE ?
            ORDER BY created_at DESC
            LIMIT ?
        '''
        keyword_pattern = f'%{keyword}%'
        return self.execute_query(query, (keyword_pattern, keyword_pattern, limit))

    # 生词本相关操作
    def add_vocabulary(self, user_id: int, word: str, **kwargs) -> int:
        """添加生词"""
        fields = ['user_id', 'word']
        values = [user_id, word]
        placeholders = ['?', '?']

        optional_fields = ['definition', 'pronunciation', 'example_sentence', 'translation',
                          'difficulty_level', 'source_article_id', 'context', 'word_type']

        for field in optional_fields:
            if field in kwargs:
                fields.append(field)
                values.append(kwargs[field])
                placeholders.append('?')

        query = f'''
            INSERT OR REPLACE INTO vocabulary ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
        '''
        return self.execute_insert(query, tuple(values))

    def get_user_vocabulary(self, user_id: int, limit: int = 50) -> List[Dict]:
        """获取用户生词本"""
        query = '''
            SELECT * FROM vocabulary
            WHERE user_id = ?
            ORDER BY first_encountered DESC
            LIMIT ?
        '''
        return self.execute_query(query, (user_id, limit))

    def update_vocabulary_mastery(self, vocab_id: int, mastery_level: int, correct: bool = True) -> None:
        """更新词汇掌握程度"""
        query = '''
            UPDATE vocabulary
            SET mastery_level = ?, last_reviewed = CURRENT_TIMESTAMP,
                review_count = review_count + 1,
                correct_count = correct_count + ?
            WHERE id = ?
        '''
        self.execute_update(query, (mastery_level, 1 if correct else 0, vocab_id))

    # 翻译缓存相关操作
    def get_translation(self, source_text: str, target_language: str = 'zh',
                       context_hash: Optional[str] = None) -> Optional[Dict]:
        """获取翻译缓存"""
        if context_hash:
            query = '''
                SELECT * FROM translation_cache
                WHERE source_text = ? AND target_language = ? AND context_hash = ?
            '''
            params = (source_text, target_language, context_hash)
        else:
            query = '''
                SELECT * FROM translation_cache
                WHERE source_text = ? AND target_language = ? AND context_hash IS NULL
            '''
            params = (source_text, target_language)

        results = self.execute_query(query, params)
        if results:
            # 更新使用统计
            translation = results[0]
            self.execute_update('''
                UPDATE translation_cache
                SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (translation['id'],))
            return translation
        return None

    def cache_translation(self, source_text: str, target_language: str, translated_text: str,
                         translation_service: str = 'unknown', confidence_score: float = 1.0,
                         context_hash: Optional[str] = None) -> int:
        """缓存翻译结果"""
        query = '''
            INSERT OR REPLACE INTO translation_cache
            (source_text, target_language, translated_text, translation_service,
             confidence_score, context_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        '''
        return self.execute_insert(query, (
            source_text, target_language, translated_text,
            translation_service, confidence_score, context_hash
        ))

    # 阅读历史相关操作
    def update_reading_progress(self, user_id: int, article_id: int, progress: float,
                               reading_time: int = 0, words_looked_up: int = 0,
                               last_position: int = 0) -> None:
        """更新阅读进度"""
        query = '''
            INSERT OR REPLACE INTO reading_history
            (user_id, article_id, reading_progress, reading_time, words_looked_up, last_position)
            VALUES (?, ?, ?, ?, ?, ?)
        '''
        self.execute_update(query, (user_id, article_id, progress, reading_time, words_looked_up, last_position))

    def get_reading_history(self, user_id: int, limit: int = 20) -> List[Dict]:
        """获取阅读历史"""
        query = '''
            SELECT rh.*, a.title, a.difficulty_level
            FROM reading_history rh
            JOIN articles a ON rh.article_id = a.id
            WHERE rh.user_id = ?
            ORDER BY rh.started_at DESC
            LIMIT ?
        '''
        return self.execute_query(query, (user_id, limit))

    def mark_article_completed(self, user_id: int, article_id: int,
                              comprehension_score: Optional[float] = None) -> None:
        """标记文章为已完成"""
        query = '''
            UPDATE reading_history
            SET completed = TRUE, completed_at = CURRENT_TIMESTAMP, comprehension_score = ?
            WHERE user_id = ? AND article_id = ?
        '''
        self.execute_update(query, (comprehension_score, user_id, article_id))

    # 学习统计相关操作
    def update_daily_stats(self, user_id: int, words_learned: int = 0, articles_read: int = 0,
                          reading_time: int = 0, vocabulary_reviewed: int = 0,
                          accuracy_rate: float = 0.0) -> None:
        """更新每日学习统计"""
        today = date.today()
        query = '''
            INSERT OR REPLACE INTO learning_stats
            (user_id, date, words_learned, articles_read, reading_time,
             vocabulary_reviewed, accuracy_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        '''
        self.execute_update(query, (
            user_id, today, words_learned, articles_read,
            reading_time, vocabulary_reviewed, accuracy_rate
        ))

    def get_user_stats(self, user_id: int, days: int = 30) -> List[Dict]:
        """获取用户学习统计"""
        # 验证days参数为正整数，防止SQL注入
        if not isinstance(days, int) or days <= 0:
            days = 30
        query = '''
            SELECT * FROM learning_stats
            WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
            ORDER BY date DESC
        '''
        return self.execute_query(query, (user_id, str(days)))

    # 数据库维护
    def cleanup_old_cache(self, days: int = 30) -> int:
        """清理旧的翻译缓存"""
        # 验证days参数为正整数，防止SQL注入
        if not isinstance(days, int) or days <= 0:
            days = 30
        query = '''
            DELETE FROM translation_cache
            WHERE last_used < date('now', '-' || ? || ' days') AND usage_count = 1
        '''
        return self.execute_update(query, (str(days),))

    def get_database_stats(self) -> Dict[str, int]:
        """获取数据库统计信息"""
        # 使用白名单验证表名，防止SQL注入
        allowed_tables = {'users', 'articles', 'vocabulary', 'translation_cache',
                         'reading_history', 'learning_stats'}

        stats = {}
        for table in allowed_tables:
            # 表名已通过白名单验证，可以安全使用
            query = f"SELECT COUNT(*) as count FROM {table}"
            result = self.execute_query(query)
            stats[table] = result[0]['count'] if result else 0

        return stats