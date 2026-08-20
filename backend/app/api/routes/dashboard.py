from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.domain.models import Advisor, Lead, Lot, Project, Quote, Visit

router = APIRouter(prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(require_roles("SUPER_ADMIN", "ADMIN"))])


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    lots_status = (
        db.query(Lot.status, func.count(Lot.id))
        .group_by(Lot.status)
        .all()
    )
    status_map = dict(lots_status)

    leads_status = (
        db.query(Lead.status, func.count(Lead.id))
        .group_by(Lead.status)
        .all()
    )
    lead_map = dict(leads_status)

    return {
        "projects_total": db.query(func.count(Project.id)).scalar() or 0,
        "projects_published": db.query(func.count(Project.id)).filter(Project.is_published.is_(True)).scalar() or 0,
        "lots_total": db.query(func.count(Lot.id)).scalar() or 0,
        "lots_available": status_map.get("available", 0),
        "lots_reserved": status_map.get("reserved", 0),
        "lots_sold": status_map.get("sold", 0),
        "lots_not_available": status_map.get("not_available", 0),
        "leads_total": db.query(func.count(Lead.id)).scalar() or 0,
        "leads_new": lead_map.get("new", 0),
        "leads_visit_scheduled": lead_map.get("visit_scheduled", 0),
        "leads_by_status": [{"status": s, "count": c} for s, c in leads_status],
        "lots_by_status": [{"status": s, "count": c} for s, c in lots_status],
        "visits_total": db.query(func.count(Visit.id)).scalar() or 0,
        "advisors_total": db.query(func.count(Advisor.id)).scalar() or 0,
        "quotes_total": db.query(func.count(Quote.id)).scalar() or 0,
        "leads_by_project": [
            {"project": p.name, "count": count}
            for p, count in db.query(Project, func.count(Lead.id))
            .outerjoin(Lead, Lead.project_id == Project.id)
            .group_by(Project.id)
            .all()
        ],
    }