import shutil
import tempfile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.dependencies import require_admin
from app.infrastructure.cloudinary_service import upload_file

router = APIRouter(prefix="/uploads", tags=["uploads"], dependencies=[Depends(require_admin)])

ALLOWED_TYPES = {
    "image": {"jpg", "jpeg", "png", "webp", "gif"},
    "video": {"mp4", "webm", "mov"},
    "pdf": {"pdf"},
}


@router.post("")
async def upload(
    file: UploadFile = File(...),
    folder: str = "media",
    resource_type: str = "auto",
):
    extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if extension not in ALLOWED_TYPES["image"] | ALLOWED_TYPES["video"] | ALLOWED_TYPES["pdf"]:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{extension}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = upload_file(tmp_path, folder=folder, resource_type=resource_type)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    finally:
        import os

        os.unlink(tmp_path)

    return {"url": result["url"], "public_id": result["public_id"], "filename": file.filename}