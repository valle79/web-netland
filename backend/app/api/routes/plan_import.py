"""
Plan Import API - Endpoints para importación de lotes desde planos PDF.
"""
import logging
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.domain.models import Project, ProjectDocument, User
from app.infrastructure.cloudinary_service import upload_file
from app.infrastructure.plan_analyzer import LotImporter, PlanAnalyzerService
from app.schemas.plan_import import AnalysisResult, LotImportRequest, LotImportResponse

logger = logging.getLogger("netland.api.plan_import")

router = APIRouter(
    prefix="/projects",
    tags=["plan-import"],
    dependencies=[Depends(require_admin)]
)


def get_project_or_404(db: Session, project_id: int) -> Project:
    """Obtiene un proyecto o lanza 404."""
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    return project


def validate_pdf_file(file: UploadFile) -> None:
    """
    Valida que el archivo sea un PDF válido.
    
    Raises:
        HTTPException si el archivo no es válido
    """
    # Validar extensión
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre de archivo no proporcionado"
        )
    
    extension = file.filename.lower().split('.')[-1]
    if extension != 'pdf':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos PDF"
        )
    
    # Validar MIME type
    content_type = file.content_type or ""
    if not content_type.startswith('application/pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser un PDF válido"
        )
    
    # Validar tamaño
    # Leer los primeros bytes para verificar
    file.file.seek(0, 2)  # Ir al final
    size = file.file.tell()
    file.file.seek(0)  # Volver al inicio
    
    max_size = settings.MAX_PLAN_PDF_SIZE_MB * 1024 * 1024
    if size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"El archivo excede el tamaño máximo de {settings.MAX_PLAN_PDF_SIZE_MB} MB"
        )
    
    # Validar que sea un PDF real (magic bytes)
    header = file.file.read(4)
    file.file.seek(0)
    
    if header != b'%PDF':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo no es un PDF válido"
        )


@router.post("/{project_id}/lots/plan/analyze", response_model=AnalysisResult)
async def analyze_plan(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analiza un plano PDF y detecta lotes automáticamente.
    
    Este endpoint:
    1. Valida el archivo PDF
    2. Sube el PDF a Cloudinary (si está configurado)
    3. Renderiza el PDF a imagen de alta resolución
    4. Ejecuta OCR para extraer textos
    5. Detecta manzanas y lotes usando análisis espacial
    6. Valida contra la base de datos
    7. Retorna los lotes detectados para revisión del administrador
    
    **NO inserta los lotes automáticamente**. El administrador debe:
    - Revisar los lotes detectados
    - Corregir datos si es necesario
    - Confirmar la importación usando el endpoint `/import`
    """
    logger.info(f"Usuario {current_user.id} analizando plano para proyecto {project_id}")
    
    # Validar proyecto
    project = get_project_or_404(db, project_id)
    
    # Validar archivo
    validate_pdf_file(file)
    
    # Guardar temporalmente
    temp_path = None
    file_url = None
    
    try:
        # Crear archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_path = tmp.name
        
        logger.info(f"PDF guardado temporalmente en: {temp_path}")
        
        # Subir a Cloudinary (opcional, para guardar el PDF)
        try:
            if settings.is_cloudinary_configured:
                logger.info("Subiendo PDF a Cloudinary...")
                result = upload_file(
                    temp_path,
                    folder=f"{settings.CLOUDINARY_FOLDER}/plans",
                    resource_type="raw"
                )
                file_url = result["url"]
                
                # Guardar referencia en project_documents
                doc = ProjectDocument(
                    project_id=project_id,
                    name=file.filename or "Plano",
                    category="plan",
                    url=file_url,
                    public_id=result.get("public_id", ""),
                    description="Plano importado para análisis de lotes",
                    is_published=False
                )
                db.add(doc)
                db.commit()
                logger.info(f"PDF guardado en Cloudinary: {file_url}")
        except Exception as e:
            logger.warning(f"No se pudo subir a Cloudinary: {str(e)}")
        
        # Analizar el plano
        logger.info("Iniciando análisis del plano...")
        analyzer = PlanAnalyzerService(
            db=db,
            project_id=project_id,
            dpi=settings.PLAN_OCR_DPI,
            confidence_threshold=settings.PLAN_CONFIDENCE_THRESHOLD
        )
        
        result = analyzer.analyze_plan(
            pdf_path=temp_path,
            filename=file.filename or "plan.pdf",
            file_url=file_url,
            use_tiles=True
        )
        
        logger.info(
            f"Análisis completado: {result.total_detected} lotes detectados, "
            f"{result.new_lots} nuevos, {result.existing_lots} existentes"
        )
        
        return result
        
    except RuntimeError as e:
        logger.error(f"Error durante análisis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar el plano: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error inesperado al procesar el plano"
        )
    finally:
        # Limpiar archivo temporal
        if temp_path and Path(temp_path).exists():
            try:
                Path(temp_path).unlink()
                logger.info("Archivo temporal eliminado")
            except Exception as e:
                logger.warning(f"No se pudo eliminar archivo temporal: {str(e)}")


@router.post("/{project_id}/lots/plan/import", response_model=LotImportResponse)
def import_lots(
    project_id: int,
    payload: LotImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Confirma e importa los lotes a la base de datos.
    
    Este endpoint:
    1. Valida que el proyecto coincida
    2. Crea manzanas nuevas si no existen
    3. Inserta los lotes en una transacción
    4. Previene duplicados
    5. Registra auditoría
    
    Si ocurre algún error, se hace ROLLBACK completo.
    No se permiten importaciones parciales.
    """
    logger.info(
        f"Usuario {current_user.id} importando {len(payload.lots)} lotes "
        f"para proyecto {project_id}"
    )
    
    # Validar proyecto
    project = get_project_or_404(db, project_id)
    
    # Validar que el proyecto coincida
    if payload.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ID del proyecto no coincide"
        )
    
    # Validar que haya lotes
    if not payload.lots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionaron lotes para importar"
        )
    
    try:
        # Importar
        importer = LotImporter(
            db=db,
            project_id=project_id,
            user_id=current_user.id
        )
        
        result = importer.import_lots(payload.lots)
        
        logger.info(
            f"Importación completada: {result.total_imported} importados, "
            f"{result.total_skipped} omitidos, {result.total_errors} errores"
        )
        
        if result.total_errors > 0:
            logger.warning(f"Se encontraron {result.total_errors} errores durante la importación")
        
        return result
        
    except RuntimeError as e:
        logger.error(f"Error durante importación: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error inesperado en importación: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error inesperado al importar lotes"
        )


@router.get("/{project_id}/lots/plan/documents")
def list_plan_documents(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Lista los planos PDF subidos para un proyecto.
    
    Returns:
        Lista de documentos de tipo "plan"
    """
    project = get_project_or_404(db, project_id)
    
    docs = db.query(ProjectDocument).filter(
        ProjectDocument.project_id == project_id,
        ProjectDocument.category == "plan"
    ).order_by(ProjectDocument.created_at.desc()).all()
    
    return [
        {
            "id": doc.id,
            "name": doc.name,
            "url": doc.url,
            "description": doc.description,
            "created_at": doc.created_at.isoformat() if doc.created_at else None
        }
        for doc in docs
    ]
