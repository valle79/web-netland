import os
import shutil
import tempfile
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.dependencies import require_admin
from app.infrastructure.cloudinary_service import upload_file

router = APIRouter(prefix="/uploads", tags=["uploads"], dependencies=[Depends(require_admin)])

ALLOWED_TYPES = {
    "image": {"jpg", "jpeg", "png", "webp", "gif", "svg"},
    "video": {"mp4", "webm", "mov", "avi"},
    "pdf": {"pdf"},
    "document": {"pdf", "doc", "docx", "xls", "xlsx"},
}


def get_resource_type_from_extension(extension: str) -> str:
    """Determina el resource_type de Cloudinary basado en la extensión."""
    if extension in ALLOWED_TYPES["image"]:
        return "image"
    elif extension in ALLOWED_TYPES["video"]:
        return "video"
    else:
        return "raw"


@router.post("")
async def upload(
    file: UploadFile = File(...),
    folder: str = Form(default="media"),
    resource_type: str = Form(default="auto"),
):
    """
    Endpoint para subir archivos (imágenes, videos, PDFs, documentos).
    Sube el archivo a Cloudinary y devuelve la URL pública.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="El archivo debe tener un nombre.")

    extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    
    # Validar extensión
    all_allowed = ALLOWED_TYPES["image"] | ALLOWED_TYPES["video"] | ALLOWED_TYPES["pdf"] | ALLOWED_TYPES["document"]
    if extension not in all_allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Extensiones permitidas: {', '.join(sorted(all_allowed))}"
        )

    # Determinar resource_type automáticamente si es "auto"
    if resource_type == "auto":
        resource_type = get_resource_type_from_extension(extension)

    # Guardar archivo temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{extension}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = upload_file(tmp_path, folder=folder, resource_type=resource_type)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    finally:
        os.unlink(tmp_path)

    return {
        "url": result["url"],
        "public_id": result["public_id"],
        "filename": file.filename,
        "resource_type": resource_type,
    }


@router.post("/multiple")
async def upload_multiple(
    files: list[UploadFile] = File(...),
    folder: str = Form(default="media"),
):
    """
    Endpoint para subir múltiples archivos a la vez.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No se recibieron archivos.")

    results = []
    errors = []

    for file in files:
        try:
            if not file.filename:
                errors.append({"filename": "unknown", "error": "El archivo no tiene nombre"})
                continue

            extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
            all_allowed = ALLOWED_TYPES["image"] | ALLOWED_TYPES["video"] | ALLOWED_TYPES["pdf"] | ALLOWED_TYPES["document"]
            
            if extension not in all_allowed:
                errors.append({
                    "filename": file.filename,
                    "error": f"Tipo de archivo no permitido: .{extension}"
                })
                continue

            resource_type = get_resource_type_from_extension(extension)

            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{extension}") as tmp:
                shutil.copyfileobj(file.file, tmp)
                tmp_path = tmp.name

            try:
                result = upload_file(tmp_path, folder=folder, resource_type=resource_type)
                results.append({
                    "url": result["url"],
                    "public_id": result["public_id"],
                    "filename": file.filename,
                    "resource_type": resource_type,
                })
            finally:
                os.unlink(tmp_path)

        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})

    return {
        "success": results,
        "errors": errors,
        "total": len(files),
        "uploaded": len(results),
        "failed": len(errors),
    }