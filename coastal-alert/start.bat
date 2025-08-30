@echo off
REM Coastal Threat Alert System - Windows Startup Script
REM This script starts both backend and frontend services

echo ==========================================
echo   Coastal Threat Alert System Startup
echo ==========================================
echo.

REM Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Python is not installed!
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Dependencies found
echo.

REM Setup Backend
echo Setting up Backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
echo Installing backend dependencies...
call venv\Scripts\activate.bat
pip install -q -r requirements.txt

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo Note: Edit backend\.env to add Twilio/SMTP credentials for real notifications
)

REM Kill any existing process on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

REM Start backend
echo Starting Backend API on http://localhost:8000
start /B cmd /c "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Check if backend is running
curl -s http://localhost:8000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend is running
) else (
    echo Backend failed to start - check for errors
)

cd ..
echo.

REM Setup Frontend
echo Setting up Frontend...
cd frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

REM Kill any existing process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

REM Start frontend
echo Starting Frontend on http://localhost:3000
start /B cmd /c "npm run dev"

cd ..
echo.

echo ==========================================
echo   System Started Successfully!
echo ==========================================
echo.
echo Access the application at:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop all services
echo.

REM Keep window open
pause >nul