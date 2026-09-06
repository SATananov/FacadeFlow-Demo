$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) { throw "Run SETUP.ps1 first." }

$lab041 = Join-Path $root "output\prelude60_dimensioned_catalogue_sections"
$out = Join-Path $root "output\prelude60_clear_dimension_review"
if (-not (Test-Path $lab041)) { throw "Run RUN_PRELUDE_DIMENSIONED_CATALOGUE_SECTIONS.ps1 first." }

$env:PYTHONPATH = $root
& $python -m facadeflow_training.prelude_clear_dimension_review --lab041-output $lab041 --out $out
if ($LASTEXITCODE -ne 0) { throw "Clear dimension review generation failed." }

Write-Host ""
Write-Host "=== OPEN CLEAR REVIEW ===" -ForegroundColor Cyan
Write-Host (Join-Path $out "index.html")
