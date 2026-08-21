"""
Image Processor - Preprocesamiento de imágenes para mejorar OCR.
"""
import logging

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger("netland.plan_analyzer.image_processor")


class ImageProcessor:
    """Procesa y prepara imágenes para OCR."""
    
    @staticmethod
    def pil_to_cv2(pil_image: Image.Image) -> np.ndarray:
        """Convierte PIL Image a formato OpenCV."""
        return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    
    @staticmethod
    def cv2_to_pil(cv2_image: np.ndarray) -> Image.Image:
        """Convierte imagen OpenCV a PIL Image."""
        return Image.fromarray(cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB))
    
    def preprocess_for_ocr(
        self,
        image: Image.Image,
        strategy: str = "standard"
    ) -> Image.Image:
        """
        Preprocesa una imagen para mejorar resultados de OCR.
        
        Args:
            image: PIL Image
            strategy: "standard", "aggressive", o "light"
            
        Returns:
            PIL Image preprocesada
        """
        logger.info(f"Preprocesando imagen con estrategia: {strategy}")
        
        # Convertir a OpenCV
        cv_image = self.pil_to_cv2(image)
        
        if strategy == "light":
            processed = self._preprocess_light(cv_image)
        elif strategy == "aggressive":
            processed = self._preprocess_aggressive(cv_image)
        else:
            processed = self._preprocess_standard(cv_image)
        
        # Convertir de vuelta a PIL
        return self.cv2_to_pil(processed)
    
    def _preprocess_standard(self, cv_image: np.ndarray) -> np.ndarray:
        """Preprocesamiento estándar."""
        # Convertir a escala de grises
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # Aumentar contraste con CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # Reducción de ruido
        denoised = cv2.fastNlMeansDenoising(enhanced, None, h=10, templateWindowSize=7, searchWindowSize=21)
        
        # Sharpening
        kernel = np.array([[-1, -1, -1],
                          [-1,  9, -1],
                          [-1, -1, -1]])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        # Threshold adaptativo
        binary = cv2.adaptiveThreshold(
            sharpened,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2
        )
        
        return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
    
    def _preprocess_light(self, cv_image: np.ndarray) -> np.ndarray:
        """Preprocesamiento ligero para imágenes de buena calidad."""
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # Solo mejora de contraste
        clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
    
    def _preprocess_aggressive(self, cv_image: np.ndarray) -> np.ndarray:
        """Preprocesamiento agresivo para imágenes de baja calidad."""
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # Escalado para mayor resolución
        scale_factor = 1.5
        width = int(gray.shape[1] * scale_factor)
        height = int(gray.shape[0] * scale_factor)
        scaled = cv2.resize(gray, (width, height), interpolation=cv2.INTER_CUBIC)
        
        # Mejora de contraste agresiva
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(scaled)
        
        # Reducción de ruido más agresiva
        denoised = cv2.fastNlMeansDenoising(enhanced, None, h=15, templateWindowSize=7, searchWindowSize=21)
        
        # Morphological operations para limpiar
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        morphed = cv2.morphologyEx(denoised, cv2.MORPH_CLOSE, kernel)
        
        # Sharpening fuerte
        kernel_sharp = np.array([[-1, -1, -1, -1, -1],
                                 [-1,  2,  2,  2, -1],
                                 [-1,  2,  8,  2, -1],
                                 [-1,  2,  2,  2, -1],
                                 [-1, -1, -1, -1, -1]]) / 8.0
        sharpened = cv2.filter2D(morphed, -1, kernel_sharp)
        
        # Otsu thresholding
        _, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
    
    def split_into_tiles(
        self,
        image: Image.Image,
        tile_size: tuple[int, int] = (2000, 2000),
        overlap: int = 200
    ) -> list[tuple[Image.Image, tuple[int, int]]]:
        """
        Divide una imagen grande en tiles para procesamiento por regiones.
        
        Args:
            image: PIL Image
            tile_size: Tamaño de cada tile (width, height)
            overlap: Píxeles de solapamiento entre tiles
            
        Returns:
            Lista de tuplas (tile_image, (offset_x, offset_y))
        """
        width, height = image.size
        tile_width, tile_height = tile_size
        
        tiles = []
        
        for y in range(0, height, tile_height - overlap):
            for x in range(0, width, tile_width - overlap):
                # Calcular coordenadas del tile
                x1 = x
                y1 = y
                x2 = min(x + tile_width, width)
                y2 = min(y + tile_height, height)
                
                # Extraer tile
                tile = image.crop((x1, y1, x2, y2))
                tiles.append((tile, (x1, y1)))
                
                # Si llegamos al borde derecho, parar
                if x2 >= width:
                    break
            
            # Si llegamos al borde inferior, parar
            if y2 >= height:
                break
        
        logger.info(f"Imagen dividida en {len(tiles)} tiles")
        return tiles
    
    def detect_regions_of_interest(self, image: Image.Image) -> list[tuple[int, int, int, int]]:
        """
        Detecta regiones con alta probabilidad de contener texto.
        
        Args:
            image: PIL Image
            
        Returns:
            Lista de bounding boxes (x, y, width, height)
        """
        cv_image = self.pil_to_cv2(image)
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # Detección de bordes
        edges = cv2.Canny(gray, 50, 150)
        
        # Dilatación para conectar componentes
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 20))
        dilated = cv2.dilate(edges, kernel, iterations=2)
        
        # Encontrar contornos
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            # Filtrar regiones muy pequeñas o muy grandes
            if 100 < w < image.width * 0.8 and 100 < h < image.height * 0.8:
                regions.append((x, y, w, h))
        
        logger.info(f"Detectadas {len(regions)} regiones de interés")
        return regions
