# Instalación y arranque del backend (Windows PowerShell)
Write-Host "== NETLAND Backend =="

$python = "python"
if (-not (Test-Path ".venv")) {
    Write-Host "Creando entorno virtual..."
    & $python -m venv .venv
}

Write-Host "Activando entorno virtual..."
& ".venv\Scripts\Activate.ps1"

Write-Host "Instalando dependencias..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

Write-Host "Configurando variables de entorno..."
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

Write-Host ""
Write-Host "Siguiente paso: configurar el .env con la URL de Neon PostgreSQL."
Write-Host "Luego ejecutar: python -m app.seed"
Write-Host "Y arrancar con:  uvicorn app.main:app --reload"