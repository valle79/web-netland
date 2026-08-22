"""
Rutas para importación de lotes desde Excel.
"""
import logging
import tempfile
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.domain.models import Block, Lot, Project, User
from app.schemas.excel_import import ExcelImportResult

router = APIRouter(prefix="/projects", tags=["excel-import"], dependencies=[Depends(require_admin)])
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
}


@router.post("/{project_id}/import-excel", response_model=ExcelImportResult)
async def import_lots_from_excel(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Importa lotes desde un archivo Excel.
    
    Formato esperado del Excel:
    - codigo: Código del lote (ej: MZ A-01, L-105)
    - manzana: Código de la manzana (opcional, ej: A, B, 1)
    - area_m2: Área en metros cuadrados (opcional)
    - precio: Precio del lote (opcional)
    - estado: disponible, reservado, vendido, no_disponible
    """
    # Verificar que el proyecto existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Verificar que sea un archivo Excel
    if not file.filename or not file.filename.lower().endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser Excel (.xlsx o .xls)")
    
    # Guardar temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Leer Excel
        df = pd.read_excel(tmp_path)
        logger.info(f"Excel cargado con {len(df)} filas")
        
        # Validar columnas requeridas
        required_columns = ['codigo']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Columnas faltantes en el Excel: {', '.join(missing_columns)}"
            )
        
        imported = 0
        errors = []
        warnings = []
        
        for idx, row in df.iterrows():
            try:
                # Limpiar datos
                codigo = str(row['codigo']).strip()
                if not codigo or codigo.lower() == 'nan':
                    warnings.append(f"Fila {idx + 2}: Código vacío, saltando")
                    continue
                
                # Obtener o crear manzana
                block_id = None
                if 'manzana' in row and pd.notna(row['manzana']):
                    block_code = str(row['manzana']).strip()
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
                estado_raw = str(row.get('estado', 'disponible')).strip().lower()
                status = STATUS_MAP.get(estado_raw, 'available')
                
                # Verificar si el lote ya existe
                existing_lot = db.query(Lot).filter(
                    Lot.project_id == project_id,
                    Lot.code == codigo
                ).first()
                
                if existing_lot:
                    warnings.append(f"Fila {idx + 2}: Lote {codigo} ya existe, saltando")
                    continue
                
                # Crear lote
                lot = Lot(
                    project_id=project_id,
                    block_id=block_id,
                    code=codigo,
                    area_m2=float(row['area_m2']) if 'area_m2' in row and pd.notna(row['area_m2']) else None,
                    price=float(row['precio']) if 'precio' in row and pd.notna(row['precio']) else None,
                    status=status,
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
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")
    finally:
        # Limpiar archivo temporal
        Path(tmp_path).unlink(missing_ok=True)
