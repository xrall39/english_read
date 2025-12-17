@echo off
chcp 65001
echo 正在安装英语阅读NLP服务...

echo.
echo 1. 安装Python依赖...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo 依赖安装失败，请检查网络连接
    pause
    exit /b 1
)

echo.
echo 2. 下载spaCy英语模型...
python -m spacy download en_core_web_sm
if %errorlevel% neq 0 (
    echo spaCy模型下载失败，请检查网络连接
    pause
    exit /b 1
)

echo.
echo 3. 验证安装...
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('spaCy模型验证成功')"
if %errorlevel% neq 0 (
    echo spaCy模型验证失败
    pause
    exit /b 1
)

python -c "import fastapi; print('FastAPI验证成功，版本:', fastapi.__version__)"
if %errorlevel% neq 0 (
    echo FastAPI验证失败
    pause
    exit /b 1
)

echo.
echo 安装完成！
echo.
echo 启动服务:
echo   python main.py
echo.
echo API文档地址:
echo   http://localhost:8000/docs
echo.
pause