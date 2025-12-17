# -*- coding: utf-8 -*-
"""
NLP服务安装脚本
"""

import subprocess
import sys
import os

def run_command(command, description):
    """运行命令并处理错误"""
    print(f"\n正在{description}...")
    print(f"执行命令: {command}")

    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description}成功")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description}失败")
        print(f"错误信息: {e.stderr}")
        return False

def main():
    """主安装流程"""
    print("🚀 开始安装英语阅读NLP服务...")

    # 检查Python版本
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ 需要Python 3.8或更高版本")
        sys.exit(1)

    print(f"✅ Python版本: {python_version.major}.{python_version.minor}.{python_version.micro}")

    # 安装依赖
    if not run_command("pip install -r requirements.txt", "安装Python依赖"):
        print("❌ 依赖安装失败，请检查网络连接和pip配置")
        sys.exit(1)

    # 下载spaCy英语模型
    if not run_command("python -m spacy download en_core_web_sm", "下载spaCy英语模型"):
        print("❌ spaCy模型下载失败，请检查网络连接")
        sys.exit(1)

    # 验证安装
    print("\n🔍 验证安装...")
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        doc = nlp("Hello world! This is a test.")
        print(f"✅ spaCy模型验证成功，处理了 {len(doc)} 个token")
    except Exception as e:
        print(f"❌ spaCy模型验证失败: {e}")
        sys.exit(1)

    try:
        import fastapi
        import uvicorn
        print(f"✅ FastAPI验证成功，版本: {fastapi.__version__}")
    except Exception as e:
        print(f"❌ FastAPI验证失败: {e}")
        sys.exit(1)

    print("\n🎉 安装完成！")
    print("\n启动服务:")
    print("  python main.py")
    print("  或者")
    print("  uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("\nAPI文档地址:")
    print("  http://localhost:8000/docs")

if __name__ == "__main__":
    main()