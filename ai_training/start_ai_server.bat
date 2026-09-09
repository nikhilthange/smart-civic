@echo off
echo ===================================================
echo 🏙️ SMART CIVIC AI VISION INFERENCE MICROSERVICE
echo ===================================================
cd /d "%~dp0"

set PYTHON_EXE=..\..\.venv311\Scripts\python.exe

if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=..\..\.venv\Scripts\python.exe
)
if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=..\server\ai_service\venv\Scripts\python.exe
)
if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
)
if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=python
)

echo Using Python: %PYTHON_EXE%
echo Starting AI Vision Server on http://localhost:8000 ...
"%PYTHON_EXE%" inference_server.py
pause

