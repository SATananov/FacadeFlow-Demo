$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) { throw "Run SETUP.ps1 first." }

$env:PYTHONPATH = $root
& $python -m facadeflow_training.validate
if ($LASTEXITCODE -ne 0) { throw "Training lab validation failed." }
