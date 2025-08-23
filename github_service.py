import os
import requests
from typing import Optional, Dict, List, Any
from github import Github
from dotenv import load_dotenv
from jose import jwt, JWTError
from datetime import datetime, timedelta

load_dotenv()

class GitHubService:
    def __init__(self):
        self.client_id = os.getenv("GITHUB_CLIENT_ID")
        self.client_secret = os.getenv("GITHUB_CLIENT_SECRET")
        self.jwt_secret = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
        
    def get_oauth_url(self, redirect_uri: str, state: str = None) -> str:
        """Generate GitHub OAuth authorization URL"""
        base_url = "https://github.com/login/oauth/authorize"
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "scope": "repo,user:email",
            "state": state
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items() if v])
        return f"{base_url}?{query_string}"
    
    def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange OAuth code for access token"""
        if not self.client_id or not self.client_secret:
            raise Exception("GitHub OAuth credentials not configured")
            
        url = "https://github.com/login/oauth/access_token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code
        }
        
        headers = {"Accept": "application/json"}
        response = requests.post(url, data=data, headers=headers)
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        return None
    
    def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from GitHub"""
        try:
            g = Github(access_token)
            user = g.get_user()
            return {
                "login": user.login,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "email": user.email,
                "public_repos": user.public_repos
            }
        except Exception as e:
            print(f"Error getting user info: {e}")
            return None
    
    def get_user_repositories(self, access_token: str) -> List[Dict[str, Any]]:
        """Get user's repositories"""
        try:
            g = Github(access_token)
            user = g.get_user()
            repos = []
            
            for repo in user.get_repos(sort="updated", direction="desc"):
                repos.append({
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description,
                    "private": repo.private,
                    "language": repo.language,
                    "updated_at": repo.updated_at.isoformat(),
                    "html_url": repo.html_url
                })
                
            return repos
        except Exception as e:
            print(f"Error getting repositories: {e}")
            return []
    
    def get_repository_contents(self, access_token: str, owner: str, repo: str, path: str = "") -> List[Dict[str, Any]]:
        """Get repository file/folder contents"""
        try:
            g = Github(access_token)
            repository = g.get_repo(f"{owner}/{repo}")
            contents = repository.get_contents(path)
            
            if not isinstance(contents, list):
                contents = [contents]
                
            items = []
            for content in contents:
                # Only include supported file types and directories
                if content.type == "dir" or self._is_supported_file(content.name):
                    items.append({
                        "name": content.name,
                        "path": content.path,
                        "type": content.type,
                        "size": content.size,
                        "download_url": content.download_url if content.type == "file" else None
                    })
                    
            # Sort: directories first, then files alphabetically
            items.sort(key=lambda x: (x["type"] == "file", x["name"].lower()))
            return items
            
        except Exception as e:
            print(f"Error getting repository contents: {e}")
            return []
    
    def get_file_content(self, access_token: str, owner: str, repo: str, path: str) -> Optional[str]:
        """Get content of a specific file"""
        try:
            g = Github(access_token)
            repository = g.get_repo(f"{owner}/{repo}")
            file_content = repository.get_contents(path)
            
            if file_content.encoding == "base64":
                import base64
                return base64.b64decode(file_content.content).decode('utf-8')
            else:
                return file_content.decoded_content.decode('utf-8')
                
        except Exception as e:
            print(f"Error getting file content: {e}")
            return None
    
    def _is_supported_file(self, filename: str) -> bool:
        """Check if file type is supported for annotation"""
        supported_extensions = {
            '.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.c', 
            '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.kt', 
            '.swift', '.m', '.mm', '.scala', '.clj', '.hs', '.ml', 
            '.r', '.sql', '.sh', '.bash', '.zsh', '.ps1'
        }
        
        for ext in supported_extensions:
            if filename.lower().endswith(ext):
                return True
        return False
    
    def create_jwt_token(self, user_data: Dict[str, Any], access_token: str) -> str:
        """Create JWT token for session management"""
        payload = {
            "user": user_data,
            "github_token": access_token,
            "exp": datetime.utcnow() + timedelta(days=7)
        }
        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")
    
    def decode_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode JWT token and return payload"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            return payload
        except JWTError:
            return None