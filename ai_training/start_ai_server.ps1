Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "🏙️ SMART CIVIC AI VISION INFERENCE MICROSERVICE" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$pythonExe = Resolve-Path "$scriptDir\..\..\.venv311\Scripts\python.exe" -ErrorAction SilentlyContinue

if (-not $pythonExe -or -not (Test-Path $pythonExe)) {
    Write-Error "Python 3.11 environment not found at .venv311"
    exit 1
}

Write-Host "Starting AI Server on http://localhost:8000 ..." -ForegroundColor Yellow
& $pythonExe inference_server.py
