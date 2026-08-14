@echo off
REM Quick start script for SketchMind on Windows

echo ============================================================
echo SketchMind - Quick Start
echo ============================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 16+
    exit /b 1
)

echo.
echo Starting Backend...
echo.
if not exist backend\.venv\Scripts\python.exe (
    echo Creating backend virtual environment...
    python -m venv backend\.venv
)
backend\.venv\Scripts\python.exe -c "import tensorflow, keras; assert tensorflow.__version__ == '2.21.0' and keras.__version__ == '3.15.1'" >nul 2>&1
if errorlevel 1 (
    echo Installing backend dependencies...
    backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
)
start cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

timeout /t 3

echo.
echo Starting Frontend...
echo.
start cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================
echo Waiting for services to start...
echo ============================================================
echo.
echo Backend should be available at: http://localhost:8000
echo Frontend should be available at: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
