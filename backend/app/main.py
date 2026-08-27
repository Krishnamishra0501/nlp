import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from backend.app.config import settings

from backend.app.api.domain import router as domain_router
from backend.app.api.risk import router as risk_router

from backend.app.models.domain_classifier import get_domain_classifier


@asynccontextmanager
async def lifespan(app: FastAPI):

    print("=" * 60)
    print("Initializing ContractGuard FastAPI Application...")

    print("Preloading Domain Classification models...")

    try:

        classifier = get_domain_classifier()

        print(
            "Domain Classification models successfully loaded!"
        )

    except Exception as e:

        print(
            f"Warning during domain model preloading: {e}"
        )

    print("Preloading Risk Analysis models...")

    try:

        from backend.app.services.risk_classifier import RiskClassifier

        risk_classifier = RiskClassifier()

        print(
            f"Risk Analysis models successfully loaded!"
        )

        print(
            f"Risk device: {risk_classifier.device}"
        )

        print(
            f"NLI device: {risk_classifier.nli.device}"
        )

    except Exception as e:

        print(
            f"Warning during risk model preloading: {e}"
        )

    print("=" * 60)

    yield

    print(
        "Shutting down ContractGuard FastAPI Application..."
    )


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "ContractGuard API for contract domain detection "
        "and NLP-based contractual risk analysis."
    ),
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    domain_router,
    prefix=settings.API_V1_STR,
    tags=["Domain Detection"]
)


app.include_router(
    risk_router,
    prefix=settings.API_V1_STR,
    tags=["Risk Analysis"]
)


FRONTEND_DIR = os.path.join(
    settings.BASE_DIR,
    "frontend"
)


if os.path.exists(FRONTEND_DIR):

    app.mount(
        "/static",
        StaticFiles(
            directory=FRONTEND_DIR
        ),
        name="static"
    )


@app.get(
    "/",
    tags=["Dashboard"]
)
def serve_dashboard():

    index_path = os.path.join(
        FRONTEND_DIR,
        "index.html"
    )

    if os.path.exists(index_path):

        return FileResponse(
            index_path
        )

    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online"
    }


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )