# Script para agregar Tesseract al PATH del sistema permanentemente
# Requiere ejecutarse como Administrador
# Uso: Ejecuta PowerShell como Administrador, luego: .\scripts\setup-tesseract-path.ps1

# Verificar si se esta ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Error: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para ejecutarlo:" -ForegroundColor Yellow
    Write-Host "1. Abre PowerShell como Administrador (clic derecho -> Ejecutar como administrador)" -ForegroundColor Gray
    Write-Host "2. Navega a la carpeta del proyecto" -ForegroundColor Gray
    Write-Host "3. Ejecuta: .\scripts\setup-tesseract-path.ps1" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

$tesseractPath = "C:\Program Files\Tesseract-OCR"

# Verificar que Tesseract esta instalado
if (-not (Test-Path $tesseractPath)) {
    Write-Host "Error: Tesseract no encontrado en: $tesseractPath" -ForegroundColor Red
    Write-Host "   Instala Tesseract primero con: winget install UB-Mannheim.TesseractOCR" -ForegroundColor Yellow
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

# Obtener el PATH actual del sistema
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Verificar si Tesseract ya esta en el PATH
if ($currentPath -like "*$tesseractPath*") {
    Write-Host "OK: Tesseract ya esta en el PATH del sistema" -ForegroundColor Green
} else {
    Write-Host "Agregando Tesseract al PATH del sistema..." -ForegroundColor Cyan
    
    # Agregar Tesseract al PATH
    $newPath = $currentPath + ";" + $tesseractPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    
    Write-Host "OK: Tesseract agregado al PATH del sistema correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANTE: Debes cerrar y volver a abrir todas las ventanas de PowerShell" -ForegroundColor Yellow
    Write-Host "y Visual Studio Code para que los cambios tengan efecto." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verificando instalacion..." -ForegroundColor Cyan

# Verificar version
$version = & "$tesseractPath\tesseract.exe" --version 2>&1 | Select-String "tesseract" | Select-Object -First 1
Write-Host "OK: Version: $version" -ForegroundColor Green

# Verificar idiomas
Write-Host "OK: Idiomas instalados:" -ForegroundColor Green
& "$tesseractPath\tesseract.exe" --list-langs 2>&1 | Select-Object -Skip 1

Write-Host ""
Write-Host "Configuracion completada exitosamente" -ForegroundColor Green
Write-Host ""
Read-Host "Presiona Enter para cerrar"
