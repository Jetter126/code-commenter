#!/usr/bin/env python3
"""
Startup script for AI Code Commenter
Runs the complete application (frontend + backend) on a single port
"""

import uvicorn
import os
import sys
import socket
from pathlib import Path

def find_available_port(start_port=8000, max_port=8100):
    """Find an available port starting from start_port."""
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.bind(('localhost', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"No available ports found between {start_port} and {max_port}")

def main():
    print("🚀 Starting AI Code Commenter...")
    
    # Get port from environment (Railway/production) or find available port (local)
    if "PORT" in os.environ:
        # Production environment (Railway, Heroku, etc.)
        port = int(os.environ["PORT"])
        print(f"🌐 Using production port {port} from environment")
    else:
        # Local development - find an available port
        try:
            port = find_available_port()
            if port != 8000:
                print(f"⚠️  Port 8000 is busy, using port {port} instead")
            else:
                print(f"✅ Using default port {port}")
        except RuntimeError as e:
            print(f"❌ {e}")
            sys.exit(1)
    
    # Check if frontend directory exists
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        print("   Make sure you're running this script from the project root directory.")
        sys.exit(1)
    
    # Check if required files exist
    required_files = ["main.py", "openai_service.py", "frontend/index.html", "frontend/app.js"]
    missing_files = []
    
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print("❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        sys.exit(1)
    
    # Check for .env file and API key
    env_file = Path(".env")
    if not env_file.exists():
        print("⚠️  No .env file found!")
        print("   Copy .env.example to .env and add your OpenAI API key for full functionality.")
        print("   The app will still run but annotation features won't work without an API key.")
        print()
    else:
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️  OPENAI_API_KEY not found in .env file!")
            print("   Add your OpenAI API key to .env for full functionality.")
            print()
    
    print("✅ All files found!")
    print("🌐 Starting server...")
    print()
    print(f"📱 Frontend: http://localhost:{port}")
    print(f"📋 API Docs: http://localhost:{port}/docs")
    print(f"❤️  Health Check: http://localhost:{port}/health")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    # Start the server
    is_production = "PORT" in os.environ
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=port,
            reload=not is_production,  # Disable reload in production
            reload_dirs=[".", "frontend"] if not is_production else None
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()