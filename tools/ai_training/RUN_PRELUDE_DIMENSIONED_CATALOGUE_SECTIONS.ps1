$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) { throw "Run SETUP.ps1 first." }

$lab02 = Join-Path $root "output\prelude60_verified_views"
$out = Join-Path $root "output\prelude60_dimensioned_catalogue_sections"

if (-not (Test-Path $lab02)) { throw "Run RUN_PRELUDE_VECTOR_VIEWS.ps1 first." }

$env:PYTHONPATH = $root
& $python -m facadeflow_training.prelude_dimensioned_catalogue_sections `
  --lab02-output $lab02 `
  --out $out

if ($LASTEXITCODE -ne 0) { throw "Dimensioned catalogue section generation failed." }

Write-Host ""
Write-Host "=== OPEN HUMAN REVIEW ===" -ForegroundColor Cyan
Write-Host (Join-Path $out "index.html")
