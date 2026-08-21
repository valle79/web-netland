# Configuración de Importación de Planos PDF

Este documento describe cómo configurar el sistema para poder importar lotes desde planos PDF.

## 📋 Requisitos Previos

### 1. Tesseract OCR

El sistema utiliza **Tesseract OCR** para extraer texto de los planos PDF. Debes instalarlo en tu sistema.

#### Windows

**Opción 1: Instalador oficial**
1. Descarga el instalador desde: https://github.com/UB-Mannheim/tesseract/wiki
2. Ejecuta el instalador (recomendado: `tesseract-ocr-w64-setup-5.3.x.exe`)
3. Durante la instalación, asegúrate de:
   - Instalar los idiomas: **Spanish** y **English**
   - Marcar "Add to PATH" (agregar al PATH del sistema)
4. Verifica la instalación:
   ```bash
   tesseract --version
   ```

**Opción 2: Con Chocolatey**
```bash
choco install tesseract
```

**Opción 3: Con Scoop**
```bash
scoop install tesseract
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng
```

#### macOS

```bash
brew install tesseract tesseract-lang
```

### 2. Poppler (para pdf2image)

**Windows:**
1. Descarga Poppler desde: https://github.com/oschwartz10612/poppler-windows/releases
2. Extrae el ZIP (por ejemplo, en `C:\Program Files\poppler`)
3. Agrega `C:\Program Files\poppler\Library\bin` al PATH del sistema
4. Verifica:
   ```bash
   pdftoppm -v
   ```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install poppler-utils
```

**macOS:**
```bash
brew install poppler
```

## 🔧 Instalación de Dependencias Python

1. Activa tu entorno virtual:
   ```bash
   # Windows
   .\venv\Scripts\activate
   
   # Linux/macOS
   source venv/bin/activate
   ```

2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

## ⚙️ Configuración

Agrega estas variables a tu archivo `.env`:

```env
# Plan Import Configuration
MAX_PLAN_PDF_SIZE_MB=30
PLAN_OCR_DPI=300
PLAN_OCR_LANG=spa+eng
PLAN_CONFIDENCE_THRESHOLD=0.60
```

### Descripción de Variables

- **MAX_PLAN_PDF_SIZE_MB**: Tamaño máximo permitido del PDF (en MB)
- **PLAN_OCR_DPI**: Resolución para renderizar el PDF (más DPI = mejor precisión, más lento)
  - Recomendado: 300 para planos normales, 400-600 para lotes muy pequeños
- **PLAN_OCR_LANG**: Idiomas de OCR (formato: `spa+eng` para español e inglés)
- **PLAN_CONFIDENCE_THRESHOLD**: Umbral de confianza mínimo (0.0-1.0)
  - 0.60 = 60% de confianza mínima para considerar válido un lote

## 🧪 Prueba de Configuración

Ejecuta este script Python para verificar que todo está instalado correctamente:

```python
# test_ocr_setup.py
import sys

def test_tesseract():
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        print(f"✓ Tesseract OCR instalado: versión {version}")
        return True
    except Exception as e:
        print(f"✗ Error con Tesseract: {e}")
        return False

def test_pdf2image():
    try:
        from pdf2image import convert_from_path
        print("✓ pdf2image configurado correctamente")
        return True
    except Exception as e:
        print(f"✗ Error con pdf2image: {e}")
        return False

def test_opencv():
    try:
        import cv2
        print(f"✓ OpenCV instalado: versión {cv2.__version__}")
        return True
    except Exception as e:
        print(f"✗ Error con OpenCV: {e}")
        return False

def test_pillow():
    try:
        from PIL import Image
        print("✓ Pillow instalado correctamente")
        return True
    except Exception as e:
        print(f"✗ Error con Pillow: {e}")
        return False

if __name__ == "__main__":
    print("Verificando configuración de Plan Import...\n")
    
    results = [
        test_tesseract(),
        test_pdf2image(),
        test_opencv(),
        test_pillow()
    ]
    
    print("\n" + "="*50)
    if all(results):
        print("✓ Todas las dependencias están correctamente instaladas")
        print("\nPuedes iniciar el servidor y usar la funcionalidad de importación de planos.")
        sys.exit(0)
    else:
        print("✗ Algunas dependencias faltan o tienen problemas")
        print("\nRevisa los errores anteriores y consulta PLAN_IMPORT_SETUP.md")
        sys.exit(1)
```

Ejecuta el test:
```bash
python test_ocr_setup.py
```

## 🚀 Uso de la Funcionalidad

### Desde el Panel de Administración

1. Accede al panel de administración
2. Ve a **Proyectos**
3. Selecciona un proyecto
4. Haz clic en el botón **📄 Importar**
5. Sube el PDF del plano
6. Haz clic en **🔍 Analizar Plano**
7. Espera el análisis (puede tomar 10-60 segundos dependiendo del tamaño)
8. Revisa los lotes detectados:
   - **Verde (Nuevo)**: Lotes que se importarán
   - **Gris (Existe)**: Lotes que ya están en la base de datos
   - **Amarillo (Revisar)**: Lotes con baja confianza o datos incompletos
   - **Rojo (Inválido)**: Lotes que no se pueden importar
9. Edita manualmente los lotes si es necesario (corrige manzana, número, área)
10. Selecciona los lotes a importar
11. Haz clic en **✓ Confirmar Importación**

### API Endpoints

#### Analizar Plano

```http
POST /api/projects/{project_id}/lots/plan/analyze
Content-Type: multipart/form-data

