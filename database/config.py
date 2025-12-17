# -*- coding: utf-8 -*-
"""
数据库配置文件
"""

import os
from pathlib import Path

# 数据库配置
DATABASE_CONFIG = {
    # SQLite数据库文件路径
    'sqlite': {
        'path': Path(__file__).parent / 'english_reading.db',
        'timeout': 30.0,  # 连接超时时间（秒）
        'check_same_thread': False,  # 允许多线程访问
    },

    # PostgreSQL配置（生产环境）
    'postgresql': {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', 5432),
        'database': os.getenv('DB_NAME', 'english_reading'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', ''),
        'pool_size': 10,
        'max_overflow': 20,
    }
}

# 当前使用的数据库类型
DATABASE_TYPE = os.getenv('DATABASE_TYPE', 'sqlite')

# 数据库表名
TABLES = {
    'users': 'users',
    'articles': 'articles',
    'vocabulary': 'vocabulary',
    'translation_cache': 'translation_cache',
    'reading_history': 'reading_history',
    'learning_stats': 'learning_stats',
}

# 缓存配置
CACHE_CONFIG = {
    'translation_cache_days': 30,  # 翻译缓存保留天数
    'max_cache_size': 10000,  # 最大缓存条目数
    'cleanup_interval': 24 * 60 * 60,  # 清理间隔（秒）
}

# 分页配置
PAGINATION = {
    'default_page_size': 20,
    'max_page_size': 100,
}

def get_database_url():
    """获取数据库连接URL"""
    if DATABASE_TYPE == 'sqlite':
        return f"sqlite:///{DATABASE_CONFIG['sqlite']['path']}"
    elif DATABASE_TYPE == 'postgresql':
        config = DATABASE_CONFIG['postgresql']
        return f"postgresql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
    else:
        raise ValueError(f"不支持的数据库类型: {DATABASE_TYPE}")

def get_database_config():
    """获取当前数据库配置"""
    return DATABASE_CONFIG.get(DATABASE_TYPE, DATABASE_CONFIG['sqlite'])