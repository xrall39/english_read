# -*- coding: utf-8 -*-
"""
数据库管理器测试脚本
包含完整的CRUD测试、边界条件测试和异常处理测试
"""

from db_manager import DatabaseManager
import json
import os
import tempfile
from datetime import date

class TestResult:
    """测试结果统计"""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def add_pass(self, test_name: str):
        self.passed += 1
        print(f"  ✓ {test_name}")

    def add_fail(self, test_name: str, reason: str):
        self.failed += 1
        self.errors.append(f"{test_name}: {reason}")
        print(f"  ✗ {test_name}: {reason}")

    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*50}")
        print(f"测试结果: {self.passed}/{total} 通过")
        if self.errors:
            print("\n失败的测试:")
            for error in self.errors:
                print(f"  - {error}")
        return self.failed == 0


def test_database_connection(db: DatabaseManager, result: TestResult):
    """测试数据库连接"""
    print("\n[测试数据库连接]")
    try:
        stats = db.get_database_stats()
        if isinstance(stats, dict):
            result.add_pass("数据库连接正常")
        else:
            result.add_fail("数据库连接", "返回类型错误")
    except Exception as e:
        result.add_fail("数据库连接", str(e))


def test_user_crud(db: DatabaseManager, result: TestResult):
    """测试用户CRUD操作"""
    print("\n[测试用户CRUD]")

    # 创建用户
    try:
        user_id = db.create_user(
            username="test_user_001",
            email="test001@example.com",
            password_hash="hashed_password_123",
            preferences={"theme": "dark"},
            reading_level="intermediate"
        )
        if user_id and user_id > 0:
            result.add_pass("创建用户")
        else:
            result.add_fail("创建用户", "返回ID无效")
    except Exception as e:
        result.add_fail("创建用户", str(e))
        return

    # 根据ID获取用户
    try:
        user = db.get_user_by_id(user_id)
        if user and user['username'] == "test_user_001":
            result.add_pass("根据ID获取用户")
        else:
            result.add_fail("根据ID获取用户", "用户数据不匹配")
    except Exception as e:
        result.add_fail("根据ID获取用户", str(e))

    # 根据邮箱获取用户
    try:
        user = db.get_user_by_email("test001@example.com")
        if user and user['email'] == "test001@example.com":
            result.add_pass("根据邮箱获取用户")
        else:
            result.add_fail("根据邮箱获取用户", "用户数据不匹配")
    except Exception as e:
        result.add_fail("根据邮箱获取用户", str(e))

    # 更新登录时间
    try:
        db.update_user_login(user_id)
        result.add_pass("更新用户登录时间")
    except Exception as e:
        result.add_fail("更新用户登录时间", str(e))

    # 获取不存在的用户
    try:
        user = db.get_user_by_id(999999)
        if user is None:
            result.add_pass("获取不存在的用户返回None")
        else:
            result.add_fail("获取不存在的用户", "应返回None")
    except Exception as e:
        result.add_fail("获取不存在的用户", str(e))

    return user_id


def test_article_crud(db: DatabaseManager, result: TestResult):
    """测试文章CRUD操作"""
    print("\n[测试文章CRUD]")

    # 创建文章
    try:
        article_id = db.create_article(
            title="Test Article Title",
            content="This is a test article content. It has multiple sentences.",
            author="Test Author",
            difficulty_level="intermediate",
            word_count=12,
            sentence_count=2,
            flesch_score=65.5,
            category="test",
            tags=["test", "sample", "demo"]
        )
        if article_id and article_id > 0:
            result.add_pass("创建文章")
        else:
            result.add_fail("创建文章", "返回ID无效")
    except Exception as e:
        result.add_fail("创建文章", str(e))
        return

    # 获取文章
    try:
        article = db.get_article_by_id(article_id)
        if article and article['title'] == "Test Article Title":
            result.add_pass("获取文章")
        else:
            result.add_fail("获取文章", "文章数据不匹配")
    except Exception as e:
        result.add_fail("获取文章", str(e))

    # 验证tags解析
    try:
        article = db.get_article_by_id(article_id)
        if article and isinstance(article['tags'], list) and "test" in article['tags']:
            result.add_pass("文章tags JSON解析")
        else:
            result.add_fail("文章tags JSON解析", "tags解析失败")
    except Exception as e:
        result.add_fail("文章tags JSON解析", str(e))

    # 按难度获取文章
    try:
        articles = db.get_articles_by_difficulty("intermediate", limit=5)
        if isinstance(articles, list):
            result.add_pass("按难度获取文章")
        else:
            result.add_fail("按难度获取文章", "返回类型错误")
    except Exception as e:
        result.add_fail("按难度获取文章", str(e))

    # 搜索文章
    try:
        articles = db.search_articles("Test", limit=5)
        if isinstance(articles, list) and len(articles) > 0:
            result.add_pass("搜索文章")
        else:
            result.add_fail("搜索文章", "搜索结果为空")
    except Exception as e:
        result.add_fail("搜索文章", str(e))

    # 获取不存在的文章
    try:
        article = db.get_article_by_id(999999)
        if article is None:
            result.add_pass("获取不存在的文章返回None")
        else:
            result.add_fail("获取不存在的文章", "应返回None")
    except Exception as e:
        result.add_fail("获取不存在的文章", str(e))

    return article_id


