import logging

from app.core.config import settings

logger = logging.getLogger("netland.cloudinary")


def get_cloudinary():
    """Devuelve el módulo cloudinary configurado, o None si no hay credenciales."""
    if not settings.is_cloudinary_configured:
        logger.warning("Cloudinary no configurado. Se usa modo degradado.")
        return None
    import cloudinary
    import cloudinary.api
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    return cloudinary


def upload_file(local_path: str, public_id: str | None = None, folder: str | None = None, resource_type: str = "auto"):
    """Sube un archivo a Cloudinary y devuelve {url, public_id}."""
    cloudinary = get_cloudinary()
    if not cloudinary:
        raise RuntimeError("Cloudinary no está configurado.")

    folder = folder or settings.CLOUDINARY_FOLDER
    result = cloudinary.uploader.upload(
        local_path,
        public_id=public_id,
        folder=folder,
        resource_type=resource_type,
    )
    return {"url": result.get("secure_url") or result.get("url"), "public_id": result.get("public_id")}


def delete_file(public_id: str):
    """Elimina un archivo de Cloudinary por public_id."""
    cloudinary = get_cloudinary()
    if not cloudinary:
        raise RuntimeError("Cloudinary no está configurado.")
    cloudinary.uploader.destroy(public_id)