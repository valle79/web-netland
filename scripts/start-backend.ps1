# Script para iniciar el servidor backend de NETLAND
# Uso: .\scripts\start-backend.ps1

Write-Host "Iniciando servidor backend de NETLAND..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en la raiz del proyecto
if (-not (Test-Path "backend\app\main.py")) {
    Write-Host "Error: Debe ejecutar este script desde la raiz del proyecto" -ForegroundColor Red
    exit 1
}

# Agregar Tesseract al PATH de esta sesion
$tesseractPath = "C:\Program Files\Tesseract-OCR"
if (Test-Path $tesseractPath) {
    $env:Path = "$tesseractPath;$env:Path"
    Write-Host "OK: Tesseract agregado al PATH" -ForegroundColor Cyan
} else {
    Write-Host "ADVERTENCIA: Tesseract no encontrado en $tesseractPath" -ForegroundColor Yellow
    Write-Host "La funcionalidad de importacion de planos no funcionara" -ForegroundColor Yellow
}

# Agregar Poppler al PATH de esta sesion
$popplerPath = "C:\Users\luisv\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin"
if (Test-Path $popplerPath) {
    $env:Path = "$popplerPath;$env:Path"
    Write-Host "OK: Poppler agregado al PATH" -ForegroundColor Cyan
} else {
    Write-Host "ADVERTENCIA: Poppler no encontrado en $popplerPath" -ForegroundColor Yellow
    Write-Host "La funcionalidad de importacion de planos no funcionara" -ForegroundColor Yellow
}

# Activar entorno virtual
if (Test-Path "backend\.venv\Scripts\python.exe") {
    Write-Host "OK: Entorno virtual encontrado" -ForegroundColor Cyan
} else {
    Write-Host "Error: No se encontro el entorno virtual" -ForegroundColor Red
    Write-Host "Ejecute: python -m venv backend\.venv" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Servidor: http://localhost:8000" -ForegroundColor Green
Write-Host "Documentacion API: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Health check: http://localhost:8000/health" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor desde el directorio backend (importante!)
Set-Location backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
