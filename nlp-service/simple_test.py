# -*- coding: utf-8 -*-
import requests
import json

def test_nlp_service():
    base_url = "http://localhost:8000"

    # 测试健康检查
    print("测试健康检查...")
    response = requests.get(f"{base_url}/health")
    print(f"健康检查: {response.status_code}")
    print(f"响应: {response.json()}")

    # 测试文本分析
    print("\n测试文本分析...")
    test_text = "Apple Inc. is a technology company founded by Steve Jobs. The company is based in California."

    payload = {
        "text": test_text,
        "include_sentences": True,
        "include_pos": True,
        "include_ner": True,
        "include_difficulty": True
    }

    response = requests.post(f"{base_url}/analyze", json=payload)
    print(f"分析状态: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"词数: {data['word_count']}")
        print(f"句数: {data['sentence_count']}")

        if data.get('entities'):
            print(f"实体数: {len(data['entities'])}")
            for ent in data['entities']:
                print(f"  - {ent['text']} ({ent['label']}): {ent['description']}")

        if data.get('difficulty'):
            diff = data['difficulty']
            print(f"难度: {diff['difficulty_level']}")
            print(f"Flesch Reading Ease: {diff['flesch_reading_ease']:.1f}")
    else:
        print(f"错误: {response.text}")

if __name__ == "__main__":
    test_nlp_service()