from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.domain.models import (
    Advisor,
    Client,
    Lead,
    Lot,
    Project,
    Quote,
    QuoteItem,
    Visit,
)
from app.infrastructure.pdf_service import generate_quote_pdf
from app.schemas.crm import (
    AdvisorCreate,
    AdvisorOut,
    AdvisorUpdate,
    ClientOut,
    LeadCreate,
    LeadOut,
    LeadUpdate,
    PublicLeadCreate,
    QuoteCreate,
    QuoteOut,
    VisitCreate,
    VisitOut,
    VisitUpdate,
)

router = APIRouter(tags=["crm"])

LEAD_STATUSES = [
    "new",
    "contacted",
    "interested",
    "visit_scheduled",
    "negotiation",
    "reserved",
    "sold",
    "discarded",
]


def _lead_out(lead: Lead) -> LeadOut:
    out = LeadOut.model_validate(lead)
    if lead.client:
        out.client = ClientOut.model_validate(lead.client)
    if lead.project:
        out.project_name = lead.project.name
    if lead.lot:
        out.lot_code = lead.lot.code
    if lead.advisor:
        out.advisor_name = lead.advisor.name
    return out


def _quote_out(quote: Quote) -> QuoteOut:
    out = QuoteOut.model_validate(quote)
    if quote.project:
        out.project_name = quote.project.name
    if quote.lot:
        out.lot_code = quote.lot.code
    if quote.advisor:
        out.advisor_name = quote.advisor.name
    return out


# ---- Leads ----

