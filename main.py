from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai_service import OpenAIService
import os

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

class CodeAnnotationResponse(BaseModel):
    annotated_code: str
    original_code: str
    language: str

# Initialize OpenAI service
openai_service = OpenAIService()

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

# Mount static files for frontend assets
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Serve the frontend at the root
@app.get("/", include_in_schema=False)
async def serve_frontend():
    return FileResponse("frontend/index.html")