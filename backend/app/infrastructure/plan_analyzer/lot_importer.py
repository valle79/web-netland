"""
Lot Importer - Importa lotes validados a la base de datos.
"""
import logging

from sqlalchemy.orm import Session

from app.domain.models import AuditLog, Block, Lot
from app.schemas.plan_import import LotImportItem, LotImportResponse

logger = logging.getLogger("netland.plan_analyzer.lot_importer")


class LotImporter:
    """Importa lotes a la base de datos de forma transaccional."""
    
    def __init__(self, db: Session, project_id: int, user_id: int | None = None):
        self.db = db
        self.project_id = project_id
        self.user_id = user_id
    
    def import_lots(self, lots: list[LotImportItem]) -> LotImportResponse:
        """
        Importa lotes a la base de datos.
        
        Args:
            lots: Lista de lotes a importar
            
        Returns:
            LotImportResponse con resultados
        """
        logger.info(f"Iniciando importación de {len(lots)} lotes para proyecto {self.project_id}")
        
        response = LotImportResponse(
            project_id=self.project_id,
            total_imported=0,
            total_skipped=0,
            total_errors=0,
            imported_lot_ids=[],
            skipped_lots=[],
            errors=[]
        )
        
        try:
            # Transacción
            for lot_item in lots:
                try:
                    result = self._import_single_lot(lot_item)
                    
                    if result["status"] == "imported":
                        response.total_imported += 1
                        response.imported_lot_ids.append(result["lot_id"])
                    elif result["status"] == "skipped":
                        response.total_skipped += 1
                        response.skipped_lots.append({
                            "block": lot_item.block,
                            "lot_number": lot_item.lot_number,
                            "reason": result["reason"]
                        })
                    elif result["status"] == "error":
                        response.total_errors += 1
                        response.errors.append({
                            "block": lot_item.block,
                            "lot_number": lot_item.lot_number,
                            "error": result["error"]
                        })
                
                except Exception as e:
                    logger.error(f"Error importando lote {lot_item.block}-{lot_item.lot_number}: {str(e)}")
                    response.total_errors += 1
                    response.errors.append({
                        "block": lot_item.block,
                        "lot_number": lot_item.lot_number,
                        "error": str(e)
                    })
            
            # Commit si todo salió bien
            self.db.commit()
            logger.info(
                f"Importación completada: {response.total_imported} importados, "
                f"{response.total_skipped} omitidos, {response.total_errors} errores"
            )
            
            # Registrar auditoría
            self._log_audit(response)
            
        except Exception as e:
            logger.error(f"Error en importación, realizando rollback: {str(e)}")
            self.db.rollback()
            raise RuntimeError(f"Error en importación de lotes: {str(e)}")
        
        return response
    
    def _import_single_lot(self, lot_item: LotImportItem) -> dict:
        """
        Importa un lote individual.
        
        Returns:
            Dict con status: "imported", "skipped", o "error"
        """
        # Obtener o crear manzana
        block_id = None
        if lot_item.block:
            block_id = self._get_or_create_block(lot_item.block)
        
        # Generar código del lote
        if lot_item.block:
            lot_code = f"{lot_item.block}-{lot_item.lot_number}"
        else:
            lot_code = lot_item.lot_number
        
        # Verificar si ya existe
        existing = self.db.query(Lot).filter(
            Lot.project_id == self.project_id,
            Lot.code == lot_code
        ).first()
        
        if existing:
            return {
                "status": "skipped",
                "reason": "El lote ya existe en la base de datos"
            }
        
        # Crear lote
        try:
            lot = Lot(
                project_id=self.project_id,
                block_id=block_id,
                code=lot_code,
                lot_number=int(lot_item.lot_number) if lot_item.lot_number.isdigit() else None,
                area_m2=lot_item.area_m2,
                status="available",
                notes=lot_item.notes or ""
            )
            
            self.db.add(lot)
            self.db.flush()  # Para obtener el ID
            
            logger.debug(f"Lote creado: {lot.code} (ID: {lot.id})")
            
            return {
                "status": "imported",
                "lot_id": lot.id
            }
        
        except Exception as e:
            logger.error(f"Error creando lote {lot_code}: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _get_or_create_block(self, block_code: str) -> int:
        """
        Obtiene o crea una manzana.
        
        Args:
            block_code: Código de la manzana
            
        Returns:
            ID de la manzana
        """
        block_code = block_code.upper().strip()
        
        # Buscar existente
        existing_block = self.db.query(Block).filter(
            Block.project_id == self.project_id,
            Block.code == block_code
        ).first()
        
        if existing_block:
            return existing_block.id
        
        # Crear nueva
        logger.info(f"Creando nueva manzana: {block_code}")
        new_block = Block(
            project_id=self.project_id,
            code=block_code,
            name=f"Manzana {block_code}",
            sort_order=ord(block_code) - ord('A')  # A=0, B=1, etc.
        )
        
        self.db.add(new_block)
        self.db.flush()
        
        return new_block.id
    
    def _log_audit(self, response: LotImportResponse):
        """Registra la importación en el log de auditoría."""
        if not self.user_id:
            return
        
        try:
            audit = AuditLog(
                user_id=self.user_id,
                action="import_lots_from_plan",
                entity="lot",
                entity_id=self.project_id,
                details=f"Importados {response.total_imported} lotes, "
                        f"omitidos {response.total_skipped}, "
                        f"errores {response.total_errors}"
            )
            self.db.add(audit)
            self.db.commit()
        except Exception as e:
            logger.warning(f"No se pudo registrar auditoría: {str(e)}")
