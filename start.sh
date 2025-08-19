#!/bin/bash

echo "🚀 Starting AI Code Commenter..."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is required but not installed."
    exit 1
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

echo ""
echo "🌐 Starting the application..."
echo ""

# Run the application
python3 run.py