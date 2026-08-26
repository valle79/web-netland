"""
Rutas para importación de lotes desde Excel.
"""
import logging
import tempfile
from io import BytesIO
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from openpyxl import Workbook
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.domain.models import Block, Lot, Project, User
from app.schemas.excel_import import ExcelImportResult

router = APIRouter(prefix="/projects", tags=["excel-import"])
logger = logging.getLogger("netland.excel_import")


STATUS_MAP = {
    "disponible": "available",
    "reservado": "reserved",
    "vendido": "sold",
    "no disponible": "not_available",
    "no_disponible": "not_available",
    "available": "available",
    "reserved": "reserved",
    "sold": "sold",
    "not_available": "not_available",
    "separado": "reserved",
}

# Mapeo de nombres de columnas del Excel del usuario
COLUMN_MAPPING = {
    "MZ": "manzana",
    "N° DE LOTE": "numero_lote",
    "MzLt": "codigo",
    "AREA LOTE M2": "area_m2",
    "Precio US $": "precio_usd",
    "M2": "precio_m2",
    "ZONA": "zona",
    "PLUS POR": "plus_por",
    "UBICACIÓN": "ubicacion",
    "Precio normal US": "precio_normal_usd",
    "$": "precio_normal_usd_alt",
    "Precio Normal S/": "precio_normal_soles",
    "ESTADO": "estado",
}

TEMPLATE_HEADERS = [
    "MZ",
    "N° DE LOTE",
    "MzLt",
    "AREA LOTE M2",
    "Precio US $",
    "ESTADO",
]

TEMPLATE_EXAMPLE_ROWS = [
    ["A", 1, "A-01", 120.50, 415, "disponible"],
    ["A", 2, "A-02", 115.75, 415, "disponible"],
    ["B", 1, "B-01", 135.00, 407, "reservado"],
    ["B", 2, "B-02", 128.30, 405, "vendido"],
]


def build_lots_excel_template() -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Lotes"
    sheet.append(TEMPLATE_HEADERS)
    for row in TEMPLATE_EXAMPLE_ROWS:
        sheet.append(row)

    sheet.freeze_panes = "A2"
    for index, header in enumerate(TEMPLATE_HEADERS, start=1):
        sheet.column_dimensions[chr(64 + index)].width = max(16, len(header) + 4)

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


template_router = APIRouter(tags=["excel-import"])


@template_router.get("/templates/lots.xlsx")
def download_lots_excel_template():
    """Descarga una plantilla .xlsx real para importar lotes."""
    content = build_lots_excel_template()
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="plantilla-lotes.xlsx"',
            "Cache-Control": "no-store",
        },
    )


