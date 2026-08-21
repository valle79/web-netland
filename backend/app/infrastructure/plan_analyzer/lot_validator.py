"""
Lot Validator - Valida y normaliza lotes detectados.
"""
import logging

from sqlalchemy.orm import Session

from app.domain.models import Block, Lot
from app.schemas.plan_import import DetectedLot

logger = logging.getLogger("netland.plan_analyzer.lot_validator")


class LotValidator:
    """Valida lotes detectados contra la base de datos."""
    
    def __init__(self, db: Session, project_id: int):
        self.db = db
        self.project_id = project_id
        self._load_existing_data()
    
    def _load_existing_data(self):
        """Carga datos existentes del proyecto."""
        # Cargar manzanas existentes
        self.existing_blocks = {
            block.code: block.id
            for block in self.db.query(Block).filter(
                Block.project_id == self.project_id
            ).all()
        }
        
        # Cargar lotes existentes
        self.existing_lots = set()
        lots = self.db.query(Lot).filter(
            Lot.project_id == self.project_id
        ).all()
        
        for lot in lots:
            block_code = lot.block.code if lot.block else None
            key = (block_code, lot.code)
            self.existing_lots.add(key)
        
        logger.info(
            f"Cargados {len(self.existing_blocks)} manzanas y "
            f"{len(self.existing_lots)} lotes existentes"
        )
    
    def validate_lots(self, detected_lots: list[DetectedLot]) -> list[DetectedLot]:
        """
        Valida una lista de lotes detectados.
        
        Args:
            detected_lots: Lotes detectados
            
        Returns:
            Lista de lotes validados con status actualizado
        """
        validated = []
        
        for lot in detected_lots:
            validated_lot = self._validate_single_lot(lot)
            validated.append(validated_lot)
        
        # Estadísticas
        new_count = sum(1 for l in validated if l.status == "NEW")
        exists_count = sum(1 for l in validated if l.status == "EXISTS")
        uncertain_count = sum(1 for l in validated if l.status == "UNCERTAIN")
        invalid_count = sum(1 for l in validated if l.status == "INVALID")
        
        logger.info(
            f"Validación completa: {new_count} nuevos, {exists_count} existentes, "
            f"{uncertain_count} inciertos, {invalid_count} inválidos"
        )
        
        return validated
    
    def _validate_single_lot(self, lot: DetectedLot) -> DetectedLot:
        """Valida un lote individual."""
        # Si ya está marcado como inválido, no revalidar
        if lot.status == "INVALID":
            return lot
        
        # Validar que tenga número de lote
        if not lot.lot_number:
            lot.status = "INVALID"
            lot.validation_issues.append("Número de lote faltante")
            return lot
        
        # Normalizar número de lote
        lot.lot_number = self._normalize_lot_number(lot.lot_number)
        
        # Validar manzana
        if lot.block:
            lot.block = lot.block.upper().strip()
            if lot.block not in self.existing_blocks and len(lot.block) == 1:
                # Manzana nueva - esto es normal
                pass
        
        # Verificar si ya existe
        key = (lot.block, lot.lot_number)
        if key in self.existing_lots:
            lot.status = "EXISTS"
            lot.notes = "Este lote ya existe en la base de datos"
            return lot
        
        # Validar área
        if lot.area_m2 is not None:
            if not (50.0 <= lot.area_m2 <= 5000.0):
                lot.validation_issues.append(
                    f"Área fuera de rango razonable: {lot.area_m2} m²"
                )
                if lot.status == "NEW":
                    lot.status = "UNCERTAIN"
        
        # Validar confianza
        if lot.confidence < 0.60:
            if "Confianza baja" not in ' '.join(lot.validation_issues):
                lot.validation_issues.append(f"Confianza OCR: {lot.confidence:.0%}")
            if lot.status == "NEW":
                lot.status = "UNCERTAIN"
        
        # Si no tiene manzana y confianza baja, marcar como incierto
        if not lot.block and lot.confidence < 0.70:
            if lot.status == "NEW":
                lot.status = "UNCERTAIN"
            lot.validation_issues.append("Manzana no determinada")
        
        return lot
    
    def _normalize_lot_number(self, lot_number: str) -> str:
        """
        Normaliza el número de lote.
        
        Args:
            lot_number: Número original
            
        Returns:
            Número normalizado
        """
        # Remover espacios
        normalized = lot_number.strip()
        
        # Si es solo dígitos, asegurar formato con ceros
        if normalized.isdigit():
            return normalized.zfill(2)
        
        return normalized
    
    def get_statistics(self, detected_lots: list[DetectedLot]) -> dict:
        """
        Obtiene estadísticas de los lotes detectados.
        
        Args:
            detected_lots: Lista de lotes
            
        Returns:
            Dict con estadísticas
        """
        total = len(detected_lots)
        new = sum(1 for l in detected_lots if l.status == "NEW")
        exists = sum(1 for l in detected_lots if l.status == "EXISTS")
        uncertain = sum(1 for l in detected_lots if l.status == "UNCERTAIN")
        invalid = sum(1 for l in detected_lots if l.status == "INVALID")
        
        # Confianza promedio
        confidences = [l.confidence for l in detected_lots if l.confidence > 0]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Manzanas únicas
        unique_blocks = set(l.block for l in detected_lots if l.block)
        
        return {
            "total_detected": total,
            "new_lots": new,
            "existing_lots": exists,
            "uncertain_lots": uncertain,
            "invalid_lots": invalid,
            "avg_confidence": avg_confidence,
            "unique_blocks": len(unique_blocks),
            "blocks": sorted(unique_blocks)
        }
