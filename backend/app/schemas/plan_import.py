"""
Schemas para la importación de lotes desde planos PDF.
"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class BoundingBox(BaseModel):
    """Coordenadas de la caja delimitadora del texto detectado."""
    x: int
    y: int
    width: int
    height: int


class DetectedLotStatus(str):
    """Estados posibles de un lote detectado."""
    NEW = "NEW"
    EXISTS = "EXISTS"
    UNCERTAIN = "UNCERTAIN"
    INVALID = "INVALID"


class DetectedLot(BaseModel):
    """Representa un lote detectado en el plano."""
    block: str | None = None
    lot_number: str | None = None
    area_m2: float | None = None
    confidence: float = 0.0
    status: str = DetectedLotStatus.NEW
    bbox: BoundingBox | None = None
    raw_text: str = ""
    notes: str = ""
    
    # Información de validación
    validation_issues: list[str] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


class AnalysisResult(BaseModel):
    """Resultado del análisis del plano PDF."""
    project_id: int
    filename: str
    file_url: str | None = None
    total_detected: int = 0
    new_lots: int = 0
    existing_lots: int = 0
    uncertain_lots: int = 0
    invalid_lots: int = 0
    lots: list[DetectedLot] = Field(default_factory=list)
    
    # Métricas de calidad
    total_ocr_texts: int = 0
    total_candidates: int = 0
    
    # Metadata
    processing_time_seconds: float = 0.0
    ocr_language: str = "spa+eng"
    dpi: int = 300
    
    model_config = ConfigDict(from_attributes=True)


class LotImportItem(BaseModel):
    """Item de lote para importar (después de correcciones del admin)."""
    block: str
    lot_number: str
    area_m2: float | None = None
    notes: str = ""


class LotImportRequest(BaseModel):
    """Request para confirmar la importación de lotes."""
    project_id: int
    lots: list[LotImportItem]


class LotImportResponse(BaseModel):
    """Response después de importar lotes."""
    project_id: int
    total_imported: int = 0
    total_skipped: int = 0
    total_errors: int = 0
    imported_lot_ids: list[int] = Field(default_factory=list)
    skipped_lots: list[dict[str, Any]] = Field(default_factory=list)
    errors: list[dict[str, Any]] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


class AnalysisMetrics(BaseModel):
    """Métricas del procesamiento."""
    total_pages: int = 0
    total_images_processed: int = 0
    total_tiles: int = 0
    avg_confidence: float = 0.0
    processing_stages: dict[str, float] = Field(default_factory=dict)
