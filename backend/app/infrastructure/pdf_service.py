import io
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
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
# GENERADOR DE COTIZACIÓN NETLAND
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
    Genera una cotización profesional para NETLAND
    CORPORACIÓN INMOBILIARIA.

    Diseño:
    - Formato A4.
    - Fondo blanco.
    - Bajo consumo de tinta.
    - Líneas finas.
    - Tipografía limpia.
    - Sin bloques de color.
    - Diseño corporativo y elegante.
    """

    buffer = io.BytesIO()

    c = canvas.Canvas(
        buffer,
        pagesize=A4,
    )

    width, height = A4

    # =========================================================================
    # COLORES
    # =========================================================================

    BLACK = colors.HexColor("#202020")
    DARK = colors.HexColor("#333333")
    GREY = colors.HexColor("#666666")
    LIGHT_GREY = colors.HexColor("#B8B8B8")
    VERY_LIGHT_GREY = colors.HexColor("#E5E5E5")

    # =========================================================================
    # MEDIDAS
    # =========================================================================

    margin_left = 20 * mm
    margin_right = 20 * mm

    content_width = width - margin_left - margin_right

    # =========================================================================
    # FECHA Y HORA
    # =========================================================================

    now = datetime.now()

    if date_str:
        generation_date = date_str
    else:
        generation_date = now.strftime("%d/%m/%Y")

    generation_time = now.strftime("%H:%M")

    # =========================================================================
    # PRECIO FINAL
    # =========================================================================

    final_price = (
        lot_price - discount_amount
        if discount_amount > 0
        else lot_price
    )

    # =========================================================================
    # IGV
    # =========================================================================

    # Se mantiene la misma lógica que utilizaba tu PDF actual.
    igv = final_price * 0.18

    # =========================================================================
    # HEADER
    # =========================================================================

    y = height - 18 * mm

    # -------------------------------------------------------------------------
    # Logo
    # -------------------------------------------------------------------------

    logo_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "static",
        "logo-netland.png",
    )

    logo_height = 14 * mm
    logo_width = logo_height

    if os.path.exists(logo_path):
        try:
            logo_img = ImageReader(logo_path)
            c.drawImage(
                logo_img,
                margin_left,
                y - logo_height + 4 * mm,
                width=logo_width,
                height=logo_height,
                mask="auto",
            )
        except Exception:
            pass

    logo_text_x = margin_left + (logo_width + 3 * mm if os.path.exists(logo_path) else 0)

    # -------------------------------------------------------------------------
    # Marca
    # -------------------------------------------------------------------------

    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 22)

    c.drawString(
        logo_text_x,
        y,
        "NETLAND",
    )

    c.setFont("Helvetica", 8.5)
    c.setFillColor(DARK)

    c.drawString(
        logo_text_x,
        y - 5 * mm,
        "CORPORACIÓN INMOBILIARIA",
    )

    # -------------------------------------------------------------------------
    # Información derecha
    # -------------------------------------------------------------------------

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BLACK)

    c.drawRightString(
        width - margin_right,
        y,
        "COTIZACIÓN",
    )

    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(
        width - margin_right,
        y - 5 * mm,
        f"N.º {quote_number}",
    )

    c.setFont("Helvetica", 7.5)
    c.setFillColor(GREY)

    c.drawRightString(
        width - margin_right,
        y - 9.5 * mm,
        f"{generation_date} · {generation_time}",
    )

    # -------------------------------------------------------------------------
    # Línea principal
    # -------------------------------------------------------------------------

    y -= 15 * mm

    c.setStrokeColor(BLACK)
    c.setLineWidth(0.7)

    c.line(
        margin_left,
        y,
        width - margin_right,
        y,
    )

    # =========================================================================
    # INFORMACIÓN DEL CLIENTE
    # =========================================================================

    y -= 9 * mm

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BLACK)

    c.drawString(
        margin_left,
        y,
        "DATOS DEL CLIENTE",
    )

    # Línea fina debajo del título

    c.setStrokeColor(VERY_LIGHT_GREY)
    c.setLineWidth(0.5)

    c.line(
        margin_left,
        y - 2.5 * mm,
        width - margin_right,
        y - 2.5 * mm,
    )

    y -= 9 * mm

    # -------------------------------------------------------------------------
    # Cliente
    # -------------------------------------------------------------------------

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(DARK)

    c.drawString(
        margin_left,
        y,
        "SEÑOR(ES):",
    )

    c.setFont("Helvetica", 8.5)
    c.setFillColor(DARK)

    c.drawString(
        margin_left + 25 * mm,
        y,
        client_name or "Por confirmar",
    )

    # -------------------------------------------------------------------------
    # Asesor
    # -------------------------------------------------------------------------

    c.setFont("Helvetica-Bold", 7.5)

    c.drawString(
        width / 2,
        y,
        "ASESOR:",
    )

    c.setFont("Helvetica", 8.5)

    c.drawString(
        width / 2 + 20 * mm,
        y,
        advisor_name or "Netland",
    )

    # -------------------------------------------------------------------------
    # Teléfono
    # -------------------------------------------------------------------------

    y -= 6 * mm

    if advisor_phone:

        c.setFont("Helvetica-Bold", 7.5)

        c.drawString(
            margin_left,
            y,
            "CONTACTO:",
        )

        c.setFont("Helvetica", 8.5)

        c.drawString(
            margin_left + 25 * mm,
            y,
            advisor_phone,
        )

    # -------------------------------------------------------------------------
    # Proyecto
    # -------------------------------------------------------------------------

    c.setFont("Helvetica-Bold", 7.5)

    c.drawString(
        width / 2,
        y,
        "PROYECTO:",
    )

    c.setFont("Helvetica", 8.5)

    c.drawString(
        width / 2 + 20 * mm,
        y,
        project_name,
    )

    # =========================================================================
    # DETALLE DEL LOTE
    # =========================================================================

    y -= 11 * mm

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BLACK)

    c.drawString(
        margin_left,
        y,
        "DETALLE DE LA INVERSIÓN",
    )

    c.setStrokeColor(VERY_LIGHT_GREY)

    c.line(
        margin_left,
        y - 2.5 * mm,
        width - margin_right,
        y - 2.5 * mm,
    )

    y -= 8 * mm

    # =========================================================================
    # CABECERA DE TABLA
    # =========================================================================

    table_x = margin_left
    table_right = width - margin_right

    description_width = content_width - 70 * mm
    unit_x = table_x + description_width + 35 * mm
    total_x = table_right

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(DARK)

    c.drawString(
        table_x,
        y,
        "DESCRIPCIÓN",
    )

    c.drawRightString(
        unit_x,
        y,
        "P. UNITARIO",
    )

    c.drawRightString(
        total_x,
        y,
        "TOTAL",
    )

    # Línea inferior

    y -= 3 * mm

    c.setStrokeColor(LIGHT_GREY)
    c.setLineWidth(0.5)

    c.line(
        table_x,
        y,
        table_right,
        y,
    )

    # =========================================================================
    # LOTE
    # =========================================================================

    y -= 7 * mm

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(BLACK)

    c.drawString(
        table_x,
        y,
        f"Lote {lot_code}",
    )

    y -= 4.5 * mm

    c.setFont("Helvetica", 7.8)
    c.setFillColor(GREY)

    c.drawString(
        table_x,
        y,
        f"Proyecto: {project_name}",
    )

    if area_m2:

        y -= 4 * mm

        c.drawString(
            table_x,
            y,
            f"Área: {area_m2:.2f} m²",
        )

    # Precio unitario

    c.setFont("Helvetica", 8.5)
    c.setFillColor(DARK)

    price_y = y + (
        4.5 * mm
        if area_m2
        else 0
    )

    c.drawRightString(
        unit_x,
        price_y,
        format_soles(lot_price),
    )

    c.drawRightString(
        total_x,
        price_y,
        format_soles(lot_price),
    )

    # Línea

    y -= 6 * mm

    c.setStrokeColor(VERY_LIGHT_GREY)

    c.line(
        table_x,
        y,
        table_right,
        y,
    )

    # =========================================================================
    # DESCUENTO
    # =========================================================================

    if discount_type != "none" and discount_amount > 0:

        y -= 7 * mm

        if discount_type == "percentage":
            discount_label = (
                f"Descuento aplicado ({discount_value}%)"
            )
        else:
            discount_label = "Descuento aplicado"

        c.setFont("Helvetica", 8)
        c.setFillColor(DARK)

        c.drawString(
            table_x,
            y,
            discount_label,
        )

        discount_text = f"-{format_soles(discount_amount)}"

        c.drawRightString(
            unit_x,
            y,
            discount_text,
        )

        c.drawRightString(
            total_x,
            y,
            discount_text,
        )

        y -= 5 * mm

        c.setStrokeColor(VERY_LIGHT_GREY)

        c.line(
            table_x,
            y,
            table_right,
            y,
        )

    # =========================================================================
    # MODALIDAD DE PAGO
    # =========================================================================

    y -= 8 * mm

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BLACK)

    c.drawString(
        table_x,
        y,
        "CONDICIONES DE PAGO",
    )

    y -= 7 * mm

    if payment_type == "credit":

        # Modalidad

        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(DARK)

        c.drawString(
            table_x,
            y,
            "MODALIDAD:",
        )

        c.setFont("Helvetica", 8.5)

        c.drawString(
            table_x + 25 * mm,
            y,
            "A crédito",
        )

        # Inicial

        c.setFont("Helvetica-Bold", 7.5)

        c.drawString(
            width / 2,
            y,
            "INICIAL:",
        )

        c.setFont("Helvetica", 8.5)

        c.drawString(
            width / 2 + 20 * mm,
            y,
            format_soles(initial_payment),
        )

        # Cuotas

        y -= 6 * mm

        c.setFont("Helvetica-Bold", 7.5)

        c.drawString(
            table_x,
            y,
            "SALDO:",
        )

        c.setFont("Helvetica", 8.5)

        c.drawString(
            table_x + 25 * mm,
            y,
            (
                f"{installments} cuota(s) "
                f"de {format_soles(installment_value)}"
            ),
        )

    else:

        c.setFont("Helvetica-Bold", 7.5)

        c.drawString(
            table_x,
            y,
            "MODALIDAD:",
        )

        c.setFont("Helvetica", 8.5)

        c.drawString(
            table_x + 25 * mm,
            y,
            "Al contado",
        )

    # =========================================================================
    # RESUMEN ECONÓMICO
    # =========================================================================

    y -= 13 * mm

    summary_x = width - margin_right - 75 * mm
    summary_width = 75 * mm

    c.setStrokeColor(LIGHT_GREY)
    c.setLineWidth(0.5)

    c.line(
        summary_x,
        y,
        width - margin_right,
        y,
    )

    y -= 6 * mm

    # Valor de venta

    c.setFont("Helvetica", 8)
    c.setFillColor(DARK)

    c.drawString(
        summary_x,
        y,
        "Valor de venta",
    )

    c.drawRightString(
        width - margin_right,
        y,
        format_soles(final_price),
    )

    y -= 5.5 * mm

    # IGV

    c.setFont("Helvetica", 8)

    c.drawString(
        summary_x,
        y,
        "IGV (18%)",
    )

    c.drawRightString(
        width - margin_right,
        y,
        format_soles(igv),
    )

    y -= 6 * mm

    # Línea antes del total

    c.setStrokeColor(BLACK)
    c.setLineWidth(0.7)

    c.line(
        summary_x,
        y,
        width - margin_right,
        y,
    )

    y -= 6 * mm

    # Total

    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(BLACK)

    c.drawString(
        summary_x,
        y,
        "PRECIO DE VENTA",
    )

    c.drawRightString(
        width - margin_right,
        y,
        format_soles(total_amount),
    )

    # =========================================================================
    # OBSERVACIONES
    # =========================================================================

    if notes:

        y -= 13 * mm

        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(BLACK)

        c.drawString(
            margin_left,
            y,
            "OBSERVACIONES",
        )

        c.setStrokeColor(VERY_LIGHT_GREY)

        c.line(
            margin_left,
            y - 2.5 * mm,
            width - margin_right,
            y - 2.5 * mm,
        )

        y -= 8 * mm

        note_style = ParagraphStyle(
            "netland_notes",
            fontName="Helvetica",
            fontSize=7.8,
            leading=10,
            textColor=DARK,
            alignment=TA_LEFT,
        )

        note_para = Paragraph(
            notes,
            note_style,
        )

        note_width = content_width

        _, note_height = note_para.wrap(
            note_width,
            30 * mm,
        )

        note_para.drawOn(
            c,
            margin_left,
            y - note_height,
        )

    # =========================================================================
    # MENSAJE COMERCIAL
    # =========================================================================

    footer_top = 43 * mm

    c.setStrokeColor(VERY_LIGHT_GREY)
    c.setLineWidth(0.5)

    c.line(
        margin_left,
        footer_top + 6 * mm,
        width - margin_right,
        footer_top + 6 * mm,
    )

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(DARK)

    c.drawCentredString(
        width / 2,
        footer_top,
        "Gracias por su preferencia.",
    )

    c.setFont("Helvetica", 7.5)
    c.setFillColor(GREY)

    c.drawCentredString(
        width / 2,
        footer_top - 4.5 * mm,
        "El lugar donde mereces vivir.",
    )

    # =========================================================================
    # INFORMACIÓN CORPORATIVA
    # =========================================================================

    footer_y = 25 * mm

    c.setStrokeColor(LIGHT_GREY)
    c.setLineWidth(0.4)

    c.line(
        margin_left,
        footer_y + 5 * mm,
        width - margin_right,
        footer_y + 5 * mm,
    )

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(DARK)

    c.drawCentredString(
        width / 2,
        footer_y,
        "NETLAND CORPORACIÓN INMOBILIARIA",
    )

    c.setFont("Helvetica", 7)
    c.setFillColor(GREY)

    c.drawCentredString(
        width / 2,
        footer_y - 4 * mm,
        "Cañete, Lima - Perú",
    )

    # -------------------------------------------------------------------------
    # Contacto
    # -------------------------------------------------------------------------

    contact_parts = []

    if advisor_phone:
        contact_parts.append(
            f"WhatsApp: {advisor_phone}"
        )
    else:
        contact_parts.append(
            "WhatsApp: 985 928 062"
        )

    contact_parts.append(
        "ventas@netland.pe"
    )

    c.drawCentredString(
        width / 2,
        footer_y - 8 * mm,
        " | ".join(contact_parts),
    )

    # =========================================================================
    # IDENTIFICACIÓN DE LA COTIZACIÓN
    # =========================================================================

    c.setFont("Helvetica", 6)
    c.setFillColor(GREY)

    c.drawCentredString(
        width / 2,
        11 * mm,
        (
            f"Cotización N.º {quote_number} · "
            f"Generada el {generation_date} a las {generation_time}"
        ),
    )

    # =========================================================================
    # GUARDAR PDF
    # =========================================================================

    c.save()

    return buffer.getvalue()