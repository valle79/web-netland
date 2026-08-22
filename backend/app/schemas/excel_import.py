"""
Schemas para importación de lotes desde Excel.
"""
from pydantic import BaseModel, Field


class ExcelImportResult(BaseModel):
    """Resultado de importación desde Excel."""
    imported: int = Field(..., description="Número de lotes importados")
    errors: list[str] = Field(default_factory=list, description="Errores encontrados")
    warnings: list[str] = Field(default_factory=list, description="Advertencias")


class LotExcelRow(BaseModel):
    """Representa una fila de lote en el Excel."""
    codigo: str
    manzana: str | None = None
    area_m2: float | None = None
    precio: float | None = None
    estado: str = "disponible"
