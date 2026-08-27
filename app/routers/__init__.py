from app.routers.admin import router as admin_router
from app.routers.crud import router as crud_router
from app.routers.estimate import router as estimate_router
from app.routers.projects import router as projects_router

__all__ = ["admin_router", "crud_router", "estimate_router", "projects_router"]
