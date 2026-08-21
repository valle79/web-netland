"""
Lot Detector - Detecta y agrupa lotes desde textos OCR.
"""
import logging
import re
from dataclasses import dataclass

from app.infrastructure.plan_analyzer.ocr_service import OCRText
from app.schemas.plan_import import BoundingBox, DetectedLot

logger = logging.getLogger("netland.plan_analyzer.lot_detector")


@dataclass
class BlockInfo:
    """Información de una manzana detectada."""
    code: str
    x: int
    y: int
    width: int
    height: int
    confidence: float


class LotDetector:
    """Detecta lotes y manzanas desde textos OCR."""
    
    # Palabras que NO deben considerarse como lotes
    EXCLUDED_KEYWORDS = {
        'calle', 'avenida', 'av.', 'av', 'jr.', 'jr', 'jiron',
        'parque', 'area', 'verde', 'aporte', 'equipamiento',
        'educacion', 'educación', 'salud', 'recreacion', 'recreación',
        'reservorio', 'colegio', 'terreno', 'total', 'proyecto',
        'residencial', 'comercial', 'empresarial', 'industrial',
        'leyenda', 'plano', 'ventas', 'cumple', 'pista', 'vereda',
        'berma', 'lotes', 'ubicacion', 'ubicación', 'norte', 'sur',
        'este', 'oeste', 'escala', 'fecha', 'dimension', 'dimensión',
    }
    
    def __init__(self, confidence_threshold: float = 0.6):
        self.confidence_threshold = confidence_threshold
    
    def detect_lots(
        self,
        ocr_texts: list[OCRText],
        offset_x: int = 0,
        offset_y: int = 0
    ) -> list[DetectedLot]:
        """
        Detecta lotes desde textos OCR.
        
        Args:
            ocr_texts: Lista de textos OCR
            offset_x: Offset X si es un tile
            offset_y: Offset Y si es un tile
            
        Returns:
            Lista de DetectedLot
        """
        logger.info(f"Detectando lotes desde {len(ocr_texts)} textos OCR")
        
        # Paso 1: Detectar manzanas
        blocks = self._detect_blocks(ocr_texts)
        logger.info(f"Detectadas {len(blocks)} manzanas")
        
        # Paso 2: Detectar números de lote
        lot_candidates = self._detect_lot_numbers(ocr_texts)
        logger.info(f"Detectados {len(lot_candidates)} candidatos a lotes")
        
        # Paso 3: Detectar áreas
        areas = self._detect_areas(ocr_texts)
        logger.info(f"Detectadas {len(areas)} áreas")
        
        # Paso 4: Asociar lotes con manzanas y áreas
        detected_lots = self._associate_lots_with_blocks(
            lot_candidates,
            blocks,
            areas,
            offset_x,
            offset_y
        )
        
        logger.info(f"Total de {len(detected_lots)} lotes detectados")
        return detected_lots
    
    def _detect_blocks(self, ocr_texts: list[OCRText]) -> list[BlockInfo]:
        """Detecta manzanas en el plano."""
        blocks = []
        
        # Patrones para manzanas
        patterns = [
            r'\b(?:MZ\.?|MANZANA|Mz\.?)\s*([A-Z])\b',
            r'\b([A-Z])\s*(?:MZ\.?|MANZANA|Mz\.?)\b',
            r'^([A-Z])$',  # Letra sola
        ]
        
        for ocr_text in ocr_texts:
            text = ocr_text.text.upper().strip()
            
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    block_code = match.group(1).upper()
                    
                    # Validar que sea una letra simple
                    if len(block_code) == 1 and block_code.isalpha():
                        blocks.append(BlockInfo(
                            code=block_code,
                            x=ocr_text.x,
                            y=ocr_text.y,
                            width=ocr_text.width,
                            height=ocr_text.height,
                            confidence=ocr_text.confidence
                        ))
                        break
        
        return blocks
    
    def _detect_lot_numbers(self, ocr_texts: list[OCRText]) -> list[OCRText]:
        """Detecta números que podrían ser lotes."""
        candidates = []
        
        for ocr_text in ocr_texts:
            text = ocr_text.text.strip()
            
            # Filtrar por palabras excluidas
            text_lower = text.lower()
            if any(keyword in text_lower for keyword in self.EXCLUDED_KEYWORDS):
                continue
            
            # Filtrar textos muy largos (probablemente no son lotes)
            if len(text) > 20:
                continue
            
            # Buscar patrones de lote
            # Ejemplos: 01, 1, A01, L-01, LOTE 01
            patterns = [
                r'\b(\d{1,3})\b',  # Números simples: 01, 1, 15
                r'\b([A-Z]\d{1,3})\b',  # Con letra: A01
                r'\bL[OTE]*[\s\-]*(\d{1,3})\b',  # LOTE 01, L-01
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text.upper())
                if match:
                    # Validar que sea un número razonable
                    lot_num = match.group(1) if match.lastindex else match.group(0)
                    
                    # Extraer solo dígitos
                    digits = re.sub(r'\D', '', lot_num)
                    if digits and 1 <= int(digits) <= 999:
                        candidates.append(ocr_text)
                        break
        
        return candidates
    
    def _detect_areas(self, ocr_texts: list[OCRText]) -> dict[tuple[int, int], float]:
        """
        Detecta áreas en m².
        
        Returns:
            Dict de (center_x, center_y) -> area_m2
        """
        areas = {}
        
        # Patrón para áreas: 105.50, 105.00 m2, 105,50
        pattern = r'(\d{1,4}[.,]\d{1,2})\s*(?:m2|m²)?'
        
        for ocr_text in ocr_texts:
            text = ocr_text.text.strip()
            
            # Filtrar por contexto excluido
            text_lower = text.lower()
            if any(keyword in text_lower for keyword in self.EXCLUDED_KEYWORDS):
                continue
            
            match = re.search(pattern, text)
            if match:
                area_str = match.group(1).replace(',', '.')
                try:
                    area = float(area_str)
                    # Validar rango razonable para lotes residenciales
                    if 50.0 <= area <= 2000.0:
                        areas[(ocr_text.center_x, ocr_text.center_y)] = area
                except ValueError:
                    continue
        
        return areas
    
    def _associate_lots_with_blocks(
        self,
        lot_candidates: list[OCRText],
        blocks: list[BlockInfo],
        areas: dict[tuple[int, int], float],
        offset_x: int,
        offset_y: int
    ) -> list[DetectedLot]:
        """Asocia lotes con sus manzanas y áreas usando análisis espacial."""
        detected_lots = []
        
        for lot_ocr in lot_candidates:
            # Extraer número de lote
            lot_number = self._extract_lot_number(lot_ocr.text)
            if not lot_number:
                continue
            
            # Encontrar la manzana más cercana
            block_code = self._find_nearest_block(lot_ocr, blocks)
            
            # Encontrar el área más cercana
            area_m2 = self._find_nearest_area(lot_ocr, areas)
            
            # Crear DetectedLot
            detected_lot = DetectedLot(
                block=block_code,
                lot_number=lot_number,
                area_m2=area_m2,
                confidence=lot_ocr.confidence,
                status="NEW",
                bbox=BoundingBox(
                    x=lot_ocr.x + offset_x,
                    y=lot_ocr.y + offset_y,
                    width=lot_ocr.width,
                    height=lot_ocr.height
                ),
                raw_text=lot_ocr.text
            )
            
            # Validación
            if not block_code:
                detected_lot.validation_issues.append("No se pudo determinar la manzana")
                detected_lot.status = "UNCERTAIN"
            
            if lot_ocr.confidence < self.confidence_threshold:
                detected_lot.validation_issues.append(f"Confianza baja: {lot_ocr.confidence:.2f}")
                detected_lot.status = "UNCERTAIN"
            
            detected_lots.append(detected_lot)
        
        return detected_lots
    
    def _extract_lot_number(self, text: str) -> str | None:
        """Extrae el número de lote del texto."""
        # Normalizar
        text = text.upper().strip()
        
        # Patrones
        patterns = [
            r'\b(\d{1,3})\b',
            r'\bL[OTE]*[\s\-]*(\d{1,3})\b',
            r'\b([A-Z]\d{1,3})\b',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                lot_num = match.group(1)
                # Asegurar formato con ceros (01, 02, etc.)
                if lot_num.isdigit():
                    return lot_num.zfill(2)
                return lot_num
        
        return None
    
    def _find_nearest_block(
        self,
        lot_ocr: OCRText,
        blocks: list[BlockInfo],
        max_distance: int = 1500
    ) -> str | None:
        """
        Encuentra la manzana más cercana al lote.
        
        Args:
            lot_ocr: Texto OCR del lote
            blocks: Lista de manzanas detectadas
            max_distance: Distancia máxima en píxeles
            
        Returns:
            Código de manzana o None
        """
        if not blocks:
            return None
        
        lot_cx = lot_ocr.center_x
        lot_cy = lot_ocr.center_y
        
        nearest_block = None
        min_distance = float('inf')
        
        for block in blocks:
            block_cx = block.x + block.width // 2
            block_cy = block.y + block.height // 2
            
            # Distancia euclidiana
            distance = ((lot_cx - block_cx) ** 2 + (lot_cy - block_cy) ** 2) ** 0.5
            
            if distance < min_distance and distance <= max_distance:
                min_distance = distance
                nearest_block = block
        
        return nearest_block.code if nearest_block else None
    
    def _find_nearest_area(
        self,
        lot_ocr: OCRText,
        areas: dict[tuple[int, int], float],
        max_distance: int = 300
    ) -> float | None:
        """
        Encuentra el área más cercana al lote.
        
        Args:
            lot_ocr: Texto OCR del lote
            areas: Dict de coordenadas -> área
            max_distance: Distancia máxima en píxeles
            
        Returns:
            Área en m² o None
        """
        if not areas:
            return None
        
        lot_cx = lot_ocr.center_x
        lot_cy = lot_ocr.center_y
        
        nearest_area = None
        min_distance = float('inf')
        
        for (area_cx, area_cy), area_value in areas.items():
            distance = ((lot_cx - area_cx) ** 2 + (lot_cy - area_cy) ** 2) ** 0.5
            
            if distance < min_distance and distance <= max_distance:
                min_distance = distance
                nearest_area = area_value
        
        return nearest_area
    
    def filter_duplicates(self, detected_lots: list[DetectedLot]) -> list[DetectedLot]:
        """
        Filtra lotes duplicados.
        
        Args:
            detected_lots: Lista de lotes detectados
            
        Returns:
            Lista sin duplicados
        """
        seen = set()
        unique_lots = []
        
        for lot in detected_lots:
            key = (lot.block, lot.lot_number)
            if key not in seen:
                seen.add(key)
                unique_lots.append(lot)
            else:
                logger.debug(f"Lote duplicado filtrado: {lot.block}-{lot.lot_number}")
        
        logger.info(f"Filtrados {len(detected_lots) - len(unique_lots)} duplicados")
        return unique_lots
    
    def is_likely_legend_or_summary(self, ocr_text: OCRText, all_texts: list[OCRText]) -> bool:
        """
        Determina si un texto está en una leyenda o resumen general.
        
        Args:
            ocr_text: Texto a evaluar
            all_texts: Todos los textos OCR
            
        Returns:
            True si probablemente es parte de una leyenda
        """
        text = ocr_text.text.upper()
        
        # Palabras clave de leyenda
        legend_keywords = [
            'LEYENDA', 'TOTAL', 'RESUMEN', 'CUADRO', 'ESTADISTICA',
            'LOTES RESIDENCIALES', 'LOTES COMERCIALES', 'LOTES EMPRESARIALES'
        ]
        
        # Buscar en textos cercanos
        nearby_texts = [
            t.text.upper() for t in all_texts
            if abs(t.center_x - ocr_text.center_x) < 500
            and abs(t.center_y - ocr_text.center_y) < 200
        ]
        
        combined = ' '.join(nearby_texts)
        
        return any(keyword in combined for keyword in legend_keywords)