def test_vocabulary_crud(db: DatabaseManager, result: TestResult, user_id: int):
    """测试生词本CRUD操作"""
    print("\n[测试生词本CRUD]")

    # 添加生词
    try:
        vocab_id = db.add_vocabulary(
            user_id=user_id,
            word="ephemeral",
            definition="lasting for a very short time",
            pronunciation="/ɪˈfem(ə)rəl/",
            example_sentence="Fame is ephemeral.",
            translation="短暂的",
            difficulty_level=4,
            word_type="adjective"
        )
        if vocab_id and vocab_id > 0:
            result.add_pass("添加生词")
        else:
            result.add_fail("添加生词", "返回ID无效")
    except Exception as e:
        result.add_fail("添加生词", str(e))
        return

    # 获取用户生词本
    try:
        vocabulary = db.get_user_vocabulary(user_id, limit=10)
        if isinstance(vocabulary, list) and len(vocabulary) > 0:
            result.add_pass("获取用户生词本")
        else:
            result.add_fail("获取用户生词本", "生词本为空")
    except Exception as e:
        result.add_fail("获取用户生词本", str(e))

    # 更新掌握程度
    try:
        db.update_vocabulary_mastery(vocab_id, mastery_level=2, correct=True)
        result.add_pass("更新词汇掌握程度")
    except Exception as e:
        result.add_fail("更新词汇掌握程度", str(e))

    return vocab_id


def test_translation_cache(db: DatabaseManager, result: TestResult):
    """测试翻译缓存"""
    print("\n[测试翻译缓存]")

    # 缓存翻译
    try:
        cache_id = db.cache_translation(
            source_text="hello world",
            target_language="zh",
            translated_text="你好世界",
            translation_service="test_service",
            confidence_score=0.95,
            context_hash="test_context_123"
        )
        if cache_id and cache_id > 0:
            result.add_pass("缓存翻译")
        else:
            result.add_fail("缓存翻译", "返回ID无效")
    except Exception as e:
        result.add_fail("缓存翻译", str(e))
        return

    # 获取翻译（带上下文）
    try:
        translation = db.get_translation("hello world", "zh", "test_context_123")
        if translation and translation['translated_text'] == "你好世界":
            result.add_pass("获取翻译（带上下文）")
        else:
            result.add_fail("获取翻译（带上下文）", "翻译数据不匹配")
    except Exception as e:
        result.add_fail("获取翻译（带上下文）", str(e))

    # 缓存无上下文翻译
    try:
        db.cache_translation(
            source_text="goodbye",
            target_language="zh",
            translated_text="再见",
            translation_service="test_service",
            confidence_score=0.9
        )
        result.add_pass("缓存无上下文翻译")
    except Exception as e:
        result.add_fail("缓存无上下文翻译", str(e))

    # 获取翻译（无上下文）
    try:
        translation = db.get_translation("goodbye", "zh")
        if translation and translation['translated_text'] == "再见":
            result.add_pass("获取翻译（无上下文）")
        else:
            result.add_fail("获取翻译（无上下文）", "翻译数据不匹配")
    except Exception as e:
        result.add_fail("获取翻译（无上下文）", str(e))

    # 获取不存在的翻译
    try:
        translation = db.get_translation("nonexistent_text_xyz", "zh")
        if translation is None:
            result.add_pass("获取不存在的翻译返回None")
        else:
            result.add_fail("获取不存在的翻译", "应返回None")
    except Exception as e:
        result.add_fail("获取不存在的翻译", str(e))


