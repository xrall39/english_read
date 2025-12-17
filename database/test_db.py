# -*- coding: utf-8 -*-
"""
数据库管理器测试脚本
"""

from db_manager import DatabaseManager
import json

def test_database():
    """测试数据库功能"""
    db = DatabaseManager()

    print("测试数据库连接...")

    # 测试数据库统计
    stats = db.get_database_stats()
    print("数据库统计:")
    for table, count in stats.items():
        print(f"  {table}: {count} 条记录")

    # 测试创建文章
    print("\n测试创建文章...")
    article_id = db.create_article(
        title="测试文章",
        content="这是一篇测试文章的内容。This is a test article content.",
        author="测试作者",
        difficulty_level="intermediate",
        word_count=15,
        sentence_count=2,
        flesch_score=65.0,
        category="test",
        tags=["test", "sample"]
    )
    print(f"创建文章成功，ID: {article_id}")

    # 测试获取文章
    article = db.get_article_by_id(article_id)
    if article:
        print(f"获取文章: {article['title']}")
        print(f"标签: {article['tags']}")

    # 测试翻译缓存
    print("\n测试翻译缓存...")
    db.cache_translation("hello", "zh", "你好", "test_service", 1.0)
    translation = db.get_translation("hello", "zh")
    if translation:
        print(f"翻译缓存: {translation['source_text']} -> {translation['translated_text']}")

    # 测试搜索文章
    print("\n测试搜索文章...")
    results = db.search_articles("测试")
    print(f"搜索结果: {len(results)} 篇文章")

    print("\n数据库测试完成!")

if __name__ == "__main__":
    test_database()