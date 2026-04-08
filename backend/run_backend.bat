@echo off
REM Run backend using project venv (avoids "No module named 'uvicorn'" when venv not activated)
cd /d "%~dp0"
if not exist "..\venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found. Create it first:
    echo   cd "%~dp0.."
    echo   python -m venv venv
    echo   venv\Scripts\pip install -r backend\requirements.txt
    pause
    exit /b 1
)
"..\venv\Scripts\python.exe" main.py
pause
