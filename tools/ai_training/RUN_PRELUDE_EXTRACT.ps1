$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) { throw "Run SETUP.ps1 first." }

$pdf = Join-Path $root "input\catalogues\PVC Prelude_bg.pdf"
$out = Join-Path $root "output\prelude60"

if (-not (Test-Path $pdf)) {
  throw "Place 'PVC Prelude_bg.pdf' in tools\ai_training\input\catalogues\ first."
}

$env:PYTHONPATH = $root
& $python -m facadeflow_training.prelude_extract --pdf $pdf --out $out
if ($LASTEXITCODE -ne 0) { throw "PRELUDE extraction failed." }