@router.post("/leads", response_model=LeadOut, status_code=201)
def create_lead(payload: PublicLeadCreate | LeadCreate, db: Session = Depends(get_db)):
    """Endpoint público y admin para crear un lead."""
    client = Client(
        name=payload.name,
        last_name=payload.last_name,
        phone=payload.phone,
        whatsapp=payload.whatsapp or payload.phone,
        email=payload.email,
    )
    db.add(client)
    db.flush()

    lead = Lead(
        client_id=client.id,
        project_id=getattr(payload, "project_id", None),
        lot_id=getattr(payload, "lot_id", None),
        advisor_id=getattr(payload, "advisor_id", None),
        budget=getattr(payload, "budget", None),
        source=getattr(payload, "source", "web"),
        message=getattr(payload, "message", ""),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return _lead_out(lead)


@router.get("/leads", response_model=list[LeadOut], dependencies=[Depends(get_current_user)])
def list_leads(
    status_filter: str | None = Query(default=None, alias="status"),
    advisor_id: int | None = None,
    project_id: int | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Lead).options(joinedload(Lead.client), joinedload(Lead.project), joinedload(Lead.lot), joinedload(Lead.advisor))
    if status_filter:
        q = q.filter(Lead.status == status_filter)
    if advisor_id:
        q = q.filter(Lead.advisor_id == advisor_id)
    if project_id:
        q = q.filter(Lead.project_id == project_id)
    if search:
        q = q.filter(
            (Client.name.ilike(f"%{search}%")) | (Client.last_name.ilike(f"%{search}%")) | (Client.phone.ilike(f"%{search}%"))
        )
    leads = q.order_by(Lead.created_at.desc()).all()
    return [_lead_out(lead) for lead in leads]


@router.get("/leads/{lead_id}", response_model=LeadOut, dependencies=[Depends(get_current_user)])
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado.")
    return _lead_out(lead)


@router.patch("/leads/{lead_id}", response_model=LeadOut, dependencies=[Depends(get_current_user)])
def update_lead(lead_id: int, payload: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado.")
    data = payload.model_dump(exclude_unset=True)

    if "status" in data:
        if data["status"] not in LEAD_STATUSES:
            raise HTTPException(status_code=400, detail="Estado de lead inválido.")
        if data["status"] == "reserved" and lead.lot and lead.lot.status == "available":
            lead.lot.status = "reserved"
        if data["status"] == "sold" and lead.lot:
            lead.lot.status = "sold"
        if data["status"] == "discarded" and lead.lot and lead.lot.status == "reserved":
            lead.lot.status = "available"

    if "phone" in data and lead.client:
        lead.client.phone = data["phone"]
    if "whatsapp" in data and lead.client:
        lead.client.whatsapp = data["whatsapp"]
    if "email" in data and lead.client:
        lead.client.email = data["email"]

    for key in ("status", "project_id", "lot_id", "advisor_id", "budget", "follow_up"):
        if key in data:
            setattr(lead, key, data[key])

    db.commit()
    db.refresh(lead)
    return _lead_out(lead)


@router.delete("/leads/{lead_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado.")
    db.delete(lead)
    db.commit()


# ---- Clients ----

@router.get("/clients", response_model=list[ClientOut], dependencies=[Depends(get_current_user)])
def list_clients(search: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Client)
    if search:
        q = q.filter((Client.name.ilike(f"%{search}%")) | (Client.phone.ilike(f"%{search}%")))
    return [ClientOut.model_validate(c) for c in q.order_by(Client.created_at.desc()).all()]


# ---- Advisors ----

@router.get("/advisors", response_model=list[AdvisorOut])
def list_advisors(db: Session = Depends(get_db)):
    return [
        AdvisorOut.model_validate(a)
        for a in db.query(Advisor).order_by(Advisor.sort_order).all()
    ]


@router.post("/advisors", response_model=AdvisorOut, dependencies=[Depends(require_admin)])
def create_advisor(payload: AdvisorCreate, db: Session = Depends(get_db)):
    advisor = Advisor(**payload.model_dump())
    db.add(advisor)
    db.commit()
    db.refresh(advisor)
    return AdvisorOut.model_validate(advisor)


@router.put("/advisors/{advisor_id}", response_model=AdvisorOut, dependencies=[Depends(require_admin)])
def update_advisor(advisor_id: int, payload: AdvisorUpdate, db: Session = Depends(get_db)):
    advisor = db.get(Advisor, advisor_id)
    if not advisor:
        raise HTTPException(status_code=404, detail="Asesor no encontrado.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(advisor, key, value)
    db.commit()
    db.refresh(advisor)
    return AdvisorOut.model_validate(advisor)


@router.delete("/advisors/{advisor_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_advisor(advisor_id: int, db: Session = Depends(get_db)):
    advisor = db.get(Advisor, advisor_id)
    if not advisor:
        raise HTTPException(status_code=404, detail="Asesor no encontrado.")
    db.delete(advisor)
    db.commit()


# ---- Visits ----

@router.get("/visits", response_model=list[VisitOut], dependencies=[Depends(get_current_user)])
def list_visits(
    status_filter: str | None = Query(default=None, alias="status"),
    advisor_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Visit).options(joinedload(Visit.lead).joinedload(Lead.client), joinedload(Visit.project), joinedload(Visit.advisor))
    if status_filter:
        q = q.filter(Visit.status == status_filter)
    if advisor_id:
        q = q.filter(Visit.advisor_id == advisor_id)
    visits = q.order_by(Visit.scheduled_at.desc()).all()
    result = []
    for v in visits:
        out = VisitOut.model_validate(v)
        out.lead_name = f"{v.lead.client.name} {v.lead.client.last_name}".strip() if v.lead and v.lead.client else None
        out.project_name = v.project.name if v.project else None
        out.advisor_name = v.advisor.name if v.advisor else None
        result.append(out)
    return result


@router.post("/visits", response_model=VisitOut, dependencies=[Depends(get_current_user)])
def create_visit(payload: VisitCreate, db: Session = Depends(get_db)):
    visit = Visit(**payload.model_dump())
    db.add(visit)
    db.flush()
    lead = db.get(Lead, payload.lead_id)
    if lead and lead.status == "new":
        lead.status = "visit_scheduled"
    db.commit()
    db.refresh(visit)
    return VisitOut.model_validate(visit)


@router.patch("/visits/{visit_id}", response_model=VisitOut, dependencies=[Depends(get_current_user)])
def update_visit(visit_id: int, payload: VisitUpdate, db: Session = Depends(get_db)):
    visit = db.get(Visit, visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(visit, key, value)
    db.commit()
    db.refresh(visit)
    return VisitOut.model_validate(visit)


# ---- Quotes ----

@router.get("/quotes", response_model=list[QuoteOut], dependencies=[Depends(get_current_user)])
def list_quotes(advisor_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Quote).options(joinedload(Quote.project), joinedload(Quote.lot), joinedload(Quote.advisor))
    if advisor_id:
        q = q.filter(Quote.advisor_id == advisor_id)
    return [_quote_out(quote) for quote in q.order_by(Quote.created_at.desc()).all()]


@router.post("/quotes", response_model=QuoteOut, status_code=201, dependencies=[Depends(get_current_user)])
def create_quote(payload: QuoteCreate, db: Session = Depends(get_db)):
    lot = db.get(Lot, payload.lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lote no encontrado.")

    lot_price_value = lot.promo_price or lot.price
    if lot_price_value is None:
        raise HTTPException(status_code=400, detail="El lote no tiene precio definido.")

    lot_price = float(payload.lot_price or lot_price_value)
    initial = float(payload.initial_payment or 0)
    installments = int(payload.installments or 12)
    balance = max(lot_price - initial, 0)
    installment_value = round(balance / installments, 2) if installments else 0
    total = round(lot_price, 2)

    count = db.query(func.count(Quote.id)).scalar() + 1
    quote_number = f"COT-{datetime.now().strftime('%Y%m%d')}-{count:04d}"

    quote = Quote(
        quote_number=quote_number,
        lead_id=payload.lead_id,
        advisor_id=payload.advisor_id,
        project_id=payload.project_id,
        lot_id=lot.id,
        lot_price=lot_price,
        initial_payment=initial,
        installments=installments,
        installment_value=installment_value,
        total_amount=total,
        status="draft",
    )
    db.add(quote)
    db.flush()

    db.add(QuoteItem(quote_id=quote.id, description=f"Lote {lot.code}", amount=lot_price))
    db.add(QuoteItem(quote_id=quote.id, description="Cuota inicial", amount=initial))
    db.add(QuoteItem(quote_id=quote.id, description=f"Saldo en {installments} cuotas", amount=installment_value))

    db.commit()
    db.refresh(quote)
    return _quote_out(quote)


@router.get("/quotes/{quote_id}/pdf", dependencies=[Depends(get_current_user)])
def generate_quote_pdf_endpoint(quote_id: int, db: Session = Depends(get_db)):
    quote = db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")

    client_name = None
    if quote.lead and quote.lead.client:
        client_name = f"{quote.lead.client.name} {quote.lead.client.last_name}".strip()
    advisor_name = quote.advisor.name if quote.advisor else None
    advisor_phone = quote.advisor.whatsapp if quote.advisor else None

    project_name = quote.project.name if quote.project else "Netland"
    lot_code = quote.lot.code if quote.lot else ""

    from fastapi.responses import Response

    pdf = generate_quote_pdf(
        quote_number=quote.quote_number,
        company_name=settings.APP_NAME,
        project_name=project_name,
        lot_code=lot_code,
        area_m2=float(quote.lot.area_m2) if quote.lot and quote.lot.area_m2 else None,
        lot_price=float(quote.lot_price or 0),
        initial_payment=float(quote.initial_payment or 0),
        installments=quote.installments or 12,
        installment_value=float(quote.installment_value or 0),
        total_amount=float(quote.total_amount or 0),
        client_name=client_name,
        advisor_name=advisor_name,
        advisor_phone=advisor_phone,
        date_str=datetime.now().strftime("%d/%m/%Y"),
    )
    quote.status = "sent"
    db.commit()
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{quote.quote_number}.pdf"'},
    )


@router.get("/quote-statuses")
def quote_statuses():
    return LEAD_STATUSES