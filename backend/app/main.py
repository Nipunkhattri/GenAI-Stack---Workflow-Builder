from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db
from app.api.routes import health, workflow, documents, chat, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    pass


def create_app() -> FastAPI:
    settings = get_settings()
    
    app = FastAPI(
        title="Workflow Builder API",
        description="No-Code/Low-Code AI Workflow Builder",
        version="1.0.0",
        lifespan=lifespan
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(health.router, prefix="/api/health", tags=["Health"])
    app.include_router(auth.router, prefix="/api", tags=["Authentication"])
    app.include_router(workflow.router, prefix="/api/workflows", tags=["Workflows"])
    app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
    app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
    
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
