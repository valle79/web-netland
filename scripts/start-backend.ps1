# Script para iniciar el servidor backend de NETLAND
# Uso: .\scripts\start-backend.ps1

Write-Host "🚀 Iniciando servidor backend de NETLAND..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "backend\app\main.py")) {
    Write-Host "❌ Error: Debe ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Activar entorno virtual
if (Test-Path "backend\.venv\Scripts\Activate.ps1") {
    Write-Host "✓ Activando entorno virtual..." -ForegroundColor Cyan
    & backend\.venv\Scripts\Activate.ps1
} else {
    Write-Host "❌ Error: No se encontró el entorno virtual" -ForegroundColor Red
    Write-Host "   Ejecute primero: python -m venv backend\.venv" -ForegroundColor Yellow
    exit 1
}

# Verificar que Tesseract esté en PATH
$tesseractPath = "C:\Program Files\Tesseract-OCR"
if (Test-Path $tesseractPath) {
    $env:Path += ";$tesseractPath"
    Write-Host "✓ Tesseract agregado al PATH" -ForegroundColor Cyan
}

# Cambiar al directorio backend
Set-Location backend

Write-Host ""
Write-Host "📡 Servidor iniciando en: http://localhost:8000" -ForegroundColor Green
Write-Host "📚 Documentación API: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "🔍 Panel Admin: http://localhost:5173/admin" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
