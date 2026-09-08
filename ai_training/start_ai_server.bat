@echo off
echo ===================================================
echo 🏙️ SMART CIVIC AI VISION INFERENCE MICROSERVICE
echo ===================================================
cd /d "%~dp0"

set PYTHON_EXE=..\..\.venv311\Scripts\python.exe

if not exist "%PYTHON_EXE%" (
    echo [ERROR] Python 3.11 environment not found at %PYTHON_EXE%
    pause
    exit /b 1
)

echo Starting AI Server on http://localhost:8000 ...
"%PYTHON_EXE%" inference_server.py
pause
