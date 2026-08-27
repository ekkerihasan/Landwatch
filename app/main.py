from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import admin_router, projects_router

app = FastAPI(
    title=settings.app_name,
    description="Predictive analytics for early detection of land acquisition delays (SIH26017).",
    version="0.1.0",
)

# The Next.js dev server is the only client for now.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(admin_router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "app": settings.app_name}
