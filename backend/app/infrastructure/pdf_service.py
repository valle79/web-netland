import io
from datetime import datetime

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
    discount_type: str = "none",
    discount_value: float = 0,
    discount_amount: float = 0,
    payment_type: str = "credit",
    initial_payment: float = 0,
    installments: int = 0,
    installment_value: float = 0,
    total_amount: float = 0,
    client_name: str | None = None,
    advisor_name: str | None = None,
    advisor_phone: str | None = None,
    notes: str = "",
    date_str: str | None = None,
) -> bytes:
    """Genera una cotización PDF limpia, simple y profesional."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    w, h = A4

    # Colores simples
    black = colors.black
    dark_grey = colors.HexColor("#333333")
    grey = colors.HexColor("#666666")
    light_grey = colors.HexColor("#999999")
    
    # Fecha y hora actual
    generation_datetime = datetime.now().strftime("%d/%m/%Y")
    generation_time = datetime.now().strftime("%H:%M")

    # ==================== HEADER ====================
    y = h - 20 * mm
    
    # Empresa y logo
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(black)
    c.drawCentredString(w / 2, y, "NETLAND")
    y -= 5 * mm
    
    c.setFont("Helvetica", 9)
    c.setFillColor(dark_grey)
    c.drawCentredString(w / 2, y, "CORPORACIÓN INMOBILIARIA")
    y -= 4 * mm
    
    c.setFont("Helvetica", 8)
    c.setFillColor(grey)
    c.drawCentredString(w / 2, y, "Cañete - Lima - Perú")
    y -= 3.5 * mm
    
    c.setFont("Helvetica", 7)
    c.drawCentredString(w / 2, y, "✉ ventas@netland.pe")
    y -= 3 * mm
    c.drawCentredString(w / 2, y, "☎ WhatsApp: 985 928 062")
    
    # Línea separadora
    y -= 5 * mm
    c.setStrokeColor(dark_grey)
    c.setLineWidth(0.5)
    c.line(20 * mm, y, w - 20 * mm, y)

    # ==================== TÍTULO Y DATOS ====================
    y -= 8 * mm
    
    # COTIZACIÓN (centrado)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(black)
    c.drawCentredString(w / 2, y, f"COTIZACIÓN Nº {quote_number}")
    
    y -= 8 * mm
    
    # Fecha y hora (derecha)
    c.setFont("Helvetica", 9)
    c.setFillColor(dark_grey)
    c.drawString(20 * mm, y, f"FECHA: {generation_datetime}")
    c.drawRightString(w - 20 * mm, y, f"HORA: {generation_time}")

    # ==================== DATOS DEL CLIENTE ====================
    y -= 8 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(20 * mm, y, "SEÑOR(ES):")
    c.setFont("Helvetica", 9)
    c.setFillColor(dark_grey)
    c.drawString(45 * mm, y, client_name or "Por confirmar")
    
    y -= 5 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(20 * mm, y, "ATENCIÓN:")
    c.setFont("Helvetica", 9)
    c.setFillColor(dark_grey)
    c.drawString(45 * mm, y, advisor_name or "Netland")
    
    if advisor_phone:
        y -= 5 * mm
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(black)
        c.drawString(20 * mm, y, "CONTACTO:")
        c.setFont("Helvetica", 9)
        c.setFillColor(dark_grey)
        c.drawString(45 * mm, y, advisor_phone)
    
    y -= 5 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(20 * mm, y, "PROYECTO:")
    c.setFont("Helvetica", 9)
    c.setFillColor(dark_grey)
    c.drawString(45 * mm, y, project_name)

    # ==================== TABLA DE DETALLE ====================
    y -= 10 * mm
    
    # Headers de la tabla
    c.setFillColor(colors.white)
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    c.rect(20 * mm, y - 7 * mm, w - 40 * mm, 7 * mm, stroke=1, fill=0)
    
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(22 * mm, y - 4.5 * mm, "DESCRIPCIÓN")
    c.drawRightString(w - 42 * mm, y - 4.5 * mm, "P. UNIT.")
    c.drawRightString(w - 22 * mm, y - 4.5 * mm, "TOTAL")
    
    y -= 7 * mm
    
    # Líneas verticales del header
    c.line(w - 60 * mm, y, w - 60 * mm, y + 7 * mm)
    c.line(w - 40 * mm, y, w - 40 * mm, y + 7 * mm)
    
    # Items
    items = []
    
    # Lote
    lote_desc = f"Lote {lot_code}\nProyecto: {project_name}\nÁrea: {area_m2:.2f} m²" if area_m2 else f"Lote {lot_code}\nProyecto: {project_name}"
    items.append((lote_desc, format_soles(lot_price), format_soles(lot_price)))
    
    # Descuento (si aplica)
    if discount_type != "none" and discount_amount > 0:
        discount_label = f"Descuento ({discount_value}%)" if discount_type == "percentage" else "Descuento aplicado"
        items.append((discount_label, f"-{format_soles(discount_amount)}", f"-{format_soles(discount_amount)}"))
    
    # Modalidad de pago
    if payment_type == "credit":
        payment_desc = f"Modalidad: A crédito\nInicial: {format_soles(initial_payment)}\nSaldo: {installments} cuotas de {format_soles(installment_value)}"
        items.append((payment_desc, "", ""))
    else:
        items.append(("Modalidad: Al contado", "", ""))
    
    # Dibujar items
    for desc, p_unit, total in items:
        lines = desc.split('\n')
        item_height = max(len(lines) * 4 * mm, 8 * mm)
        
        # Fondo blanco
        c.setFillColor(colors.white)
        c.rect(20 * mm, y - item_height, w - 40 * mm, item_height, stroke=1, fill=1)
        
        # Líneas verticales
        c.line(w - 60 * mm, y, w - 60 * mm, y - item_height)
        c.line(w - 40 * mm, y, w - 40 * mm, y - item_height)
        
        # Texto
        c.setFillColor(dark_grey)
        c.setFont("Helvetica", 8)
        y_text = y - 4 * mm
        for line in lines:
            c.drawString(22 * mm, y_text, line)
            y_text -= 4 * mm
        
        if p_unit:
            c.drawRightString(w - 42 * mm, y - 4 * mm, p_unit)
        if total:
            c.drawRightString(w - 22 * mm, y - 4 * mm, total)
        
        y -= item_height

    # ==================== TOTALES ====================
    y -= 2 * mm
    
    # Caja de totales (derecha)
    totales_x = w - 70 * mm
    totales_width = 50 * mm
    
    # Calcular precio final
    final_price = lot_price - discount_amount if discount_amount > 0 else lot_price
    
    # Subtotal / Valor de venta
    c.setStrokeColor(black)
    c.rect(totales_x, y - 6 * mm, totales_width, 6 * mm, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(totales_x + 2 * mm, y - 4 * mm, "VALOR DE VENTA")
    c.drawRightString(totales_x + totales_width - 2 * mm, y - 4 * mm, format_soles(final_price))
    y -= 6 * mm
    
    # IGV (calculado)
    igv = final_price * 0.18
    c.rect(totales_x, y - 6 * mm, totales_width, 6 * mm, stroke=1, fill=0)
    c.setFont("Helvetica", 9)
    c.drawString(totales_x + 2 * mm, y - 4 * mm, "IGV (18%)")
    c.drawRightString(totales_x + totales_width - 2 * mm, y - 4 * mm, format_soles(igv))
    y -= 6 * mm
    
    # TOTAL (destacado)
    c.setFillColor(colors.white)
    c.rect(totales_x, y - 8 * mm, totales_width, 8 * mm, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(black)
    c.drawString(totales_x + 2 * mm, y - 5.5 * mm, "PRECIO DE VENTA")
    c.drawRightString(totales_x + totales_width - 2 * mm, y - 5.5 * mm, format_soles(total_amount))
    y -= 8 * mm

    # ==================== OBSERVACIONES ====================
    if notes:
        y -= 8 * mm
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(black)
        c.drawString(20 * mm, y, "OBSERVACIONES:")
        y -= 5 * mm
        
        note_style = ParagraphStyle(
            "notes",
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=dark_grey,
        )
        note_para = Paragraph(notes, note_style)
        note_para.wrapOn(c, w - 40 * mm, 30 * mm)
        note_para.drawOn(c, 20 * mm, y - 15 * mm)
        y -= 20 * mm

    # ==================== FIRMA ====================
    y = 60 * mm  # Posición fija desde abajo
    
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(black)
    c.drawCentredString(w / 2, y, "A T E N T A M E N T E")
    y -= 15 * mm
    
    # Línea para firma
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    c.line(w / 2 - 30 * mm, y, w / 2 + 30 * mm, y)
    y -= 4 * mm
    
    c.setFont("Helvetica", 9)
    c.setFillColor(dark_grey)
    c.drawCentredString(w / 2, y, advisor_name or "NETLAND")
    y -= 3.5 * mm
    c.setFont("Helvetica", 8)
    c.drawCentredString(w / 2, y, "Área de Ventas")
    y -= 3.5 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawCentredString(w / 2, y, "NETLAND CORPORACIÓN INMOBILIARIA")

    # ==================== FOOTER ====================
    y = 25 * mm
    
    c.setFont("Helvetica", 7)
    c.setFillColor(grey)
    c.drawCentredString(w / 2, y, "Gracias por su preferencia, te esperamos pronto.")
    y -= 4 * mm
    
    # Línea separadora
    c.setStrokeColor(light_grey)
    c.setLineWidth(0.5)
    c.line(20 * mm, y, w - 20 * mm, y)
    y -= 4 * mm
    
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(dark_grey)
    c.drawCentredString(w / 2, y, "Netland Corporación Inmobiliaria | El lugar donde mereces vivir")
    y -= 3.5 * mm
    
    c.setFont("Helvetica", 7)
    c.setFillColor(grey)
    c.drawCentredString(w / 2, y, "Cañete, Lima - Perú | Tel: +51 985 928 062 | Email: ventas@netland.pe")
    y -= 3.5 * mm
    
    c.setFont("Helvetica", 6)
    c.drawCentredString(w / 2, y, f"Cotización {quote_number} generada el {generation_datetime} a las {generation_time}")

    c.save()
    return buffer.getvalue()