def test_reading_history(db: DatabaseManager, result: TestResult, user_id: int, article_id: int):
    """测试阅读历史"""
    print("\n[测试阅读历史]")

    # 更新阅读进度
    try:
        db.update_reading_progress(
            user_id=user_id,
            article_id=article_id,
            progress=0.5,
            reading_time=300,
            words_looked_up=5,
            last_position=100
        )
        result.add_pass("更新阅读进度")
    except Exception as e:
        result.add_fail("更新阅读进度", str(e))

    # 获取阅读历史
    try:
        history = db.get_reading_history(user_id, limit=10)
        if isinstance(history, list):
            result.add_pass("获取阅读历史")
        else:
            result.add_fail("获取阅读历史", "返回类型错误")
    except Exception as e:
        result.add_fail("获取阅读历史", str(e))

    # 标记文章完成
    try:
        db.mark_article_completed(user_id, article_id, comprehension_score=0.85)
        result.add_pass("标记文章完成")
    except Exception as e:
        result.add_fail("标记文章完成", str(e))


def test_learning_stats(db: DatabaseManager, result: TestResult, user_id: int):
    """测试学习统计"""
    print("\n[测试学习统计]")

    # 更新每日统计
    try:
        db.update_daily_stats(
            user_id=user_id,
            words_learned=10,
            articles_read=2,
            reading_time=1800,
            vocabulary_reviewed=15,
            accuracy_rate=0.85
        )
        result.add_pass("更新每日统计")
    except Exception as e:
        result.add_fail("更新每日统计", str(e))

    # 获取用户统计
    try:
        stats = db.get_user_stats(user_id, days=7)
        if isinstance(stats, list):
            result.add_pass("获取用户统计")
        else:
            result.add_fail("获取用户统计", "返回类型错误")
    except Exception as e:
        result.add_fail("获取用户统计", str(e))


def test_boundary_conditions(db: DatabaseManager, result: TestResult):
    """测试边界条件"""
    print("\n[测试边界条件]")

    # 测试空字符串搜索
    try:
        articles = db.search_articles("", limit=5)
        if isinstance(articles, list):
            result.add_pass("空字符串搜索")
        else:
            result.add_fail("空字符串搜索", "返回类型错误")
    except Exception as e:
        result.add_fail("空字符串搜索", str(e))

    # 测试特殊字符搜索
    try:
        articles = db.search_articles("'; DROP TABLE articles; --", limit=5)
        if isinstance(articles, list):
            result.add_pass("SQL注入防护测试")
        else:
            result.add_fail("SQL注入防护测试", "返回类型错误")
    except Exception as e:
        result.add_fail("SQL注入防护测试", str(e))

    # 测试get_user_stats参数验证
    try:
        stats = db.get_user_stats(1, days=-1)  # 负数应被处理
        if isinstance(stats, list):
            result.add_pass("get_user_stats负数参数处理")
        else:
            result.add_fail("get_user_stats负数参数处理", "返回类型错误")
    except Exception as e:
        result.add_fail("get_user_stats负数参数处理", str(e))

    # 测试cleanup_old_cache参数验证
    try:
        count = db.cleanup_old_cache(days=0)  # 0应被处理
        if isinstance(count, int):
            result.add_pass("cleanup_old_cache零参数处理")
        else:
            result.add_fail("cleanup_old_cache零参数处理", "返回类型错误")
    except Exception as e:
        result.add_fail("cleanup_old_cache零参数处理", str(e))

    # 测试limit为0
    try:
        articles = db.get_articles_by_difficulty("intermediate", limit=0)
        if isinstance(articles, list):
            result.add_pass("limit为0的查询")
        else:
            result.add_fail("limit为0的查询", "返回类型错误")
    except Exception as e:
        result.add_fail("limit为0的查询", str(e))


def test_database_stats(db: DatabaseManager, result: TestResult):
    """测试数据库统计"""
    print("\n[测试数据库统计]")

    try:
        stats = db.get_database_stats()
        expected_tables = {'users', 'articles', 'vocabulary', 'translation_cache',
                          'reading_history', 'learning_stats'}
        if set(stats.keys()) == expected_tables:
            result.add_pass("数据库统计包含所有表")
        else:
            result.add_fail("数据库统计", f"缺少表: {expected_tables - set(stats.keys())}")
    except Exception as e:
        result.add_fail("数据库统计", str(e))


def run_all_tests():
    """运行所有测试"""
    print("="*50)
    print("数据库管理器完整测试")
    print("="*50)

    db = DatabaseManager()
    result = TestResult()

    # 运行测试
    test_database_connection(db, result)
    user_id = test_user_crud(db, result)
    article_id = test_article_crud(db, result)

    if user_id:
        test_vocabulary_crud(db, result, user_id)
        test_learning_stats(db, result, user_id)

    if user_id and article_id:
        test_reading_history(db, result, user_id, article_id)

    test_translation_cache(db, result)
    test_boundary_conditions(db, result)
    test_database_stats(db, result)

    # 输出结果
    success = result.summary()
    return success


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
