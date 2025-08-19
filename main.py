from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai_service import OpenAIService
import os

app = FastAPI(
    title="AI Code Commenter",
    description="An API for automatically adding comments and docstrings to source code",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Code Commenter API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Request/Response models
class CodeAnnotationRequest(BaseModel):
    code: str
    language: str = "python"

class CodeAnnotationResponse(BaseModel):
    annotated_code: str
    original_code: str
    language: str

# Initialize OpenAI service
openai_service = OpenAIService()

@app.post("/annotate", response_model=CodeAnnotationResponse)
async def annotate_code(request: CodeAnnotationRequest):
    """
    Annotate code with meaningful comments and docstrings using OpenAI GPT-4.
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
            language=request.language
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