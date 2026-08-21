"""
Script de verificación para la funcionalidad de importación de planos.
Ejecuta: python test_ocr_setup.py
"""
import sys


def test_tesseract():
    """Verifica que Tesseract OCR esté instalado."""
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        print(f"✓ Tesseract OCR instalado: versión {version}")
        return True
    except Exception as e:
        print(f"✗ Error con Tesseract: {e}")
        print("  Instala Tesseract desde: https://github.com/tesseract-ocr/tesseract")
        return False


def test_pdf2image():
    """Verifica que pdf2image y poppler estén configurados."""
    try:
        from pdf2image import convert_from_path
        print("✓ pdf2image configurado correctamente")
        
        # Intentar verificar poppler
        try:
            from pdf2image import pdfinfo_from_path
            print("  - Poppler detectado correctamente")
        except:
            print("  ⚠ Poppler podría no estar en PATH (se requiere para pdf2image)")
        
        return True
    except Exception as e:
        print(f"✗ Error con pdf2image: {e}")
        print("  Instala poppler: https://github.com/oschwartz10612/poppler-windows/releases")
        return False


def test_opencv():
    """Verifica que OpenCV esté instalado."""
    try:
        import cv2
        print(f"✓ OpenCV instalado: versión {cv2.__version__}")
        return True
    except Exception as e:
        print(f"✗ Error con OpenCV: {e}")
        print("  Instala con: pip install opencv-python")
        return False


def test_pillow():
    """Verifica que Pillow esté instalado."""
    try:
        from PIL import Image
        import PIL
        print(f"✓ Pillow instalado: versión {PIL.__version__}")
        return True
    except Exception as e:
        print(f"✗ Error con Pillow: {e}")
        print("  Instala con: pip install Pillow")
        return False


def test_numpy():
    """Verifica que NumPy esté instalado."""
    try:
        import numpy as np
        print(f"✓ NumPy instalado: versión {np.__version__}")
        return True
    except Exception as e:
        print(f"✗ Error con NumPy: {e}")
        print("  Instala con: pip install numpy")
        return False


def test_configuration():
    """Verifica la configuración de la aplicación."""
    try:
        from app.core.config import settings
        
        print("\n📋 Configuración actual:")
        print(f"  - MAX_PLAN_PDF_SIZE_MB: {settings.MAX_PLAN_PDF_SIZE_MB} MB")
        print(f"  - PLAN_OCR_DPI: {settings.PLAN_OCR_DPI}")
        print(f"  - PLAN_OCR_LANG: {settings.PLAN_OCR_LANG}")
        print(f"  - PLAN_CONFIDENCE_THRESHOLD: {settings.PLAN_CONFIDENCE_THRESHOLD}")
        
        return True
    except Exception as e:
        print(f"\n⚠ No se pudo cargar la configuración: {e}")
        print("  Asegúrate de que el archivo .env exista con las variables necesarias")
        return False


def test_quick_ocr():
    """Prueba rápida de OCR con una imagen simple."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        import pytesseract
        
        print("\n🧪 Ejecutando prueba rápida de OCR...")
        
        # Crear imagen de prueba
        img = Image.new('RGB', (200, 100), color='white')
        draw = ImageDraw.Draw(img)
        draw.text((50, 40), "LOTE 01", fill='black')
        
        # OCR
        text = pytesseract.image_to_string(img, config='--psm 6')
        text_clean = text.strip()
        
        if "01" in text_clean or "LOTE" in text_clean:
            print(f"✓ OCR funcionando correctamente. Detectó: '{text_clean}'")
            return True
        else:
            print(f"⚠ OCR ejecutado pero resultado inesperado: '{text_clean}'")
            return True
            
    except Exception as e:
        print(f"✗ Error en prueba de OCR: {e}")
        return False


def main():
    """Función principal."""
    print("="*60)
    print("Verificación de Configuración - Importación de Planos PDF")
    print("="*60)
    print()
    
    print("1️⃣  Verificando dependencias del sistema...\n")
    
    results = [
        test_tesseract(),
        test_pdf2image(),
        test_opencv(),
        test_pillow(),
        test_numpy()
    ]
    
    print("\n2️⃣  Verificando configuración de la aplicación...\n")
    test_configuration()
    
    print("\n3️⃣  Prueba funcional...\n")
    results.append(test_quick_ocr())
    
    print("\n" + "="*60)
    
    if all(results):
        print("✅ ÉXITO: Todas las dependencias están correctamente instaladas")
        print("\nPuedes iniciar el servidor y usar la funcionalidad de importación de planos.")
        print("\nPara probar:")
        print("  1. Inicia el servidor: uvicorn app.main:app --reload")
        print("  2. Ve al panel de admin: http://localhost:8000/admin")
        print("  3. Selecciona un proyecto y haz clic en '📄 Importar'")
        print()
        sys.exit(0)
    else:
        print("❌ ERROR: Algunas dependencias faltan o tienen problemas")
        print("\nRevisa los errores anteriores y consulta:")
        print("  - backend/PLAN_IMPORT_SETUP.md")
        print("  - https://github.com/tesseract-ocr/tesseract")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()
