$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) { throw "Run SETUP.ps1 first." }

$manifest = Join-Path $root "data\verified\prelude60_measurement_semantics.json"
$lab03 = Join-Path $root "output\prelude60_profile_isolation"
$out = Join-Path $root "output\prelude60_measurement_semantics"

if (-not (Test-Path $manifest)) { throw "Missing measurement manifest: $manifest" }
if (-not (Test-Path $lab03)) { throw "Run RUN_PRELUDE_PROFILE_ISOLATION.ps1 first." }

$env:PYTHONPATH = $root
& $python -m facadeflow_training.prelude_measurement_semantics --manifest $manifest --lab03-output $lab03 --out $out
if ($LASTEXITCODE -ne 0) { throw "PRELUDE measurement semantics failed." }

Write-Host ""
Write-Host "=== OPEN HUMAN REVIEW ===" -ForegroundColor Cyan
Write-Host (Join-Path $out "index.html")
