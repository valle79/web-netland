from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.domain.models import SiteConfig

router = APIRouter(prefix="/config", tags=["config"])

PUBLIC_KEYS = {"company_legal_info", "company_schedules", "company_facebook", "company_instagram", "hero_video_url", "hero_video_title"}


@router.get("/public")
def public_config(db: Session = Depends(get_db)):
    configs = db.query(SiteConfig).filter(SiteConfig.key.in_(PUBLIC_KEYS)).all()
    return {c.key: c.value for c in configs}


@router.get("", dependencies=[Depends(require_admin)])
def admin_config(db: Session = Depends(get_db)):
    return {c.key: c.value for c in db.query(SiteConfig).all()}


@router.put("", dependencies=[Depends(require_admin)])
def update_config(payload: dict[str, str], db: Session = Depends(get_db)):
    for key, value in payload.items():
        config = db.query(SiteConfig).filter(SiteConfig.key == key).first()
        if config:
            config.value = value
        else:
            db.add(SiteConfig(key=key, value=value))
    db.commit()
    return {"ok": True}