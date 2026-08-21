"""
PDF Renderer - Convierte páginas PDF a imágenes de alta resolución.
"""
import logging
from pathlib import Path

from pdf2image import convert_from_path
from PIL import Image

from app.core.config import settings

logger = logging.getLogger("netland.plan_analyzer.pdf_renderer")


class PDFRenderer:
    """Renderiza páginas PDF a imágenes de alta resolución."""
    
    def __init__(self, dpi: int | None = None):
        self.dpi = dpi or settings.PLAN_OCR_DPI
    
    def render_page(self, pdf_path: str | Path, page_number: int = 1) -> Image.Image:
        """
        Renderiza una página específica del PDF a imagen.
        
        Args:
            pdf_path: Ruta al archivo PDF
            page_number: Número de página (1-indexed)
            
        Returns:
            PIL Image
        """
        try:
            logger.info(f"Renderizando página {page_number} de {pdf_path} a {self.dpi} DPI")
            images = convert_from_path(
                pdf_path,
                dpi=self.dpi,
                first_page=page_number,
                last_page=page_number,
                fmt='png',
                thread_count=2,
            )
            
            if not images:
                raise ValueError(f"No se pudo renderizar la página {page_number}")
            
            image = images[0]
            logger.info(f"Imagen renderizada: {image.size[0]}x{image.size[1]} px")
            return image
            
        except Exception as e:
            logger.error(f"Error renderizando PDF: {str(e)}")
            raise RuntimeError(f"Error al renderizar PDF: {str(e)}")
    
    def render_all_pages(self, pdf_path: str | Path) -> list[Image.Image]:
        """
        Renderiza todas las páginas del PDF.
        
        Args:
            pdf_path: Ruta al archivo PDF
            
        Returns:
            Lista de PIL Images
        """
        try:
            logger.info(f"Renderizando todas las páginas de {pdf_path} a {self.dpi} DPI")
            images = convert_from_path(
                pdf_path,
                dpi=self.dpi,
                fmt='png',
                thread_count=2,
            )
            
            logger.info(f"Total de {len(images)} páginas renderizadas")
            return images
            
        except Exception as e:
            logger.error(f"Error renderizando PDF: {str(e)}")
            raise RuntimeError(f"Error al renderizar PDF: {str(e)}")
    
    def get_page_count(self, pdf_path: str | Path) -> int:
        """
        Obtiene el número de páginas del PDF sin renderizar.
        
        Args:
            pdf_path: Ruta al archivo PDF
            
        Returns:
            Número de páginas
        """
        try:
            from pdf2image import pdfinfo_from_path
            info = pdfinfo_from_path(pdf_path)
            return info.get("Pages", 0)
        except Exception as e:
            logger.warning(f"No se pudo obtener el conteo de páginas: {str(e)}")
            # Fallback: intentar renderizar
            try:
                images = self.render_all_pages(pdf_path)
                return len(images)
            except:
                return 0
