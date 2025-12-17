# -*- coding: utf-8 -*-
"""
API测试脚本
测试Next.js API路由功能
"""

import requests
import json
import time

# API配置
BASE_URL = "http://localhost:3000"
NLP_SERVICE_URL = "http://localhost:8000"

def test_nlp_api():
    """测试NLP API"""
    print("=== 测试NLP API ===")

    # 测试健康检查
    print("1. 测试NLP健康检查...")
    try:
        response = requests.get(f"{BASE_URL}/api/nlp")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"状态: {data['status']}")
            print(f"NLP服务: {data.get('nlp_service', {}).get('status', 'unknown')}")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

    # 测试文本分析
    print("\n2. 测试文本分析...")
    test_text = "Hello world! This is a test sentence for NLP analysis."

    try:
        response = requests.post(f"{BASE_URL}/api/nlp", json={
            "text": test_text,
            "include_sentences": True,
            "include_pos": True,
            "include_ner": True,
            "include_difficulty": True
        })

        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"词数: {data['word_count']}")
            print(f"句数: {data['sentence_count']}")
            if data.get('difficulty'):
                print(f"难度: {data['difficulty']['difficulty_level']}")
            if data.get('entities'):
                print(f"实体数: {len(data['entities'])}")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

def test_translate_api():
    """测试翻译API"""
    print("\n=== 测试翻译API ===")

    # 测试POST翻译
    print("1. 测试POST翻译...")
    try:
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "hello",
            "target_language": "zh",
            "use_cache": True
        })

        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"原文: {data['original_text']}")
            print(f"译文: {data['translated_text']}")
            print(f"服务: {data['translation_service']}")
            print(f"缓存: {data['from_cache']}")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

    # 测试GET翻译
    print("\n2. 测试GET翻译...")
    try:
        response = requests.get(f"{BASE_URL}/api/translate?text=world")

        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"原文: {data['original_text']}")
            print(f"译文: {data['translated_text']}")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

def test_articles_api():
    """测试文章API"""
    print("\n=== 测试文章API ===")

    # 测试创建文章
    print("1. 测试创建文章...")
    article_data = {
        "title": "API测试文章",
        "content": "This is a test article created by API testing script. It contains some English text for testing purposes.",
        "author": "API测试",
        "category": "test",
        "tags": ["api", "test", "automation"]
    }

    article_id = None
    try:
        response = requests.post(f"{BASE_URL}/api/articles", json=article_data)

        print(f"状态码: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            article_id = data['id']
            print(f"文章ID: {article_id}")
            print(f"标题: {data['title']}")
            print(f"词数: {data['word_count']}")
            print(f"难度: {data['difficulty_level']}")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

    # 测试获取文章列表
    print("\n2. 测试获取文章列表...")
    try:
        response = requests.get(f"{BASE_URL}/api/articles?limit=5")

        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"文章数量: {len(data['articles'])}")
            for article in data['articles']:
                print(f"  - {article['title']} (ID: {article['id']})")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

    # 测试获取单个文章
    if article_id:
        print(f"\n3. 测试获取文章详情 (ID: {article_id})...")
        try:
            response = requests.get(f"{BASE_URL}/api/articles/{article_id}")

            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"标题: {data['title']}")
                print(f"作者: {data['author']}")
                print(f"分类: {data['category']}")
            else:
                print(f"错误: {response.text}")
        except Exception as e:
            print(f"请求失败: {e}")

        # 测试更新文章
        print(f"\n4. 测试更新文章 (ID: {article_id})...")
        try:
            update_data = {
                "title": "API测试文章 (已更新)",
                "category": "updated_test"
            }

            response = requests.put(f"{BASE_URL}/api/articles/{article_id}", json=update_data)

            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"更新后标题: {data['title']}")
                print(f"更新后分类: {data['category']}")
            else:
                print(f"错误: {response.text}")
        except Exception as e:
            print(f"请求失败: {e}")

def test_integration():
    """集成测试"""
    print("\n=== 集成测试 ===")

    # 创建文章并分析
    print("1. 创建文章并进行NLP分析...")

    # 先创建文章
    article_data = {
        "title": "集成测试文章",
        "content": "Climate change is one of the most pressing issues of our time. Scientists around the world are working to understand its impacts.",
        "author": "集成测试",
        "category": "science"
    }

    try:
        # 创建文章
        response = requests.post(f"{BASE_URL}/api/articles", json=article_data)
        if response.status_code == 201:
            article = response.json()
            print(f"文章创建成功: {article['title']}")

            # 对文章内容进行NLP分析
            nlp_response = requests.post(f"{BASE_URL}/api/nlp", json={
                "text": article['content'],
                "include_difficulty": True,
                "include_ner": True
            })

            if nlp_response.status_code == 200:
                nlp_data = nlp_response.json()
                print(f"NLP分析成功:")
                print(f"  难度: {nlp_data.get('difficulty', {}).get('difficulty_level', 'unknown')}")
                print(f"  实体数: {len(nlp_data.get('entities', []))}")

                # 翻译文章中的关键词
                if nlp_data.get('entities'):
                    for entity in nlp_data['entities'][:2]:  # 只翻译前2个实体
                        translate_response = requests.post(f"{BASE_URL}/api/translate", json={
                            "text": entity['text'],
                            "target_language": "zh"
                        })

                        if translate_response.status_code == 200:
                            trans_data = translate_response.json()
                            print(f"  翻译: {entity['text']} -> {trans_data['translated_text']}")

        else:
            print(f"文章创建失败: {response.text}")

    except Exception as e:
        print(f"集成测试失败: {e}")

def main():
    """主测试函数"""
    print("开始API测试...")
    print(f"前端服务: {BASE_URL}")
    print(f"NLP服务: {NLP_SERVICE_URL}")

    # 等待服务启动
    print("\n等待服务启动...")
    time.sleep(2)

    # 运行测试
    test_nlp_api()
    test_translate_api()
    test_articles_api()
    test_integration()

    print("\n=== API测试完成 ===")

if __name__ == "__main__":
    main()