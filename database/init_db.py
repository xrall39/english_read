#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库初始化脚本
创建SQLite数据库并执行schema.sql
"""

import sqlite3
import os
from pathlib import Path

# 数据库配置
DB_NAME = "english_reading.db"
SCHEMA_FILE = "schema.sql"

def init_database():
    """初始化数据库"""
    # 获取当前脚本所在目录
    current_dir = Path(__file__).parent
    db_path = current_dir / DB_NAME
    schema_path = current_dir / SCHEMA_FILE

    print(f"正在初始化数据库: {db_path}")

    # 检查schema文件是否存在
    if not schema_path.exists():
        print(f"错误: 找不到schema文件 {schema_path}")
        return False

    try:
        # 连接数据库（如果不存在会自动创建）
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 读取并执行schema.sql
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()

        # 执行SQL语句
        cursor.executescript(schema_sql)
        conn.commit()

        print("数据库初始化成功")

        # 验证表是否创建成功
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        print(f"创建的表: {len(tables)} 个")
        for table in tables:
            print(f"  - {table[0]}")

        # 验证索引
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index';")
        indexes = cursor.fetchall()

        print(f"创建的索引: {len(indexes)} 个")

        conn.close()
        return True

    except sqlite3.Error as e:
        print(f"数据库初始化失败: {e}")
        return False
    except Exception as e:
        print(f"发生错误: {e}")
        return False

def reset_database():
    """重置数据库（删除并重新创建）"""
    current_dir = Path(__file__).parent
    db_path = current_dir / DB_NAME

    if db_path.exists():
        print(f"🗑️  删除现有数据库: {db_path}")
        os.remove(db_path)

    return init_database()

def check_database():
    """检查数据库状态"""
    current_dir = Path(__file__).parent
    db_path = current_dir / DB_NAME

    if not db_path.exists():
        print("❌ 数据库不存在")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 检查表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        expected_tables = ['users', 'articles', 'vocabulary', 'translation_cache',
                          'reading_history', 'learning_stats']

        existing_tables = [table[0] for table in tables]
        missing_tables = [t for t in expected_tables if t not in existing_tables]

        if missing_tables:
            print(f"❌ 缺少表: {missing_tables}")
            conn.close()
            return False

        print("✅ 数据库检查通过")
        print(f"📊 数据库大小: {db_path.stat().st_size} 字节")

        # 显示每个表的记录数
        for table in expected_tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table}: {count} 条记录")

        conn.close()
        return True

    except sqlite3.Error as e:
        print(f"❌ 数据库检查失败: {e}")
        return False

def insert_sample_data():
    """插入示例数据"""
    current_dir = Path(__file__).parent
    db_path = current_dir / DB_NAME

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 插入示例文章
        sample_articles = [
            {
                'title': 'The Benefits of Reading',
                'content': '''Reading is one of the most beneficial activities for the human mind. It improves vocabulary, enhances critical thinking skills, and provides knowledge about various subjects. Regular reading can also reduce stress and improve focus. Whether you prefer fiction or non-fiction, books offer a gateway to new worlds and ideas.''',
                'author': 'Education Team',
                'difficulty_level': 'intermediate',
                'word_count': 52,
                'sentence_count': 4,
                'flesch_score': 65.5,
                'category': 'education',
                'tags': '["reading", "education", "benefits"]'
            },
            {
                'title': 'Climate Change and Our Future',
                'content': '''Climate change represents one of the most pressing challenges of our time. Rising global temperatures, melting ice caps, and extreme weather events are clear indicators of environmental change. Scientists worldwide agree that human activities, particularly the burning of fossil fuels, are the primary drivers of this phenomenon. Immediate action is required to mitigate these effects and protect our planet for future generations.''',
                'author': 'Environmental Science',
                'difficulty_level': 'advanced',
                'word_count': 68,
                'sentence_count': 4,
                'flesch_score': 45.2,
                'category': 'science',
                'tags': '["climate", "environment", "science"]'
            }
        ]

        for article in sample_articles:
            cursor.execute('''
                INSERT INTO articles (title, content, author, difficulty_level, word_count,
                                    sentence_count, flesch_score, category, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                article['title'], article['content'], article['author'],
                article['difficulty_level'], article['word_count'],
                article['sentence_count'], article['flesch_score'],
                article['category'], article['tags']
            ))

        # 插入示例翻译缓存
        sample_translations = [
            ('hello', 'zh', '你好', 'local_dict', 1.0),
            ('world', 'zh', '世界', 'local_dict', 1.0),
            ('reading', 'zh', '阅读', 'local_dict', 1.0),
            ('climate change', 'zh', '气候变化', 'local_dict', 0.95)
        ]

        for trans in sample_translations:
            cursor.execute('''
                INSERT OR IGNORE INTO translation_cache
                (source_text, target_language, translated_text, translation_service, confidence_score)
                VALUES (?, ?, ?, ?, ?)
            ''', trans)

        conn.commit()
        conn.close()

        print("✅ 示例数据插入成功")
        return True

    except sqlite3.Error as e:
        print(f"❌ 示例数据插入失败: {e}")
        return False

def main():
    """主函数"""
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1].lower()

        if command == 'reset':
            reset_database()
        elif command == 'check':
            check_database()
        elif command == 'sample':
            insert_sample_data()
        else:
            print("用法:")
            print("  python init_db.py        # 初始化数据库")
            print("  python init_db.py reset  # 重置数据库")
            print("  python init_db.py check  # 检查数据库")
            print("  python init_db.py sample # 插入示例数据")
    else:
        init_database()

if __name__ == "__main__":
    main()