file: <archivo.pdf>
```

**Respuesta:**
```json
{
  "project_id": 1,
  "filename": "PLANO DE VENTA - URB. VILLA HUALCARA 2026.pdf",
  "file_url": "https://...",
  "total_detected": 120,
  "new_lots": 85,
  "existing_lots": 30,
  "uncertain_lots": 5,
  "invalid_lots": 0,
  "lots": [
    {
      "block": "A",
      "lot_number": "01",
      "area_m2": 105.50,
      "confidence": 0.98,
      "status": "NEW",
      "bbox": { "x": 1200, "y": 540, "width": 80, "height": 50 },
      "raw_text": "01",
      "notes": "",
      "validation_issues": []
    }
  ],
  "processing_time_seconds": 23.45
}
```

#### Importar Lotes

```http
POST /api/projects/{project_id}/lots/plan/import
Content-Type: application/json

{
  "project_id": 1,
  "lots": [
    {
      "block": "A",
      "lot_number": "01",
      "area_m2": 105.50,
      "notes": ""
    }
  ]
}
```

**Respuesta:**
```json
{
  "project_id": 1,
  "total_imported": 85,
  "total_skipped": 30,
  "total_errors": 0,
  "imported_lot_ids": [101, 102, 103, ...],
  "skipped_lots": [
    {
      "block": "A",
      "lot_number": "15",
      "reason": "El lote ya existe en la base de datos"
    }
  ],
  "errors": []
}
```

## 🔍 Solución de Problemas

### Error: "Tesseract no está instalado"

**Solución:**
1. Verifica que Tesseract esté en el PATH:
   ```bash
   tesseract --version
   ```
2. Si no funciona, reinicia la terminal/PowerShell
3. En Windows, verifica que la ruta esté en Variables de Entorno del Sistema

### Error: "Error al renderizar PDF"

**Solución:**
1. Verifica que Poppler esté instalado:
   ```bash
   pdftoppm -v
   ```
2. Verifica que el PDF no esté corrupto
3. Intenta abrir el PDF en un visor antes de subirlo

### Lotes no detectados correctamente

**Soluciones:**
1. Aumenta el DPI en `.env`: `PLAN_OCR_DPI=400`
2. Reduce el threshold: `PLAN_CONFIDENCE_THRESHOLD=0.50`
3. Asegúrate de que el plano tenga texto en formato gráfico (no solo imagen escaneada)
4. Si el plano tiene lotes muy pequeños, considera usar DPI 500-600

### El análisis es muy lento

**Soluciones:**
1. Reduce el DPI: `PLAN_OCR_DPI=200` (menos preciso pero más rápido)
2. Optimiza el PDF antes de subirlo (reduce resolución de imágenes internas)
3. Los planos grandes (>10 MB) tardarán más

### Muchos lotes marcados como "Revisar"

**Normal:** El OCR puede tener dificultades con:
- Lotes muy pequeños
- Números borrosos
- Planos con mucho texto adicional
- Planos escaneados de baja calidad

**Solución:** Edita manualmente los lotes inciertos antes de importar.

## 📊 Rendimiento Esperado

| Tamaño del Plano | Lotes | Tiempo Estimado | DPI Recomendado |
|------------------|-------|-----------------|-----------------|
| Pequeño (< 2 MB) | < 50  | 5-15 segundos   | 300            |
| Mediano (2-5 MB) | 50-150 | 15-30 segundos  | 300            |
| Grande (5-15 MB) | 150-400 | 30-60 segundos | 300            |
| Muy grande (> 15 MB) | > 400 | 60-120 segundos | 250-300     |

## 🛡️ Seguridad

- Solo administradores pueden acceder a esta funcionalidad
- Los PDFs se validan antes de procesar
- Se verifica extensión, MIME type y magic bytes
- Límite de tamaño configurable
- Los lotes NO se importan automáticamente (requiere revisión manual)
- Transacciones con ROLLBACK en caso de error

## 📝 Notas Importantes

1. **El sistema NO inserta automáticamente**: Siempre requiere confirmación del administrador
2. **Los duplicados se previenen**: No se pueden importar lotes que ya existen
3. **Las manzanas se crean automáticamente**: Si detecta "Manzana B" y no existe, la crea
4. **Los colores NO se interpretan**: El color del plano es solo visual, no afecta el estado
5. **Primera página solamente**: Actualmente solo procesa la primera página del PDF
6. **Idiomas soportados**: Español e Inglés por defecto

## 🤝 Soporte

Si encuentras problemas no listados aquí, revisa los logs del servidor:

```bash
# Los logs mostrarán información detallada del proceso
tail -f logs/netland.log
```

Para reportar un problema, incluye:
- Versión de Tesseract
- Sistema operativo
- Tamaño del PDF
- Mensaje de error completo del servidor
