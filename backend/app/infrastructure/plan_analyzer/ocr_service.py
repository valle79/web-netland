"""
OCR Service - Extracción de texto con Tesseract OCR.
"""
import logging
import re
from dataclasses import dataclass

import pytesseract
from PIL import Image

from app.core.config import settings

logger = logging.getLogger("netland.plan_analyzer.ocr_service")


@dataclass
class OCRText:
    """Representa un texto detectado por OCR."""
    text: str
    confidence: float
    x: int
    y: int
    width: int
    height: int
    
    @property
    def center_x(self) -> int:
        return self.x + self.width // 2
    
    @property
    def center_y(self) -> int:
        return self.y + self.height // 2


class OCRService:
    """Servicio de OCR usando Tesseract."""
    
    def __init__(self, language: str | None = None):
        self.language = language or settings.PLAN_OCR_LANG
        self._verify_tesseract()
    
    def _verify_tesseract(self):
        """Verifica que Tesseract esté instalado."""
        try:
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract OCR versión: {version}")
        except Exception as e:
            logger.error(f"Tesseract no está instalado o no está en PATH: {str(e)}")
            raise RuntimeError(
                "Tesseract OCR no está instalado. "
                "Instalar desde: https://github.com/tesseract-ocr/tesseract"
            )
    
    def extract_text_with_boxes(
        self,
        image: Image.Image,
        config: str = ""
    ) -> list[OCRText]:
        """
        Extrae texto con coordenadas de bounding boxes.
        
        Args:
            image: PIL Image
            config: Configuración adicional de Tesseract
            
        Returns:
            Lista de OCRText
        """
        try:
            # Configuración de Tesseract
            # --psm 6: Asume un solo bloque uniforme de texto
            # --oem 3: Usar motor LSTM + legacy
            default_config = f"--psm 6 --oem 3 -l {self.language}"
            full_config = f"{default_config} {config}".strip()
            
            logger.debug(f"Ejecutando OCR con config: {full_config}")
            
            # Obtener datos detallados
            data = pytesseract.image_to_data(
                image,
                config=full_config,
                output_type=pytesseract.Output.DICT
            )
            
            results = []
            n_boxes = len(data['text'])
            
            for i in range(n_boxes):
                text = data['text'][i].strip()
                conf = float(data['conf'][i])
                
                # Filtrar textos vacíos o con confianza muy baja
                if not text or conf < 0:
                    continue
                
                x = int(data['left'][i])
                y = int(data['top'][i])
                w = int(data['width'][i])
                h = int(data['height'][i])
                
                results.append(OCRText(
                    text=text,
                    confidence=conf / 100.0,  # Normalizar a 0-1
                    x=x,
                    y=y,
                    width=w,
                    height=h
                ))
            
            logger.info(f"OCR extrajo {len(results)} textos")
            return results
            
        except Exception as e:
            logger.error(f"Error en OCR: {str(e)}")
            raise RuntimeError(f"Error ejecutando OCR: {str(e)}")
    
    def extract_simple_text(self, image: Image.Image) -> str:
        """
        Extrae texto simple sin coordenadas.
        
        Args:
            image: PIL Image
            
        Returns:
            Texto extraído
        """
        try:
            config = f"--psm 6 -l {self.language}"
            text = pytesseract.image_to_string(image, config=config)
            return text.strip()
        except Exception as e:
            logger.error(f"Error en OCR simple: {str(e)}")
            return ""
    
    def filter_numeric_texts(
        self,
        ocr_texts: list[OCRText],
        min_confidence: float = 0.5
    ) -> list[OCRText]:
        """
        Filtra textos que contienen números (potenciales lotes).
        
        Args:
            ocr_texts: Lista de OCRText
            min_confidence: Confianza mínima
            
        Returns:
            Lista filtrada de OCRText
        """
        filtered = []
        
        for ocr_text in ocr_texts:
            # Verificar confianza mínima
            if ocr_text.confidence < min_confidence:
                continue
            
            # Buscar patrones numéricos
            # Ejemplos: 01, 105.50, A01, MZ A, LOTE 01
            has_numbers = bool(re.search(r'\d', ocr_text.text))
            
            if has_numbers:
                filtered.append(ocr_text)
        
        logger.info(f"Filtrados {len(filtered)} textos con números de {len(ocr_texts)} totales")
        return filtered
    
    def normalize_ocr_errors(self, text: str) -> str:
        """
        Normaliza errores comunes de OCR.
        
        Args:
            text: Texto original
            
        Returns:
            Texto normalizado
        """
        # Errores comunes de OCR
        replacements = {
            'O': '0',  # Letra O → número 0
            'I': '1',  # Letra I → número 1
            'l': '1',  # Letra l minúscula → número 1
            'S': '5',  # Letra S → número 5 (a veces)
            'Z': '2',  # Letra Z → número 2 (a veces)
            'B': '8',  # Letra B → número 8 (a veces)
        }
        
        # Aplicar reemplazos solo en contextos numéricos
        # Ejemplo: "O1" → "01", pero "LOTE" → "LOTE"
        normalized = text
        
        # Patrón para detectar secuencias alfanuméricas cortas
        # donde probablemente haya confusión
        pattern = r'\b([A-Z]?\d{0,2}[OIlSZB]\d{0,2}|[OIlSZB]\d{1,3})\b'
        
        def replace_in_match(match):
            part = match.group(0)
            for old, new in replacements.items():
                part = part.replace(old, new)
            return part
        
        normalized = re.sub(pattern, replace_in_match, normalized, flags=re.IGNORECASE)
        
        return normalized
