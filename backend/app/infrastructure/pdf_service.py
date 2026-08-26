import io
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader


# ============================================================================
# FORMATO DE MONEDA
# ============================================================================

def format_soles(value: float | None) -> str:
    if value is None:
        return "S/ ---"
    return f"S/ {value:,.2f}"


# ============================================================================
# GENERADOR DE COTIZACIÓN INMOBILIARIA
# ============================================================================

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
    """
    Genera una cotización inmobiliaria profesional para la venta
    de lotes de terreno.

    Diseño:
    - A4
    - Estilo corporativo sobrio
    - Azul noche + marrón mostaza
    - Logo corporativo en encabezado
    - Cards ligeros
    - Sin firma del asesor
    - Pie de página compacto
    """

    buffer = io.BytesIO()

    c = canvas.Canvas(
        buffer,
        pagesize=A4,
    )

    width, height = A4

    # =========================================================================
    # PALETA CORPORATIVA
    # =========================================================================

    # Azul noche principal
    NAVY = colors.HexColor("#17324D")

    # Azul secundario
    BLUE = colors.HexColor("#2F668F")

    # Azul muy suave para cards/títulos
    BLUE_LIGHT = colors.HexColor("#EAF2F7")

    # Fondo azul muy suave
    BLUE_PALE = colors.HexColor("#F5F8FA")

    # Marrón mostaza corporativo
    MUSTARD = colors.HexColor("#B58A3A")

    # Mostaza suave para fondos
    MUSTARD_LIGHT = colors.HexColor("#F5EEDC")

    # Textos
    DARK = colors.HexColor("#263238")
    TEXT = colors.HexColor("#37474F")
    GREY = colors.HexColor("#6B7780")
    LIGHT_GREY = colors.HexColor("#B8C1C7")

    # Bordes
    BORDER = colors.HexColor("#DCE3E7")

    # Fondo general
    BACKGROUND = colors.HexColor("#FAFBFC")

    WHITE = colors.white

    # =========================================================================
    # MEDIDAS
    # =========================================================================

    margin_left = 18 * mm
    margin_right = 18 * mm

    content_width = width - margin_left - margin_right
    right_x = width - margin_right

    # =========================================================================
    # FECHA
    # =========================================================================

    now = datetime.now()

    generation_date = (
        date_str
        if date_str
        else now.strftime("%d/%m/%Y")
    )

    generation_time = now.strftime("%H:%M")

    # =========================================================================
    # DATOS
    # =========================================================================

    client = client_name or "Cliente por confirmar"
    advisor = advisor_name or "Área de Ventas"
    phone = advisor_phone or "985 928 062"

    area_text = (
        f"{area_m2:,.2f} m²"
        if area_m2 is not None
        else "Por definir"
    )

    # =========================================================================
    # PRECIO FINAL
    # =========================================================================

    final_price = (
        lot_price - discount_amount
        if discount_amount > 0
        else lot_price
    )

    display_total = (
        total_amount
        if total_amount > 0
        else final_price
    )

    # =========================================================================
    # FONDO
    # =========================================================================

    c.setFillColor(BACKGROUND)

    c.rect(
        0,
        0,
        width,
        height,
        stroke=0,
        fill=1,
    )

    # =========================================================================
    # HEADER
    # =========================================================================

    y = height - 18 * mm

    # -------------------------------------------------------------------------
    # LOGO
    # -------------------------------------------------------------------------

    logo_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "static",
        "logo-netland.png",
    )

    # Logo aumentado
    logo_width = 22 * mm
    logo_height = 22 * mm

    logo_x = margin_left
    logo_y = y - 16 * mm

    logo_exists = False

    if os.path.exists(logo_path):
        try:
            logo_img = ImageReader(logo_path)

            c.drawImage(
                logo_img,
                logo_x,
                logo_y,
                width=logo_width,
                height=logo_height,
                preserveAspectRatio=True,
                mask="auto",
            )

            logo_exists = True

        except Exception:
            logo_exists = False

    # -------------------------------------------------------------------------
    # INFORMACIÓN DE LA EMPRESA
    # -------------------------------------------------------------------------

    if logo_exists:
        company_x = margin_left + logo_width + 5 * mm
    else:
        company_x = margin_left

    # Título principal: SOLO NETLAND
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 16)

    c.drawString(
        company_x,
        y,
        "NETLAND",
    )

    # Subtítulo
    c.setFillColor(MUSTARD)
    c.setFont("Helvetica-Bold", 7.2)

    c.drawString(
        company_x,
        y - 4.8 * mm,
        "CORPORACIÓN INMOBILIARIA",
    )

    # Ubicación
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6.8)

    c.drawString(
        company_x,
        y - 9 * mm,
        "Cañete · Lima · Perú",
    )

    # -------------------------------------------------------------------------
    # INFORMACIÓN DE LA COTIZACIÓN
    # -------------------------------------------------------------------------

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8.5)

    c.drawRightString(
        right_x,
        y,
        "COTIZACIÓN INMOBILIARIA",
    )

    c.setFillColor(MUSTARD)
    c.setFont("Helvetica-Bold", 9.2)

    c.drawRightString(
        right_x,
        y - 4.8 * mm,
        f"N.º {quote_number}",
    )

    c.setFillColor(GREY)
    c.setFont("Helvetica", 6.8)

    c.drawRightString(
        right_x,
        y - 9 * mm,
        f"{generation_date} · {generation_time}",
    )

    # -------------------------------------------------------------------------
    # DETALLE DECORATIVO DEL HEADER
    # -------------------------------------------------------------------------

    y -= 16 * mm

    # Línea azul noche
    c.setStrokeColor(NAVY)
    c.setLineWidth(0.8)



    # Pequeño detalle mostaza
    c.setStrokeColor(MUSTARD)
    c.setLineWidth(1.8)

    c.line(
        margin_left,
        y,
        margin_left + 28 * mm,
        y,
    )

    # =========================================================================
    # DATOS DEL CLIENTE
    # =========================================================================

    y -= 8 * mm

    # Título de sección
    c.setFillColor(BLUE_LIGHT)

    c.roundRect(
        margin_left,
        y - 5.5 * mm,
        43 * mm,
        6 * mm,
        1.5 * mm,
        stroke=0,
        fill=1,
    )

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 7.5)

    c.drawString(
        margin_left + 3 * mm,
        y - 3.7 * mm,
        "DATOS DEL CLIENTE",
    )

    y -= 10 * mm

    # -------------------------------------------------------------------------
    # CARD CLIENTE
    # -------------------------------------------------------------------------

    card_height = 27 * mm

    c.setFillColor(WHITE)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)

    c.roundRect(
        margin_left,
        y - card_height,
        content_width,
        card_height,
        2 * mm,
        stroke=1,
        fill=1,
    )

    # Barra lateral azul
    c.setFillColor(BLUE)

    c.roundRect(
        margin_left,
        y - card_height,
        1.3 * mm,
        card_height,
        0.7 * mm,
        stroke=0,
        fill=1,
    )

    # Fila 1
    row_y = y - 7 * mm

    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        margin_left + 5 * mm,
        row_y,
        "CLIENTE",
    )

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8.5)

    c.drawString(
        margin_left + 29 * mm,
        row_y,
        client,
    )

    # Proyecto
    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        width / 2,
        row_y,
        "PROYECTO",
    )

    c.setFillColor(DARK)
    c.setFont("Helvetica", 8.3)

    c.drawString(
        width / 2 + 25 * mm,
        row_y,
        project_name,
    )

    # Fila 2
    row_y -= 8 * mm

    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        margin_left + 5 * mm,
        row_y,
        "LOTE",
    )

    c.setFillColor(MUSTARD)
    c.setFont("Helvetica-Bold", 8.5)

    c.drawString(
        margin_left + 29 * mm,
        row_y,
        f"Lote {lot_code}",
    )

    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        width / 2,
        row_y,
        "ÁREA",
    )

    c.setFillColor(DARK)
    c.setFont("Helvetica", 8.3)

    c.drawString(
        width / 2 + 25 * mm,
        row_y,
        area_text,
    )

    # Fila 3
    row_y -= 7 * mm

    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        margin_left + 5 * mm,
        row_y,
        "ASESOR",
    )

    c.setFillColor(TEXT)
    c.setFont("Helvetica", 8)

    c.drawString(
        margin_left + 29 * mm,
        row_y,
        advisor,
    )

    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        width / 2,
        row_y,
        "CONTACTO",
    )

    c.setFillColor(TEXT)
    c.setFont("Helvetica", 8)

    c.drawString(
        width / 2 + 25 * mm,
        row_y,
        phone,
    )

    y -= card_height + 10 * mm

    # =========================================================================
    # DETALLE DEL INMUEBLE
    # =========================================================================

    c.setFillColor(BLUE_LIGHT)

    c.roundRect(
        margin_left,
        y - 5.5 * mm,
        52 * mm,
        6 * mm,
        1.5 * mm,
        stroke=0,
        fill=1,
    )

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 7.5)

    c.drawString(
        margin_left + 3 * mm,
        y - 3.7 * mm,
        "DETALLE DEL INMUEBLE",
    )

    y -= 10 * mm

    # =========================================================================
    # TABLA PRINCIPAL
    # =========================================================================

    table_x = margin_left
    table_right = right_x

    header_height = 8 * mm

    # Cabecera
    c.setFillColor(NAVY)

    c.roundRect(
        table_x,
        y - header_height,
        content_width,
        header_height,
        1.5 * mm,
        stroke=0,
        fill=1,
    )

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        table_x + 4 * mm,
        y - 5 * mm,
        "INMUEBLE",
    )

    c.drawCentredString(
        table_x + content_width * 0.57,
        y - 5 * mm,
        "ÁREA",
    )

    c.drawRightString(
        table_right - 38 * mm,
        y - 5 * mm,
        "VALOR",
    )

    c.drawRightString(
        table_right - 4 * mm,
        y - 5 * mm,
        "TOTAL",
    )

    y -= header_height

    # -------------------------------------------------------------------------
    # FILA LOTE
    # -------------------------------------------------------------------------

    row_height = 19 * mm

    c.setFillColor(WHITE)
    c.setStrokeColor(BORDER)

    c.rect(
        table_x,
        y - row_height,
        content_width,
        row_height,
        stroke=1,
        fill=1,
    )

    # Descripción
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8.5)

    c.drawString(
        table_x + 4 * mm,
        y - 7 * mm,
        f"Lote {lot_code}",
    )

    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.2)

    c.drawString(
        table_x + 4 * mm,
        y - 12 * mm,
        "Terreno dentro del proyecto inmobiliario",
    )

    c.setFont("Helvetica", 7)

    c.drawString(
        table_x + 4 * mm,
        y - 16 * mm,
        project_name,
    )

    # Área
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 8)

    c.drawCentredString(
        table_x + content_width * 0.57,
        y - 10 * mm,
        area_text,
    )

    # Precio
    c.drawRightString(
        table_right - 38 * mm,
        y - 10 * mm,
        format_soles(lot_price),
    )

    c.setFont("Helvetica-Bold", 8)

    c.drawRightString(
        table_right - 4 * mm,
        y - 10 * mm,
        format_soles(lot_price),
    )

    y -= row_height

    # =========================================================================
    # DESCUENTO
    # =========================================================================

    if discount_type != "none" and discount_amount > 0:

        discount_height = 9 * mm

        c.setFillColor(MUSTARD_LIGHT)

        c.rect(
            table_x,
            y - discount_height,
            content_width,
            discount_height,
            stroke=0,
            fill=1,
        )

        if discount_type == "percentage":
            discount_label = (
                f"Beneficio comercial ({discount_value}%)"
            )
        else:
            discount_label = "Beneficio comercial"

        c.setFillColor(TEXT)
        c.setFont("Helvetica", 7.5)

        c.drawString(
            table_x + 4 * mm,
            y - 5.5 * mm,
            discount_label,
        )

        c.setFillColor(MUSTARD)
        c.setFont("Helvetica-Bold", 8)

        c.drawRightString(
            table_right - 4 * mm,
            y - 5.5 * mm,
            f"- {format_soles(discount_amount)}",
        )

        y -= discount_height

    # =========================================================================
    # CONDICIONES DE PAGO
    # =========================================================================

    y -= 10 * mm

    c.setFillColor(BLUE_LIGHT)

    c.roundRect(
        margin_left,
        y - 5.5 * mm,
        52 * mm,
        6 * mm,
        1.5 * mm,
        stroke=0,
        fill=1,
    )

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 7.5)

    c.drawString(
        margin_left + 3 * mm,
        y - 3.7 * mm,
        "CONDICIONES DE PAGO",
    )

    y -= 10 * mm

    # -------------------------------------------------------------------------
    # CARD DE PAGO
    # -------------------------------------------------------------------------

    payment_height = 27 * mm

    c.setFillColor(WHITE)
    c.setStrokeColor(BORDER)

    c.roundRect(
        margin_left,
        y - payment_height,
        content_width,
        payment_height,
        2 * mm,
        stroke=1,
        fill=1,
    )

    # Barra lateral mostaza
    c.setFillColor(MUSTARD)

    c.roundRect(
        margin_left,
        y - payment_height,
        1.3 * mm,
        payment_height,
        0.7 * mm,
        stroke=0,
        fill=1,
    )

    row_y = y - 7 * mm

    # Modalidad
    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        margin_left + 5 * mm,
        row_y,
        "MODALIDAD",
    )

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8)

    if payment_type == "credit":
        payment_label = "Financiamiento directo"
    else:
        payment_label = "Pago al contado"

    c.drawString(
        margin_left + 29 * mm,
        row_y,
        payment_label,
    )

    # Inicial
    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        width / 2,
        row_y,
        "CUOTA INICIAL",
    )

    c.setFillColor(MUSTARD)
    c.setFont("Helvetica-Bold", 8.5)

    c.drawString(
        width / 2 + 31 * mm,
        row_y,
        format_soles(initial_payment),
    )

    if payment_type == "credit":

        row_y -= 9 * mm

        # Saldo
        saldo = max(
            display_total - initial_payment,
            0,
        )

        c.setFillColor(GREY)
        c.setFont("Helvetica-Bold", 7)

        c.drawString(
            margin_left + 5 * mm,
            row_y,
            "SALDO",
        )

        c.setFillColor(TEXT)
        c.setFont("Helvetica", 8)

        c.drawString(
            margin_left + 29 * mm,
            row_y,
            format_soles(saldo),
        )

        # Cuotas
        c.setFillColor(GREY)
        c.setFont("Helvetica-Bold", 7)

        c.drawString(
            width / 2,
            row_y,
            "PLAN DE CUOTAS",
        )

        c.setFillColor(TEXT)
        c.setFont("Helvetica", 8)

        cuotas_text = (
            f"{installments} cuotas mensuales de "
            f"{format_soles(installment_value)}"
        )

        c.drawString(
            width / 2 + 31 * mm,
            row_y,
            cuotas_text,
        )

    y -= payment_height + 10 * mm

    # =========================================================================
    # RESUMEN ECONÓMICO
    # =========================================================================

    summary_width = 76 * mm
    summary_x = width - margin_right - summary_width

    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 7)

    c.drawString(
        summary_x,
        y,
        "RESUMEN ECONÓMICO",
    )

    y -= 5 * mm

    # Línea azul
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)

    c.line(
        summary_x,
        y,
        table_right,
        y,
    )

    y -= 6 * mm

    # Valor lote
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 8)

    c.drawString(
        summary_x,
        y,
        "Valor del lote",
    )

    c.drawRightString(
        table_right,
        y,
        format_soles(lot_price),
    )

    # Descuento
    if discount_amount > 0:

        y -= 5.5 * mm

        c.setFillColor(GREY)

        c.drawString(
            summary_x,
            y,
            "Beneficio comercial",
        )

        c.setFillColor(MUSTARD)

        c.drawRightString(
            table_right,
            y,
            f"- {format_soles(discount_amount)}",
        )

    # Línea destacada
    y -= 6 * mm

    c.setStrokeColor(MUSTARD)
    c.setLineWidth(0.8)

    c.line(
        summary_x,
        y,
        table_right,
        y,
    )

    y -= 7 * mm

    # Total
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)

    c.drawString(
        summary_x,
        y,
        "PRECIO TOTAL",
    )

    c.setFillColor(MUSTARD)
    c.setFont("Helvetica-Bold", 11)

    c.drawRightString(
        table_right,
        y,
        format_soles(display_total),
    )

    # =========================================================================
    # OBSERVACIONES
    # =========================================================================

    if notes:

        y -= 13 * mm

        c.setFillColor(MUSTARD_LIGHT)

        c.roundRect(
            margin_left,
            y - 5.5 * mm,
            48 * mm,
            6 * mm,
            1.5 * mm,
            stroke=0,
            fill=1,
        )

        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 7.5)

        c.drawString(
            margin_left + 3 * mm,
            y - 3.7 * mm,
            "OBSERVACIONES",
        )

        y -= 9 * mm

        note_style = ParagraphStyle(
            "netland_notes",
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=TEXT,
        )

        note_para = Paragraph(
            notes.replace("\n", "<br/>"),
            note_style,
        )

        note_width = content_width - 8 * mm

        _, note_height = note_para.wrap(
            note_width,
            25 * mm,
        )

        note_box_height = max(
            note_height + 8 * mm,
            16 * mm,
        )

        c.setFillColor(WHITE)
        c.setStrokeColor(BORDER)

        c.roundRect(
            margin_left,
            y - note_box_height,
            content_width,
            note_box_height,
            2 * mm,
            stroke=1,
            fill=1,
        )

        # Barra mostaza
        c.setFillColor(MUSTARD)

        c.roundRect(
            margin_left,
            y - note_box_height,
            1.3 * mm,
            note_box_height,
            0.7 * mm,
            stroke=0,
            fill=1,
        )

        note_para.drawOn(
            c,
            margin_left + 5 * mm,
            y - note_height - 4 * mm,
        )

    # =========================================================================
    # PIE DE PÁGINA
    # =========================================================================

    # Pie compacto
    footer_y = 14 * mm

    c.setStrokeColor(BORDER)
    c.setLineWidth(0.4)



    # Pequeño detalle mostaza
    c.setStrokeColor(MUSTARD)
    c.setLineWidth(1)

    c.line(
        margin_left,
        footer_y + 6 * mm,
        margin_left + 173 * mm,
        footer_y + 6 * mm,
    )

    # Empresa
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 6.8)

    c.drawString(
        margin_left,
        footer_y,
        "NETLAND",
    )

    # Ubicación
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6.5)

    c.drawString(
        margin_left,
        footer_y - 3.5 * mm,
        "Cañete, Lima - Perú",
    )

    # Contacto derecha
    c.drawRightString(
        table_right,
        footer_y,
        "ventas@netland.pe",
    )

    c.drawRightString(
        table_right,
        footer_y - 3.5 * mm,
        f"WhatsApp: {phone}",
    )

    # Identificación
    c.setFont("Helvetica", 5.8)
    c.setFillColor(LIGHT_GREY)

    c.drawCentredString(
        width / 2,
        6 * mm,
        (
            f"Cotización N.º {quote_number} · "
            f"Generada el {generation_date} a las {generation_time}"
        ),
    )

    # =========================================================================
    # GUARDAR
    # =========================================================================

    c.save()

    return buffer.getvalue()