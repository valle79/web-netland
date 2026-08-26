from fastapi import APIRouter

from app.api.routes import auth, config, crm, dashboard, excel_import, plan_import, projects, uploads, users

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(crm.router)
api_router.include_router(users.router)
api_router.include_router(dashboard.router)
api_router.include_router(config.router)
api_router.include_router(uploads.router)
api_router.include_router(excel_import.router)
api_router.include_router(excel_import.template_router)
api_router.include_router(plan_import.router)