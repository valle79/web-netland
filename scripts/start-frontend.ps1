# Script para iniciar el servidor frontend de NETLAND
# Uso: .\scripts\start-frontend.ps1

Write-Host "🚀 Iniciando servidor frontend de NETLAND..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "frontend\package.json")) {
    Write-Host "❌ Error: Debe ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Cambiar al directorio frontend
Set-Location frontend

# Verificar que node_modules exista
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules no encontrado. Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🌐 Servidor frontend iniciando en: http://localhost:5173" -ForegroundColor Green
Write-Host "🔐 Panel Admin: http://localhost:5173/admin" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
npm run dev
