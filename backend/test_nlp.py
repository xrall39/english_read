# -*- coding: utf-8 -*-
"""
NLP服务测试文件
"""

import asyncio
import httpx
import json
from typing import Dict, Any

# 测试配置
BASE_URL = "http://localhost:8000"
TEST_TEXTS = [
    "Hello world! This is a simple test sentence.",
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
    "Apple Inc. is an American multinational technology company headquartered in Cupertino, California. Tim Cook is the CEO of Apple.",
    "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data. Python is widely used in this field.",
    "The weather today is absolutely beautiful. I think I'll go for a walk in Central Park with my friend Sarah."
]

async def test_health_check():
    """测试健康检查端点"""
    print("🔍 测试健康检查...")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 健康检查通过: {data}")
                return True
            else:
                print(f"❌ 健康检查失败: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ 连接失败: {e}")
            return False

async def test_text_analysis(text: str, test_name: str = ""):
    """测试文本分析功能"""
    print(f"\n📝 测试文本分析 - {test_name}")
    print(f"输入文本: {text[:50]}...")

    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "text": text,
                "include_sentences": True,
                "include_pos": True,
                "include_ner": True,
                "include_dependencies": False,
                "include_difficulty": True
            }

            response = await client.post(f"{BASE_URL}/analyze", json=payload)

            if response.status_code == 200:
                data = response.json()

                print(f"✅ 分析成功")
                print(f"   词数: {data['word_count']}")
                print(f"   句数: {data['sentence_count']}")

                if data.get('sentences'):
                    print(f"   句子分割: {len(data['sentences'])} 个句子")
                    for i, sent in enumerate(data['sentences'][:2]):  # 只显示前2个句子
                        print(f"     句子 {i+1}: {sent['text'][:40]}...")
                        if sent['tokens']:
                            print(f"       词性标注: {len(sent['tokens'])} 个词")

                if data.get('entities'):
                    print(f"   命名实体: {len(data['entities'])} 个")
                    for ent in data['entities']:
                        print(f"     {ent['text']} ({ent['label']}) - {ent['description']}")

                if data.get('difficulty'):
                    diff = data['difficulty']
                    print(f"   难度评估: {diff['difficulty_level']}")
                    print(f"     Flesch Reading Ease: {diff['flesch_reading_ease']:.1f}")
                    print(f"     Flesch-Kincaid Grade: {diff['flesch_kincaid_grade']:.1f}")

                return True
            else:
                print(f"❌ 分析失败: {response.status_code}")
                print(f"   错误信息: {response.text}")
                return False

        except Exception as e:
            print(f"❌ 请求失败: {e}")
            return False

async def test_simple_endpoints():
    """测试简化端点"""
    print(f"\n🔧 测试简化端点...")

    test_text = "Apple Inc. was founded by Steve Jobs. The company is based in California."

    async with httpx.AsyncClient() as client:
        try:
            # 测试句子提取
            response = await client.post(f"{BASE_URL}/sentences", data={"text": test_text})
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 句子提取: {data['count']} 个句子")
                for i, sent in enumerate(data['sentences']):
                    print(f"   {i+1}. {sent}")

            # 测试实体提取
            response = await client.post(f"{BASE_URL}/entities", data={"text": test_text})
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 实体提取: {data['count']} 个实体")
                for ent in data['entities']:
                    print(f"   {ent['text']} ({ent['label']}) - {ent['description']}")

            return True

        except Exception as e:
            print(f"❌ 简化端点测试失败: {e}")
            return False

async def performance_test():
    """性能测试"""
    print(f"\n⚡ 性能测试...")

    import time

    long_text = " ".join(TEST_TEXTS * 10)  # 创建较长的文本

    async with httpx.AsyncClient() as client:
        try:
            start_time = time.time()

            payload = {
                "text": long_text,
                "include_sentences": True,
                "include_pos": True,
                "include_ner": True,
                "include_difficulty": True
            }

            response = await client.post(f"{BASE_URL}/analyze", json=payload)

            end_time = time.time()
            processing_time = end_time - start_time

            if response.status_code == 200:
                data = response.json()
                print(f"✅ 性能测试通过")
                print(f"   文本长度: {len(long_text)} 字符")
                print(f"   处理时间: {processing_time:.2f} 秒")
                print(f"   词数: {data['word_count']}")
                print(f"   句数: {data['sentence_count']}")
                print(f"   实体数: {len(data.get('entities', []))}")

                return True
            else:
                print(f"❌ 性能测试失败: {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ 性能测试异常: {e}")
            return False

async def main():
    """主测试函数"""
    print("🧪 开始NLP服务测试...")

    # 健康检查
    if not await test_health_check():
        print("❌ 服务未启动或不可用，请先启动NLP服务")
        print("启动命令: python main.py")
        return

    # 基础功能测试
    success_count = 0
    total_tests = len(TEST_TEXTS)

    for i, text in enumerate(TEST_TEXTS):
        if await test_text_analysis(text, f"测试 {i+1}"):
            success_count += 1

    # 简化端点测试
    if await test_simple_endpoints():
        success_count += 1
        total_tests += 1

    # 性能测试
    if await performance_test():
        success_count += 1
        total_tests += 1

    # 测试结果
    print(f"\n📊 测试结果:")
    print(f"   成功: {success_count}/{total_tests}")
    print(f"   成功率: {success_count/total_tests*100:.1f}%")

    if success_count == total_tests:
        print("🎉 所有测试通过！NLP服务运行正常")
    else:
        print("⚠️  部分测试失败，请检查服务状态")

if __name__ == "__main__":
    asyncio.run(main())