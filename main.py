from fastapi import FastAPI, HTTPException, Request, Response, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
from openai_service import OpenAIService
from github_service import GitHubService
from typing import Optional, List, Dict, Any
import os
import uuid

app = FastAPI(
    title="AI Code Commenter",
    description="An API for automatically adding comments and docstrings to source code.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Request/Response models
class CodeAnnotationRequest(BaseModel):
    code: str
    language: str = "python"
    comment_level: str = "standard"

class CodeAnnotationResponse(BaseModel):
    annotated_code: str
    original_code: str
    language: str

# GitHub OAuth models
class GitHubAuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]

class RepositoryResponse(BaseModel):
    repositories: List[Dict[str, Any]]

class FileContentResponse(BaseModel):
    contents: List[Dict[str, Any]]

class GitHubFileRequest(BaseModel):
    owner: str
    repo: str
    path: str
    language: str = "python"
    comment_level: str = "standard"

# Initialize services
openai_service = OpenAIService()
github_service = GitHubService()

@app.post("/annotate", response_model=CodeAnnotationResponse)
async def annotate_code(request: CodeAnnotationRequest):
    """
    Annotate code with meaningful comments and docstrings.
    """
    try:
        # Check if OpenAI API key is configured
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(
                status_code=500, 
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        # Validate input
        if not request.code.strip():
            raise HTTPException(status_code=400, detail="Code cannot be empty")
        
        # Call OpenAI service to annotate the code
        annotated_code = openai_service.annotate_python_code(
            code=request.code,
            language=request.language,
            comment_level=request.comment_level
        )
        
        return CodeAnnotationResponse(
            annotated_code=annotated_code,
            original_code=request.code,
            language=request.language
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error annotating code: {str(e)}")

# GitHub OAuth endpoints
@app.get("/auth/github")
async def github_login():
    """Initiate GitHub OAuth flow"""
    state = str(uuid.uuid4())
    redirect_uri = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/auth/callback"
    auth_url = github_service.get_oauth_url(redirect_uri, state)
    
    response = RedirectResponse(url=auth_url)
    response.set_cookie(key="oauth_state", value=state, httponly=True, max_age=600)
    return response

@app.get("/auth/callback")
async def github_callback(code: str, state: str, oauth_state: str = Cookie(None)):
    """Handle GitHub OAuth callback"""
    # Verify state parameter
    if state != oauth_state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    try:
        # Exchange code for access token
        access_token = github_service.exchange_code_for_token(code)
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        # Get user information
        user_info = github_service.get_user_info(access_token)
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user information")
        
        # Create JWT token
        jwt_token = github_service.create_jwt_token(user_info, access_token)
        
        # Redirect to frontend with token
        response = RedirectResponse(url=f"/?token={jwt_token}")
        response.delete_cookie(key="oauth_state")
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")

# Helper function to get current user
async def get_current_user(authorization: str = Cookie(None)) -> Dict[str, Any]:
    """Extract user from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token_data = github_service.decode_jwt_token(authorization)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return token_data

@app.get("/auth/user")
async def get_user(current_user: Dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return {"user": current_user["user"]}

@app.post("/auth/logout")
async def logout():
    """Logout user"""
    response = Response()
    response.delete_cookie(key="authorization")
    return {"message": "Logged out successfully"}

# GitHub API endpoints
@app.get("/repos", response_model=RepositoryResponse)
async def get_repositories(current_user: Dict = Depends(get_current_user)):
    """Get user's repositories"""
    access_token = current_user["github_token"]
    repos = github_service.get_user_repositories(access_token)
    return RepositoryResponse(repositories=repos)

@app.get("/repos/{owner}/{repo}/contents", response_model=FileContentResponse)
async def get_repository_contents(
    owner: str, 
    repo: str, 
    path: str = "",
    current_user: Dict = Depends(get_current_user)
):
    """Get repository contents"""
    access_token = current_user["github_token"]
    contents = github_service.get_repository_contents(access_token, owner, repo, path)
    return FileContentResponse(contents=contents)

@app.post("/repos/annotate", response_model=CodeAnnotationResponse)
async def annotate_github_file(
    request: GitHubFileRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Annotate a file from GitHub repository"""
    try:
        # Check if OpenAI API key is configured
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(
                status_code=500, 
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        access_token = current_user["github_token"]
        
        # Get file content from GitHub
        file_content = github_service.get_file_content(
            access_token, request.owner, request.repo, request.path
        )
        
        if not file_content:
            raise HTTPException(status_code=404, detail="File not found or cannot be read")
        
        # Annotate the code
        annotated_code = openai_service.annotate_python_code(
            code=file_content,
            language=request.language,
            comment_level=request.comment_level
        )
        
        return CodeAnnotationResponse(
            annotated_code=annotated_code,
            original_code=file_content,
            language=request.language
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error annotating GitHub file: {str(e)}")

# Mount static files for frontend assets
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Serve the frontend at the root
@app.get("/", include_in_schema=False)
async def serve_frontend():
    return FileResponse("frontend/index.html")