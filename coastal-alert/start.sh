#!/bin/bash

# Coastal Threat Alert System - Startup Script
# This script starts both backend and frontend services

echo "=========================================="
echo "  Coastal Threat Alert System Startup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Windows and adjust commands
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    PYTHON_CMD="python"
    NPM_CMD="npm.cmd"
    ACTIVATE_CMD="venv/Scripts/activate"
else
    PYTHON_CMD="python3"
    NPM_CMD="npm"
    ACTIVATE_CMD="venv/bin/activate"
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        netstat -ano | findstr :$1 | findstr LISTENING | awk '{print $5}' | xargs -r taskkill /PID /F 2>/dev/null
    else
        lsof -ti:$1 | xargs -r kill -9 2>/dev/null
    fi
}

# Check for Python
echo -e "${YELLOW}Checking dependencies...${NC}"
if ! command_exists $PYTHON_CMD; then
    echo -e "${RED}Error: Python is not installed!${NC}"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

# Check for Node.js
if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Python and Node.js found${NC}"
echo ""

# Setup Backend
echo -e "${YELLOW}Setting up Backend...${NC}"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment and install dependencies
echo "Installing backend dependencies..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate 2>/dev/null || venv\\Scripts\\activate
else
    source venv/bin/activate
fi

pip install -q -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}Note: Edit backend/.env to add Twilio/SMTP credentials for real notifications${NC}"
fi

# Kill any existing process on port 8000
kill_port 8000

# Start backend
echo -e "${GREEN}Starting Backend API on http://localhost:8000${NC}"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    echo "Check the logs above for errors"
fi

cd ..
echo ""

# Setup Frontend
echo -e "${YELLOW}Setting up Frontend...${NC}"
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    $NPM_CMD install
fi

# Kill any existing process on port 3000
kill_port 3000

# Start frontend
echo -e "${GREEN}Starting Frontend on http://localhost:3000${NC}"
$NPM_CMD run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd ..
echo ""

# Display status
echo "=========================================="
echo -e "${GREEN}  System Started Successfully!${NC}"
echo "=========================================="
echo ""
echo "Access the application at:"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill_port 8000
    kill_port 3000
    echo -e "${GREEN}Services stopped${NC}"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
while true; do
    sleep 1
done