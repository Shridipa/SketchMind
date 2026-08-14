#!/bin/bash

# Quick start script for SketchMind on macOS/Linux

echo "============================================================"
echo "SketchMind - Quick Start"
echo "============================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python not found. Please install Python 3.8+"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 16+"
    exit 1
fi

echo ""
echo "Starting Backend..."
echo ""
if [ ! -x backend/.venv/bin/python ]; then
    python3 -m venv backend/.venv
fi
if ! backend/.venv/bin/python -c "import tensorflow, keras; assert tensorflow.__version__ == '2.21.0' and keras.__version__ == '3.15.1'" > /dev/null 2>&1; then
    backend/.venv/bin/python -m pip install -r backend/requirements.txt
fi
cd backend
.venv/bin/python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

sleep 3

echo ""
echo "Starting Frontend..."
echo ""
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "============================================================"
echo "Waiting for services to start..."
echo "============================================================"
echo ""
echo "Backend should be available at: http://localhost:8000"
echo "Frontend should be available at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services..."
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
