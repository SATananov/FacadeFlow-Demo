$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) { throw "Run SETUP.ps1 first." }

$pdf = Join-Path $root "input\catalogues\PVC Prelude_bg.pdf"
$manifest = Join-Path $root "data\verified\prelude60_profile_isolation.json"
$out = Join-Path $root "output\prelude60_profile_isolation"

if (-not (Test-Path $pdf)) { throw "Missing catalogue PDF: $pdf" }
if (-not (Test-Path $manifest)) { throw "Missing manifest: $manifest" }

$env:PYTHONPATH = $root
& $python -m facadeflow_training.prelude_profile_isolation --pdf $pdf --manifest $manifest --out $out
if ($LASTEXITCODE -ne 0) { throw "PRELUDE profile isolation failed." }

Write-Host ""
Write-Host "=== OPEN HUMAN REVIEW ===" -ForegroundColor Cyan
Write-Host (Join-Path $out "index.html")
