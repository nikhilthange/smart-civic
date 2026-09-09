Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "🏙️ SMART CIVIC AI VISION INFERENCE MICROSERVICE" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$candidates = @(
    "$scriptDir\..\..\.venv311\Scripts\python.exe",
    "$scriptDir\..\..\.venv\Scripts\python.exe",
    "$scriptDir\..\server\ai_service\venv\Scripts\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "python"
)

$pythonExe = $null
foreach ($c in $candidates) {
    if (Test-Path $c) {
        $pythonExe = $c
        break
    }
}

if (-not $pythonExe) {
    $pythonExe = "python"
}

Write-Host "Using Python: $pythonExe" -ForegroundColor Cyan
Write-Host "Starting AI Vision Server on http://localhost:8000 ..." -ForegroundColor Yellow
& $pythonExe inference_server.py

