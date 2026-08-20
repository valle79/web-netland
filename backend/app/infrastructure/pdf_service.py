import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


def format_soles(value: float | None) -> str:
    if value is None:
        return "S/ ---"
    return f"S/ {value:,.2f}"


def generate_quote_pdf(
    quote_number: str,
    company_name: str,
    project_name: str,
    lot_code: str,
    area_m2: float | None,
    lot_price: float,
    initial_payment: float,
    installments: int,
    installment_value: float,
    total_amount: float,
    client_name: str | None = None,
    advisor_name: str | None = None,
    advisor_phone: str | None = None,
    date_str: str | None = None,
) -> bytes:
    """Genera una cotización PDF profesional y devuelve los bytes del archivo."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    w, h = A4

    primary = colors.HexColor("#14532d")
    navy = colors.HexColor("#1e3a5f")
    gold = colors.HexColor("#b9924e")
    grey = colors.HexColor("#666666")
    light_grey = colors.HexColor("#f5f5f0")

    # Header
    c.setFillColor(primary)
    c.rect(0, h - 30 * mm, w, 30 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(20 * mm, h - 19 * mm, company_name)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#e8e8e0"))
    c.drawString(20 * mm, h - 24 * mm, "El lugar donde mereces vivir")

    # Quote title
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(20 * mm, h - 40 * mm, "COTIZACIÓN DE LOTE")
    c.setFillColor(grey)
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, h - 45 * mm, f"N° {quote_number}")
    c.drawRightString(w - 20 * mm, h - 45 * mm, date_str or "")

    # Data table
    data = [
        ("Proyecto", project_name),
        ("Lote", lot_code),
        ("Área", f"{area_m2:.2f} m²" if area_m2 else "---"),
        ("Cliente", client_name or "Por confirmar"),
        ("Asesor", f"{advisor_name or 'Netland'}{f' - {advisor_phone}' if advisor_phone else ''}"),
    ]

    y = h - 55 * mm
    c.setFillColor(light_grey)
    c.rect(20 * mm, y - 8 * mm, w - 40 * mm, len(data) * 9 * mm + 6 * mm, stroke=0, fill=1)
    for label, value in data:
        c.setFillColor(primary)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(24 * mm, y, label)
        c.setFillColor(navy)
        c.setFont("Helvetica", 10)
        c.drawString(80 * mm, y, value)
        y -= 9 * mm

    # Payment detail
    y -= 10 * mm
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(20 * mm, y, "Plan de financiamiento")
    y -= 12 * mm

    rows = [
        ("Precio del lote", format_soles(lot_price)),
        ("Inicial", format_soles(initial_payment)),
        ("Saldo a financiar", format_soles(max(lot_price - initial_payment, 0))),
        ("Número de cuotas", str(installments)),
        ("Valor de cuota", format_soles(installment_value)),
        ("Total a pagar", format_soles(total_amount)),
    ]

    for label, value in rows:
        c.setFillColor(light_grey)
        c.rect(20 * mm, y - 6 * mm, w - 40 * mm, 6 * mm, stroke=0, fill=1)
        c.setFillColor(primary)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(24 * mm, y - 4 * mm, label)
        c.setFillColor(navy)
        c.setFont("Helvetica-Bold", 10)
        c.drawRightString(w - 24 * mm, y - 4 * mm, value)
        y -= 8 * mm

    y -= 12 * mm
    style = ParagraphStyle(
        "note",
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=grey,
    )
    note = Paragraph(
        "<b>Nota:</b> Esta cotización es informativa y no constituye una reserva. "
        "Los precios y condiciones pueden variar. Consulte a su asesor de Netland "
        "para confirmar disponibilidad y promociones vigentes.",
        style,
    )
    note.wrapOn(c, w - 40 * mm, 40 * mm)
    note.drawOn(c, 20 * mm, y - 12 * mm)

    # Footer
    c.setFillColor(primary)
    c.rect(0, 0, w, 12 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 8)
    c.drawCentredString(w / 2, 6 * mm, "NETLAND CORPORACIÓN INMOBILIARIA  ·  Cañete, Perú  ·  WhatsApp 985 928 062")
    c.drawCentredString(w / 2, 3 * mm, f"Cotización {quote_number} generada el {date_str or ''}")

    c.save()
    return buffer.getvalue()