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


def _safe(text: str) -> str:
    """Escapa texto para renderizarlo con reportlab Paragraph."""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


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
    company_ruc: str | None = None,
    company_razon_social: str | None = None,
    company_address: str | None = None,
    company_accounts: list[str] | None = None,
    price_per_m2: float | None = None,
    esquina_surcharge: float = 0,
    frente_parque_surcharge: float = 0,
    frente_a_pista_surcharge: float = 0,
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

    # Amarillo de resaltado
    HIGHLIGHT_YELLOW = colors.HexColor("#FFF176")

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
    phone = advisor_phone or ""

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
    logo_width = 30 * mm  # Aumentado de 22mm a 26mm
    logo_height = 30 * mm  # Aumentado de 22mm a 26mm

    logo_x = margin_left
    logo_y = y - 18 * mm  # Ajustado para el nuevo tamaño

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
    # INFORMACIÓN DE LA COTIZACIÓN (en card cuadrada, alineada con el logo)
    # -------------------------------------------------------------------------

    pad_x = 4 * mm  # Reducido para hacer la card más angosta
    pad_y = 4 * mm
    box_h = 13 * mm + 2 * pad_y
    max_w = max(
        c.stringWidth(t, f, s)
        for t, f, s in (
            ("COTIZACIÓN INMOBILIARIA", "Helvetica-Bold", 8.5),
            (f"N.º {quote_number}", "Helvetica-Bold", 9.2),
            (f"{generation_date} · {generation_time}", "Helvetica", 6.8),
        )
    )
    box_w = max_w + 2 * pad_x

    # Alinear con el logo (misma posición Y)
    card_y = y

    c.setFillColor(WHITE)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)

    c.roundRect(
        right_x - box_w,
        card_y - 13 * mm - pad_y,
        box_w,
        box_h,
        1.5 * mm,
        stroke=1,
        fill=1,
    )

    # Barra lateral azul noche
    c.setFillColor(NAVY)

    c.roundRect(
        right_x - box_w,
        card_y - 13 * mm - pad_y,
        1.2 * mm,
        box_h,
        0.6 * mm,
        stroke=0,
        fill=1,
    )

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8.5)

    c.drawRightString(
        right_x - pad_x,
        card_y,
        "COTIZACIÓN INMOBILIARIA",
    )

    c.setFillColor(MUSTARD)
    c.setFont("Helvetica-Bold", 9.2)

    c.drawRightString(
        right_x - pad_x,
        card_y - 4.8 * mm,
        f"N.º {quote_number}",
    )

    c.setFillColor(GREY)
    c.setFont("Helvetica", 6.8)

    c.drawRightString(
        right_x - pad_x,
        card_y - 9 * mm,
        f"{generation_date} · {generation_time}",
    )

    # -------------------------------------------------------------------------
    # INFORMACIÓN DE LA EMPRESA (centrada en el encabezado)
    # -------------------------------------------------------------------------

    center_x = width / 2

    # Título principal: NETLAND
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 16)

    c.drawCentredString(
        center_x,
        y,
        "NETLAND",
    )

    # Subtítulo: CORPORACIÓN INMOBILIARIA
    c.setFillColor(MUSTARD)
    c.setFont("Helvetica-Bold", 7.2)

    c.drawCentredString(
        center_x,
        y - 4.8 * mm,
        "CORPORACIÓN INMOBILIARIA",
    )

    # Ubicación + RUC
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6.8)

    location = "Cañete · Lima · Perú"
    if company_ruc:
        location += f"  ·  RUC {company_ruc}"

    c.drawCentredString(
        center_x,
        y - 9 * mm,
        location,
    )

    # -------------------------------------------------------------------------
    # DATOS ADICIONALES DE LA EMPRESA (centrados)
    # -------------------------------------------------------------------------

    current_y = y - 12 * mm

    # Dirección completa (dividida en 2 líneas)
    if company_address:
        c.setFillColor(GREY)
        c.setFont("Helvetica", 6.2)
        
        # Dividir la dirección en la posición del guion
        address_clean = company_address.replace("\n", " ")
        if " - " in address_clean:
            # Dividir por el guion
            parts = address_clean.split(" - ", 1)
            c.drawCentredString(center_x, current_y, parts[0].strip())
            current_y -= 3 * mm
            if len(parts) > 1:
                c.drawCentredString(center_x, current_y, parts[1].strip())
                current_y -= 3.5 * mm
        else:
            # Si no hay guion, mostrar en una línea
            c.drawCentredString(center_x, current_y, address_clean)
            current_y -= 3.5 * mm

    # Razón social
    if company_razon_social or company_name:
        c.setFillColor(GREY)
        c.setFont("Helvetica", 6.5)
        c.drawCentredString(
            center_x,
            current_y,
            company_razon_social or company_name,
        )
        current_y -= 3.5 * mm

    # Cuentas bancarias
    if company_accounts:
        c.setFillColor(GREY)
        c.setFont("Helvetica", 6.5)
        for account_line in company_accounts:
            c.drawCentredString(
                center_x,
                current_y,
                account_line,
            )
            current_y -= 3.5 * mm

    # Actualizar y para la siguiente sección
    y = current_y

    # -------------------------------------------------------------------------
    # DETALLE DECORATIVO DEL HEADER
    # -------------------------------------------------------------------------

    # Calcular la posición justo debajo del logo (super pegado)
    y = logo_y - 0.5 * mm  # Justo 0.5mm debajo del borde inferior del logo

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

    y -= 15 * mm  # Aumentado de 8mm a 15mm para más separación

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
    c.setFont("Helvetica-Bold", 8.6)

    c.drawString(
        margin_left + 3 * mm,
        y - 3.7 * mm,
        "DATOS DEL CLIENTE",
    )

    y -= 7 * mm

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
    c.setFont("Helvetica-Bold", 9.5)

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
    c.setFont("Helvetica", 9.2)

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
    c.setFont("Helvetica-Bold", 9.5)

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
    c.setFont("Helvetica", 9.2)

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
    c.setFont("Helvetica", 9)

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
    c.setFont("Helvetica", 9)

    c.drawString(
        width / 2 + 25 * mm,
        row_y,
        phone,
    )

    y -= card_height + 6 * mm

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
    c.setFont("Helvetica-Bold", 8.6)

    c.drawString(
        margin_left + 3 * mm,
        y - 3.7 * mm,
        "DETALLE DEL INMUEBLE",
    )

    y -= 7 * mm

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
    c.setFont("Helvetica-Bold", 9.5)

    c.drawString(
        table_x + 4 * mm,
        y - 7 * mm,
        f"Lote {lot_code}",
    )

    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.8)

    c.drawString(
        table_x + 4 * mm,
        y - 12 * mm,
        "Terreno dentro del proyecto inmobiliario",
    )

    c.setFont("Helvetica", 7.6)

    c.drawString(
        table_x + 4 * mm,
        y - 16 * mm,
        project_name,
    )

    # Área
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 9)

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

    c.setFont("Helvetica-Bold", 9)

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
        c.setFont("Helvetica", 8.2)

        c.drawString(
            table_x + 4 * mm,
            y - 5.5 * mm,
            discount_label,
        )

        c.setFillColor(MUSTARD)
        c.setFont("Helvetica-Bold", 9)

        c.drawRightString(
            table_right - 4 * mm,
            y - 5.5 * mm,
            f"- {format_soles(discount_amount)}",
        )

        y -= discount_height

    # =========================================================================
    # CONDICIONES DE PAGO
    # =========================================================================

    y -= 7 * mm

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
    c.setFont("Helvetica-Bold", 8.6)

    c.drawString(
        margin_left + 3 * mm,
        y - 3.7 * mm,
        "CONDICIONES DE PAGO",
    )

    y -= 7 * mm

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
    c.setFont("Helvetica-Bold", 9)

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
    c.setFont("Helvetica-Bold", 9.5)

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
        c.setFont("Helvetica", 9)

        c.drawString(
            margin_left + 29 * mm,
            row_y,
            format_soles(saldo),
        )

        # Cuotas
        c.setFillColor(GREY)
        c.setFont("Helvetica-Bold", 7.5)

        c.drawString(
            width / 2,
            row_y,
            "PLAN DE CUOTAS",
        )

        cuotas_text = (
            f"{installments} cuotas mensuales de "
            f"{format_soles(installment_value)}"
        )

        text_x = width / 2 + 31 * mm
        font_name = "Helvetica"
        font_size = 9.5

        cuotas_width = c.stringWidth(
            cuotas_text, font_name, font_size
        )

        # Resaltar toda la línea de cuotas en amarillo
        pad = 2.0
        highlight_y = row_y - 0.5 * mm
        highlight_height = font_size * 1.35 + 2.5

        c.saveState()
        c.setFillColor(HIGHLIGHT_YELLOW)

        c.roundRect(
            text_x - pad,
            highlight_y,
            cuotas_width + 2 * pad,
            highlight_height,
            1.0,
            stroke=0,
            fill=1,
        )

        c.restoreState()

        c.setFillColor(TEXT)
        c.setFont(font_name, font_size)

        c.drawString(
            text_x,
            row_y,
            cuotas_text,
        )

    y -= payment_height + 7 * mm

    # =========================================================================
    # RESUMEN ECONÓMICO
    # =========================================================================

    summary_width = 76 * mm
    summary_x = width - margin_right - summary_width

    c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 8)

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

    # Valor del lote (base: área × precio m²)
    base_price = lot_price - esquina_surcharge - frente_parque_surcharge - frente_a_pista_surcharge
    if price_per_m2 is not None and area_m2:
        valor_label = (
            f"Valor del lote ({area_m2:,.2f} m² × S/ {price_per_m2:,.2f})"
        )
    else:
        valor_label = "Valor del lote"

    c.setFillColor(TEXT)
    c.setFont("Helvetica", 9)

    c.drawString(
        summary_x,
        y,
        valor_label,
    )

    c.drawRightString(
        table_right,
        y,
        format_soles(base_price),
    )

    # Recargo lote en esquina
    if esquina_surcharge > 0:

        y -= 5.5 * mm

        c.setFillColor(GREY)

        c.drawString(
            summary_x,
            y,
            "Recargo lote en esquina",
        )

        c.setFillColor(TEXT)

        c.drawRightString(
            table_right,
            y,
            f"+ {format_soles(esquina_surcharge)}",
        )

    # Recargo frente a parque
    if frente_parque_surcharge > 0:

        y -= 5.5 * mm

        c.setFillColor(GREY)

        c.drawString(
            summary_x,
            y,
            "Recargo frente a parque",
        )

        c.setFillColor(TEXT)

        c.drawRightString(
            table_right,
            y,
            f"+ {format_soles(frente_parque_surcharge)}",
        )

    # Recargo frente a pista
    if frente_a_pista_surcharge > 0:

        y -= 5.5 * mm

        c.setFillColor(GREY)

        c.drawString(
            summary_x,
            y,
            "Recargo frente a pista",
        )

        c.setFillColor(TEXT)

        c.drawRightString(
            table_right,
            y,
            f"+ {format_soles(frente_a_pista_surcharge)}",
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
    c.setFont("Helvetica-Bold", 10)

    c.drawString(
        summary_x,
        y,
        "PRECIO TOTAL",
    )

    c.setFillColor(MUSTARD)
    c.setFont("Helvetica-Bold", 12)

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
        c.setFont("Helvetica-Bold", 8.6)

        c.drawString(
            margin_left + 3 * mm,
            y - 3.7 * mm,
            "OBSERVACIONES",
        )

        y -= 9 * mm

        note_style = ParagraphStyle(
            "netland_notes",
            fontName="Helvetica",
            fontSize=8.2,
            leading=10.5,
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