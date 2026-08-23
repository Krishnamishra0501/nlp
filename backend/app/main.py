import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from backend.app.config import settings
from backend.app.api.domain import router as domain_router
from backend.app.models.domain_classifier import get_domain_classifier

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload models into memory during app startup
    print("="*60)
    print("Initializing ContractGuard FastAPI Application...")
    print("Preloading Domain Classification models into memory...")
    try:
        classifier = get_domain_classifier()
        print("Domain Classification models successfully loaded!")
    except Exception as e:
        print(f"Warning during model preloading: {e}")
    print("="*60)
    yield
    print("Shutting down ContractGuard FastAPI Application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ContractGuard Model 1: Contract Domain Detection API & Web Dashboard.",
    lifespan=lifespan
)

# CORS configuration for web frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API endpoints under /api/v1
app.include_router(domain_router, prefix=settings.API_V1_STR, tags=["Domain Detection"])

# Mount static frontend directory
FRONTEND_DIR = os.path.join(settings.BASE_DIR, "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/", tags=["Dashboard"])
def serve_dashboard():
    """Serve the ContractGuard Model 1 Web Dashboard."""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
