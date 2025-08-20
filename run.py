#!/usr/bin/env python3
"""
Startup script for AI Code Commenter
Runs the complete application (frontend + backend) on a single port
"""

import uvicorn
import os
import sys
from pathlib import Path

PORT = 8000
REQUIRED_FILES = ["main.py", "openai_service.py", "frontend/index.html", "frontend/app.js"]

def main():
    print("Starting AI Code Commenter...")
    
    # Check if frontend directory exists
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("Error: Frontend directory not found!")
        print("Make sure you're running this script from the project root directory.")
        sys.exit(1)
    
    # Check if required files exist
    missing_files = [file for file in REQUIRED_FILES if not Path(file).exists()]
    
    if missing_files:
        print("Error: Missing required files:")
        for file in missing_files:
            print(f"  - {file}")
        sys.exit(1)
    
    # Check for .env file and API key
    env_file = Path(".env")
    if not env_file.exists():
        print("Warning: No .env file found!")
        print("Copy .env.example to .env and add your OpenAI API key for full functionality.")
        print("The app will still run but annotation features won't work without an API key.\n")
    else:
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("Warning: OPENAI_API_KEY not found in .env file!")
            print("Add your OpenAI API key to .env for full functionality.\n")
    
    print("All files found!")
    print("Starting server...\n")
    print(f"Frontend: http://localhost:{PORT}")
    print(f"API Docs: http://localhost:{PORT}/docs")
    print(f"Health Check: http://localhost:{PORT}/health\n")
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    # Start the server
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=PORT,
            reload="PORT" not in os.environ,  # Disable reload in production
            reload_dirs=[".", "frontend"] if "PORT" not in os.environ else None
        )
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"\nError starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()