@router.post("/{project_id}/import-excel", response_model=ExcelImportResult, dependencies=[Depends(require_admin)])
async def import_lots_from_excel(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Importa lotes desde un archivo Excel.
    
    Formato esperado del Excel:
    - MZ: Código de la manzana (ej: A, B, 1)
    - N° DE LOTE: Número del lote
    - MzLt: Código completo del lote (ej: A-01, B-10)
    - AREA LOTE M2: Área en metros cuadrados
    - Precio US $ o M2: Precio del lote en USD
    - ESTADO: disponible, reservado, vendido, separado
    """
    # Verificar que el proyecto existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Verificar que sea un archivo Excel
    if not file.filename or not file.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="El archivo debe ser Excel (.xlsx, .xls) o CSV")
    
    # Guardar temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Leer Excel
        if tmp_path.endswith('.csv'):
            df = pd.read_csv(tmp_path)
        else:
            # Leer Excel sin asumir que la primera fila son headers
            df = pd.read_excel(tmp_path, header=None)
        
        # Buscar la fila de encabezados (primera fila no vacía que contenga texto)
        header_row = None
        for idx in range(min(10, len(df))):  # Buscar en las primeras 10 filas
            row = df.iloc[idx]
            # Contar cuántas celdas tienen contenido no vacío
            non_empty = row.notna().sum()
            if non_empty >= 3:  # Al menos 3 columnas con datos
                # Verificar si parece una fila de encabezados
                row_str = str(row.values).upper()
                if any(keyword in row_str for keyword in ['MZLT', 'MZ', 'LOTE', 'AREA', 'PRECIO', 'ESTADO']):
                    header_row = idx
                    break
        
        if header_row is not None:
            # Usar esa fila como encabezados
            df = pd.read_excel(tmp_path, header=header_row) if tmp_path.endswith(('.xlsx', '.xls')) else pd.read_csv(tmp_path, header=header_row)
        else:
            # Si no encontramos encabezados, intentar con la primera fila
            df = pd.read_excel(tmp_path) if tmp_path.endswith(('.xlsx', '.xls')) else pd.read_csv(tmp_path)
        
        logger.info(f"Excel cargado con {len(df)} filas")
        logger.info(f"Columnas detectadas: {list(df.columns)}")
        
        # Normalizar nombres de columnas (eliminar espacios extras y saltos de línea)
        df.columns = df.columns.str.strip().str.replace('\n', ' ').str.replace('\r', '')
        
        logger.info(f"Columnas normalizadas: {list(df.columns)}")
        
        # Buscar columnas clave (flexibilidad en los nombres)
        codigo_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if 'MZLT' in col_upper or ('MZ' in col_upper and 'LT' in col_upper):
                codigo_col = col
                logger.info(f"Columna código encontrada: {col}")
                break
        
        numero_lote_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if ('N' in col_upper or 'NRO' in col_upper or 'NUMERO' in col_upper) and 'LOTE' in col_upper:
                numero_lote_col = col
                logger.info(f"Columna número de lote encontrada: {col}")
                break
        
        manzana_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if col_upper == 'MZ' or col_upper == 'MANZANA':
                manzana_col = col
                logger.info(f"Columna manzana encontrada: {col}")
                break
        
        area_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if 'AREA' in col_upper and 'M2' in col_upper:
                area_col = col
                logger.info(f"Columna área encontrada: {col}")
                break
        
        precio_m2_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if ('PRECIO' in col_upper and 'US' in col_upper and '$' in col_upper) or col_upper == 'M2':
                precio_m2_col = col
                logger.info(f"Columna precio/m² encontrada: {col}")
                break
        
        zona_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if col_upper == 'ZONA':
                zona_col = col
                logger.info(f"Columna zona encontrada: {col}")
                break
        
        plus_ubicacion_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if 'PLUS' in col_upper and 'UBICACION' in col_upper:
                plus_ubicacion_col = col
                logger.info(f"Columna plus ubicación encontrada: {col}")
                break
        
        precio_normal_usd_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if 'PRECIO' in col_upper and 'NORMAL' in col_upper and 'US' in col_upper:
                precio_normal_usd_col = col
                logger.info(f"Columna precio normal USD encontrada: {col}")
                break
        
        precio_normal_soles_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if 'PRECIO' in col_upper and 'NORMAL' in col_upper and ('S/' in col_upper or 'SOLES' in col_upper):
                precio_normal_soles_col = col
                logger.info(f"Columna precio normal soles encontrada: {col}")
                break
        
        estado_col = None
        for col in df.columns:
            col_upper = str(col).upper().strip()
            if 'ESTADO' in col_upper:
                estado_col = col
                logger.info(f"Columna estado encontrada: {col}")
                break
        
        # Validar que al menos tengamos código
        if not codigo_col:
            # Si no encontramos MzLt, buscar cualquier columna con "LOTE" o que tenga códigos tipo A-01
            for col in df.columns:
                # Revisar las primeras filas para ver si contiene códigos
                sample_values = df[col].dropna().head(5).astype(str)
                if any('-' in str(val) or len(str(val).strip()) > 0 for val in sample_values):
                    codigo_col = col
                    logger.info(f"Columna código inferida: {col}")
                    break
        
        if not codigo_col:
            raise HTTPException(
                status_code=400,
                detail=f"No se encontró la columna con códigos de lotes. Columnas disponibles: {list(df.columns)}. Asegúrate de que tu Excel tenga los encabezados en la primera fila."
            )
        
        imported = 0
        errors = []
        warnings = []
        
        for idx, row in df.iterrows():
            try:
                # Limpiar datos
                codigo = str(row[codigo_col]).strip() if pd.notna(row[codigo_col]) else None
                if not codigo or codigo.lower() == 'nan':
                    warnings.append(f"Fila {idx + 2}: Código vacío, saltando")
                    continue
                
                # Obtener número de lote
                numero_lote = None
                if numero_lote_col and pd.notna(row[numero_lote_col]):
                    try:
                        numero_lote = int(float(str(row[numero_lote_col]).replace(',', '')))
                    except:
                        pass
                
                # Obtener o crear manzana
                block_id = None
                if manzana_col and pd.notna(row[manzana_col]):
                    block_code = str(row[manzana_col]).strip()
                    block = db.query(Block).filter(
                        Block.project_id == project_id,
                        Block.code == block_code
                    ).first()
                    
                    if not block:
                        # Crear manzana automáticamente
                        block = Block(
                            project_id=project_id,
                            code=block_code,
                            name=f"Manzana {block_code}",
                            sort_order=0
                        )
                        db.add(block)
                        db.flush()
                        logger.info(f"Manzana {block_code} creada automáticamente")
                    
                    block_id = block.id
                
                # Mapear estado
                estado_raw = 'disponible'
                if estado_col and pd.notna(row[estado_col]):
                    estado_raw = str(row[estado_col]).strip().lower()
                status = STATUS_MAP.get(estado_raw, 'available')
                
                # Obtener área
                area = None
                if area_col and pd.notna(row[area_col]):
                    try:
                        area = float(str(row[area_col]).replace(',', ''))
                    except:
                        pass
                
                # Obtener precio por m2
                precio_m2 = None
                if precio_m2_col and pd.notna(row[precio_m2_col]):
                    try:
                        precio_m2 = float(str(row[precio_m2_col]).replace(',', '').replace('$', '').strip())
                    except:
                        pass
                
                # Obtener zona
                zona = None
                if zona_col and pd.notna(row[zona_col]):
                    zona = str(row[zona_col]).strip()
                
                # Obtener plus por ubicación (descripción)
                plus_ubicacion = None
                if plus_ubicacion_col and pd.notna(row[plus_ubicacion_col]):
                    plus_ubicacion = str(row[plus_ubicacion_col]).strip()
                
                # Obtener monto del plus (de la columna siguiente al plus por ubicación)
                plus_ubicacion_monto = None
                if plus_ubicacion_col:
                    # Buscar la columna siguiente que tenga un número
                    cols_list = list(df.columns)
                    plus_idx = cols_list.index(plus_ubicacion_col)
                    if plus_idx + 1 < len(cols_list):
                        next_col = cols_list[plus_idx + 1]
                        if pd.notna(row[next_col]):
                            try:
                                plus_ubicacion_monto = float(str(row[next_col]).replace(',', '').replace('$', '').strip())
                            except:
                                pass
                
                # Obtener precio normal USD
                precio_normal_usd = None
                if precio_normal_usd_col and pd.notna(row[precio_normal_usd_col]):
                    try:
                        precio_normal_usd = float(str(row[precio_normal_usd_col]).replace(',', '').replace('$', '').strip())
                    except:
                        pass
                
                # Obtener precio normal en soles
                precio_normal_soles = None
                if precio_normal_soles_col and pd.notna(row[precio_normal_soles_col]):
                    try:
                        precio_normal_soles = float(str(row[precio_normal_soles_col]).replace(',', '').replace('S/', '').strip())
                    except:
                        pass
                
                # Calcular precio total del lote (precio_m2 * area)
                precio_total = None
                if precio_m2 and area:
                    precio_total = precio_m2 * area
                    # Si hay plus por ubicación, sumarlo
                    if plus_ubicacion_monto:
                        precio_total += plus_ubicacion_monto
                    logger.debug(f"Lote {codigo}: {area} m² × ${precio_m2}/m² + ${plus_ubicacion_monto or 0} = ${precio_total}")
                elif precio_m2:
                    # Si solo hay precio sin área, asumimos que ya es el precio total
                    precio_total = precio_m2
                    logger.warning(f"Lote {codigo}: Solo precio sin área, usando precio directo: ${precio_total}")
                
                # Verificar si el lote ya existe
                existing_lot = db.query(Lot).filter(
                    Lot.project_id == project_id,
                    Lot.code == codigo
                ).first()
                
                if existing_lot:
                    warnings.append(f"Fila {idx + 2}: Lote {codigo} ya existe, saltando")
                    continue
                
                # Crear lote con todos los campos
                lot = Lot(
                    project_id=project_id,
                    block_id=block_id,
                    code=codigo,
                    lot_number=numero_lote,
                    area_m2=area,
                    price=precio_total,  # Precio total calculado
                    status=status,
                    zone=zona,
                    location_bonus=plus_ubicacion,
                    location_bonus_amount=plus_ubicacion_monto,
                    normal_price_usd=precio_normal_usd,
                    normal_price_soles=precio_normal_soles,
                    promo_price=None,
                    notes=None,
                )
                
                db.add(lot)
                imported += 1
                
            except Exception as e:
                error_msg = f"Fila {idx + 2}: Error al procesar - {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        # Commit si hay lotes importados
        if imported > 0:
            db.commit()
            logger.info(f"Importados {imported} lotes para proyecto {project_id}")
        
        return ExcelImportResult(
            imported=imported,
            errors=errors,
            warnings=warnings
        )
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="El archivo Excel está vacío")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Error al leer el archivo Excel")
    except Exception as e:
        logger.error(f"Error al importar Excel: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")
    finally:
        # Limpiar archivo temporal
        Path(tmp_path).unlink(missing_ok=True)
