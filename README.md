# AI Code Commenter

An intelligent web application that automatically adds meaningful inline comments and docstrings to your source code using AI. Upload files, paste code, or connect your GitHub repositories to enhance code readability and maintainability.

## Features

### Multiple Input Methods
- **File Upload**: Support for `.py`, `.js`, `.java`, `.cpp`, `.c`, `.html`, `.css`, `.php`, `.rb`, `.go`, `.rs`, `.ts`, `.tsx`, `.jsx` and more
- **Code Paste**: Direct code input with syntax highlighting
- **GitHub Integration**: Browse and annotate files directly from your repositories

### Smart Code Analysis
- **Language Detection**: Automatic detection of programming languages
- **Comment Levels**: Choose from minimal, standard, or detailed commenting
- **Structure Preservation**: Maintains original code formatting and structure
- **Intelligent Placement**: Adds comments and docstrings where they're most valuable

### GitHub Integration
- **OAuth Authentication**: Secure login with your GitHub account
- **Repository Browsing**: Navigate through your public and private repositories
- **File Explorer**: Browse repository contents and select files for annotation
- **Direct Annotation**: Process files directly from GitHub without downloading

### User Experience
- **Modern UI**: Clean, responsive interface with dark/light mode
- **Real-time Processing**: Live feedback during code analysis
- **Easy Export**: Copy annotated code to clipboard or download files
- **Session Management**: Secure JWT-based authentication

## Quick Start

### Prerequisites
- Python 3.8+
- OpenAI API key
- GitHub OAuth app (optional, for GitHub integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd code-commenter
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Required
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional (for GitHub integration)
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   JWT_SECRET_KEY=your-secure-jwt-secret
   BASE_URL=http://localhost:8000
   ```

4. **Start the application**
   ```bash
   pytho3n run.py
   ```

5. **Access the application**
   - Frontend: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## Configuration

### OpenAI API Setup
1. Visit [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file as `OPENAI_API_KEY`

### GitHub OAuth Setup (Optional)
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - Application name: Your app name
   - Homepage URL: `http://localhost:8000` (or your domain)
   - Authorization callback URL: `http://localhost:8000/auth/callback`
3. Copy the Client ID and Client Secret to your `.env` file

## Project Structure

```
code-commenter/
├── main.py                 # FastAPI backend server
├── openai_service.py      # OpenAI API integration
├── github_service.py      # GitHub OAuth & API handling
├── run.py                 # Application startup script
├── requirements.txt       # Python dependencies
├── frontend/              # React frontend application
│   ├── index.html        # Main HTML template
│   ├── app.js            # React application logic
│   ├── package.json      # Frontend dependencies
│   └── favicon.svg       # Application icon
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore configuration
└── Procfile             # Deployment configuration
```

## API Endpoints

### Code Annotation
- `POST /annotate` - Annotate provided code
- `POST /repos/annotate` - Annotate file from GitHub repository

### Authentication
- `GET /auth/github` - Initiate GitHub OAuth flow
- `GET /auth/callback` - Handle OAuth callback
- `GET /auth/user` - Get current user information
- `POST /auth/logout` - Logout user

### GitHub Integration
- `GET /repos` - Get user's repositories
- `GET /repos/{owner}/{repo}/contents` - Get repository contents

### Utility
- `GET /health` - Health check endpoint

## Development

### Running in Development Mode
```bash
python3 run.py
```

The application will start with auto-reload enabled for development.

### Frontend Development
The frontend uses React with Babel standalone for JSX compilation. No build step is required for development.

### Adding New Languages
To support additional programming languages:

1. Add the file extension to the supported list in `github_service.py:_is_supported_file()`
2. Update the language mapping in `frontend/app.js` for auto-detection
3. Add the language option to the select dropdown in the frontend

## Deployment

### Railway Deployment
1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
OPENAI_API_KEY=your_production_openai_key
GITHUB_CLIENT_ID=your_production_github_client_id
GITHUB_CLIENT_SECRET=your_production_github_client_secret
JWT_SECRET_KEY=your_secure_production_jwt_secret
BASE_URL=https://your-app-domain.railway.app
```

## Supported Languages

- Python (.py)
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Java (.java)
- C++ (.cpp, .hpp)
- C (.c, .h)
- Go (.go)
- Rust (.rs)
- PHP (.php)
- Ruby (.rb)
- HTML (.html)
- CSS (.css)
- Shell scripts (.sh, .bash, .zsh)
- PowerShell (.ps1)
- And more...

## Comment Levels

### Minimal
- Essential comments only
- Brief docstrings for non-obvious functions
- Focus on complex logic only

### Standard (Recommended)
- Balanced commenting approach
- Clear function/class documentation
- Key logic explanations
- Business logic clarification

### Detailed
- Comprehensive documentation
- Google-style docstrings
- Detailed parameter descriptions
- Error handling explanations
- Algorithm breakdowns


## Troubleshooting

**"OpenAI API key not configured"**
- Ensure your `.env` file contains a valid `OPENAI_API_KEY`
- Restart the application after adding the key

**GitHub OAuth not working**
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`
- Check that the OAuth callback URL matches your configuration

**Port already in use**
- Change the port in `.env`: `PORT=8001`
- Or kill the process using port 8000: `lsof -ti:8000 | xargs kill`
