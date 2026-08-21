"""
Plan Analyzer Service - Servicio principal de análisis de planos.
"""
import logging
import time
from pathlib import Path

from PIL import Image
from sqlalchemy.orm import Session

from app.core.config import settings
from app.infrastructure.plan_analyzer.image_processor import ImageProcessor
from app.infrastructure.plan_analyzer.lot_detector import LotDetector
from app.infrastructure.plan_analyzer.lot_validator import LotValidator
from app.infrastructure.plan_analyzer.ocr_service import OCRService
from app.infrastructure.plan_analyzer.pdf_renderer import PDFRenderer
from app.schemas.plan_import import AnalysisResult, DetectedLot

logger = logging.getLogger("netland.plan_analyzer")


class PlanAnalyzerService:
    """Servicio principal para analizar planos PDF y detectar lotes."""
    
    def __init__(
        self,
        db: Session,
        project_id: int,
        dpi: int | None = None,
        confidence_threshold: float | None = None
    ):
        self.db = db
        self.project_id = project_id
        self.dpi = dpi or settings.PLAN_OCR_DPI
        self.confidence_threshold = confidence_threshold or settings.PLAN_CONFIDENCE_THRESHOLD
        
        # Inicializar componentes
        self.pdf_renderer = PDFRenderer(dpi=self.dpi)
        self.image_processor = ImageProcessor()
        self.ocr_service = OCRService()
        self.lot_detector = LotDetector(confidence_threshold=self.confidence_threshold)
    
    def analyze_plan(
        self,
        pdf_path: str | Path,
        filename: str,
        file_url: str | None = None,
        use_tiles: bool = True
    ) -> AnalysisResult:
        """
        Analiza un plano PDF completo.
        
        Args:
            pdf_path: Ruta al archivo PDF
            filename: Nombre del archivo
            file_url: URL del archivo (opcional)
            use_tiles: Si dividir en tiles para mejor precisión
            
        Returns:
            AnalysisResult
        """
        logger.info(f"Iniciando análisis de plano: {filename}")
        start_time = time.time()
        
        result = AnalysisResult(
            project_id=self.project_id,
            filename=filename,
            file_url=file_url,
            dpi=self.dpi,
            ocr_language=self.ocr_service.language
        )
        
        try:
            # Paso 1: Renderizar PDF a imagen
            logger.info("Paso 1: Renderizando PDF...")
            step_start = time.time()
            image = self._render_pdf(pdf_path)
            result.total_detected = 1  # 1 página por ahora
            logger.info(f"Renderizado completado en {time.time() - step_start:.2f}s")
            
            # Paso 2: Procesar imagen (con o sin tiles)
            logger.info("Paso 2: Procesando imagen y ejecutando OCR...")
            step_start = time.time()
            
            if use_tiles and self._should_use_tiles(image):
                all_ocr_texts = self._process_with_tiles(image)
            else:
                all_ocr_texts = self._process_full_image(image)
            
            result.total_ocr_texts = len(all_ocr_texts)
            logger.info(f"OCR completado en {time.time() - step_start:.2f}s - {len(all_ocr_texts)} textos")
            
            # Paso 3: Detectar lotes
            logger.info("Paso 3: Detectando lotes...")
            step_start = time.time()
            detected_lots = self.lot_detector.detect_lots(all_ocr_texts)
            result.total_candidates = len(detected_lots)
            logger.info(f"Detección completada en {time.time() - step_start:.2f}s - {len(detected_lots)} candidatos")
            
            # Paso 4: Filtrar duplicados
            logger.info("Paso 4: Filtrando duplicados...")
            detected_lots = self.lot_detector.filter_duplicates(detected_lots)
            
            # Paso 5: Validar contra BD
            logger.info("Paso 5: Validando contra base de datos...")
            step_start = time.time()
            validator = LotValidator(self.db, self.project_id)
            validated_lots = validator.validate_lots(detected_lots)
            logger.info(f"Validación completada en {time.time() - step_start:.2f}s")
            
            # Paso 6: Preparar resultado
            result.lots = validated_lots
            
            # Estadísticas
            stats = validator.get_statistics(validated_lots)
            result.total_detected = stats["total_detected"]
            result.new_lots = stats["new_lots"]
            result.existing_lots = stats["existing_lots"]
            result.uncertain_lots = stats["uncertain_lots"]
            result.invalid_lots = stats["invalid_lots"]
            
            result.processing_time_seconds = time.time() - start_time
            
            logger.info(
                f"Análisis completado en {result.processing_time_seconds:.2f}s: "
                f"{result.new_lots} nuevos, {result.existing_lots} existentes, "
                f"{result.uncertain_lots} inciertos, {result.invalid_lots} inválidos"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error analizando plano: {str(e)}", exc_info=True)
            raise RuntimeError(f"Error al analizar plano: {str(e)}")
    
    def _render_pdf(self, pdf_path: str | Path) -> Image.Image:
        """Renderiza la primera página del PDF."""
        try:
            # Por ahora solo procesamos la primera página
            # En el futuro se puede extender para múltiples páginas
            image = self.pdf_renderer.render_page(pdf_path, page_number=1)
            logger.info(f"PDF renderizado: {image.size[0]}x{image.size[1]} px")
            return image
        except Exception as e:
            logger.error(f"Error renderizando PDF: {str(e)}")
            raise
    
    def _should_use_tiles(self, image: Image.Image) -> bool:
        """Determina si la imagen debe procesarse por tiles."""
        width, height = image.size
        total_pixels = width * height
        
        # Usar tiles si la imagen es muy grande (> 25 megapíxeles)
        threshold = 25_000_000
        should_tile = total_pixels > threshold
        
        logger.info(
            f"Imagen: {width}x{height} ({total_pixels:,} px) - "
            f"{'Usando tiles' if should_tile else 'Procesamiento completo'}"
        )
        
        return should_tile
    
    def _process_full_image(self, image: Image.Image) -> list:
        """Procesa la imagen completa."""
        # Estrategia múltiple: probar diferentes preprocesamientos
        strategies = ["standard", "aggressive"]
        best_results = []
        best_count = 0
        
        for strategy in strategies:
            logger.info(f"Intentando estrategia: {strategy}")
            processed = self.image_processor.preprocess_for_ocr(image, strategy=strategy)
            ocr_texts = self.ocr_service.extract_text_with_boxes(processed)
            
            # Filtrar textos numéricos
            filtered = self.ocr_service.filter_numeric_texts(
                ocr_texts,
                min_confidence=self.confidence_threshold * 0.8  # Un poco más permisivo
            )
            
            logger.info(f"Estrategia {strategy}: {len(filtered)} textos relevantes")
            
            if len(filtered) > best_count:
                best_count = len(filtered)
                best_results = filtered
        
        return best_results
    
    def _process_with_tiles(self, image: Image.Image) -> list:
        """Procesa la imagen dividida en tiles."""
        # Dividir en tiles
        tiles = self.image_processor.split_into_tiles(
            image,
            tile_size=(2500, 2500),
            overlap=300
        )
        
        all_ocr_texts = []
        
        for idx, (tile, (offset_x, offset_y)) in enumerate(tiles):
            logger.info(f"Procesando tile {idx + 1}/{len(tiles)}")
            
            # Preprocesar tile
            processed = self.image_processor.preprocess_for_ocr(tile, strategy="standard")
            
            # OCR
            ocr_texts = self.ocr_service.extract_text_with_boxes(processed)
            
            # Ajustar coordenadas por el offset
            for ocr_text in ocr_texts:
                ocr_text.x += offset_x
                ocr_text.y += offset_y
            
            # Filtrar
            filtered = self.ocr_service.filter_numeric_texts(
                ocr_texts,
                min_confidence=self.confidence_threshold * 0.8
            )
            
            all_ocr_texts.extend(filtered)
        
        # Eliminar duplicados en las zonas de solapamiento
        all_ocr_texts = self._remove_overlapping_duplicates(all_ocr_texts)
        
        logger.info(f"Total después de combinar tiles: {len(all_ocr_texts)} textos")
        return all_ocr_texts
    
    def _remove_overlapping_duplicates(self, ocr_texts: list) -> list:
        """Elimina textos duplicados en zonas de solapamiento."""
        # Ordenar por confianza descendente
        sorted_texts = sorted(ocr_texts, key=lambda t: t.confidence, reverse=True)
        
        unique_texts = []
        seen_positions = set()
        
        for text in sorted_texts:
            # Crear clave basada en posición aproximada y texto
            pos_key = (
                text.text.strip(),
                text.x // 50,  # Agrupar por regiones de 50px
                text.y // 50
            )
            
            if pos_key not in seen_positions:
                seen_positions.add(pos_key)
                unique_texts.append(text)
        
        logger.info(f"Duplicados removidos: {len(ocr_texts)} → {len(unique_texts)}")
        return unique_texts
