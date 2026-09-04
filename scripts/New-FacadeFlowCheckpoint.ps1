param(
  [ValidateSet("ShareableClean", "InternalAudit")]
  [string]$Mode = "ShareableClean",

  [string]$OutputDirectory = "$env:USERPROFILE\Desktop",

  [switch]$SkipVerify
)


function New-PortableZip {
  param(
    [Parameter(Mandatory = $true)][string]$SourceDirectory,
    [Parameter(Mandatory = $true)][string]$DestinationZip
  )

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  if (Test-Path $DestinationZip) {
    Remove-Item $DestinationZip -Force
  }

  $zipStream = [System.IO.File]::Open($DestinationZip, [System.IO.FileMode]::CreateNew)
  try {
    $archive = [System.IO.Compression.ZipArchive]::new(
      $zipStream,
      [System.IO.Compression.ZipArchiveMode]::Create,
      $false
    )
    try {
      Get-ChildItem -Path $SourceDirectory -Recurse -File | ForEach-Object {
        $relative = $_.FullName.Substring($SourceDirectory.Length).TrimStart([char[]]"\\/")
        $entryName = $relative.Replace("\", "/")
        $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        try {
          $fileStream = [System.IO.File]::OpenRead($_.FullName)
          try {
            $fileStream.CopyTo($entryStream)
          }
          finally {
            $fileStream.Dispose()
          }
        }
        finally {
          $entryStream.Dispose()
        }
      }
    }
    finally {
      $archive.Dispose()
    }
  }
  finally {
    $zipStream.Dispose()
  }
}

function Assert-PortableZip {
  param([Parameter(Mandatory = $true)][string]$ZipPath)

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
  try {
    $badEntries = @($archive.Entries | Where-Object { $_.FullName.Contains("\") })
    if ($badEntries.Count -gt 0) {
      throw "Portable ZIP guard failed: archive contains Windows path separators."
    }
    if (-not ($archive.Entries | Where-Object { $_.FullName -like "src/*" } | Select-Object -First 1)) {
      throw "Portable ZIP guard failed: src/ hierarchy was not preserved."
    }
  }
  finally {
    $archive.Dispose()
  }
}

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $RepoRoot

try {
  if (-not (Test-Path ".git")) {
    throw "Checkpoint packaging requires a Git working tree."
  }

  $status = @(git status --porcelain)
  if ($LASTEXITCODE -ne 0) {
    throw "git status failed."
  }
  if ($status.Count -gt 0) {
    throw "Working tree is not clean. Commit or discard changes before creating a checkpoint."
  }

  git diff --check
  if ($LASTEXITCODE -ne 0) {
    throw "git diff --check failed."
  }

  $verificationScript = if ($Mode -eq "InternalAudit") { "verify:internal" } else { "verify" }
  if (-not $SkipVerify) {
    npm run $verificationScript
    if ($LASTEXITCODE -ne 0) {
      throw "npm run $verificationScript failed. Checkpoint was not created."
    }
  }

  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $shortCommit = (git rev-parse --short HEAD).Trim()
  $fullCommit = (git rev-parse HEAD).Trim()
  $branch = (git branch --show-current).Trim()
  $sync = "not-checked"

  git rev-parse --verify origin/$branch *> $null
  if ($LASTEXITCODE -eq 0) {
    git fetch origin
    if ($LASTEXITCODE -ne 0) {
      throw "git fetch origin failed."
    }
    $sync = (git rev-list --left-right --count "origin/$branch...HEAD").Trim()
    if ($sync -ne "0`t0") {
      throw "Local branch is not synchronized with origin/$branch ($sync)."
    }
  }

  New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

  $label = if ($Mode -eq "ShareableClean") { "SHAREABLE_CLEAN" } else { "INTERNAL_AUDIT" }
  $zip = Join-Path $OutputDirectory "FacadeFlow-Demo_${label}_${shortCommit}_${stamp}.zip"
  $temp = Join-Path $env:TEMP "FacadeFlow_${label}_${shortCommit}_${stamp}"

  Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Path $temp | Out-Null

  $excludedDirs = @(".git", "node_modules", "dist", "dist-ssr", ".facadeflow-runtime", "coverage")
  if ($Mode -eq "ShareableClean") {
    $excludedDirs += "local-samples"
  }

  $excludedFiles = @(
    "*.log", "*.tmp", "*.bak", "*.rej", "*.orig",
    ".env", ".env.*"
  )

  if ($Mode -eq "ShareableClean") {
    $excludedFiles += @("*.dwg", "*.DWG", "*.lte", "*.LTE")
  }

  $robocopyArgs = @(".", $temp, "/E", "/R:1", "/W:1", "/NFL", "/NDL", "/NJH", "/NJS", "/NP", "/XD") +
    $excludedDirs + @("/XF") + $excludedFiles

  & robocopy @robocopyArgs | Out-Null
  $robocopyCode = $LASTEXITCODE
  if ($robocopyCode -gt 7) {
    throw "robocopy failed with exit code $robocopyCode."
  }

  $forbidden = @(
    ".git",
    "node_modules",
    "dist",
    "dist-ssr",
    ".facadeflow-runtime",
    "coverage"
  )

  foreach ($name in $forbidden) {
    if (Test-Path (Join-Path $temp $name)) {
      throw "Checkpoint guard failed: forbidden path '$name' was copied."
    }
  }

  if ($Mode -eq "ShareableClean") {
    if (Test-Path (Join-Path $temp "local-samples")) {
      throw "Shareable checkpoint guard failed: local-samples was copied."
    }

    $privateEvidence = Get-ChildItem $temp -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Extension -match '^\.(dwg|lte)$' }

    if ($privateEvidence) {
      throw "Shareable checkpoint guard failed: private DWG/LTE evidence was copied."
    }
  }

  $manifest = @"
FACADEFLOW $label CHECKPOINT
==============================
Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
Repository: FacadeFlow-Demo
Branch: $branch
Commit short: $shortCommit
Commit full: $fullCommit
Origin sync: $sync
Working tree: clean
Verification: $(if ($SkipVerify) { "SKIPPED BY EXPLICIT FLAG" } else { "npm run $verificationScript PASS" })
Private local evidence: $(if ($Mode -eq "InternalAudit") { "retained when present" } else { "excluded" })

Excluded from ZIP:
- .git
- node_modules
- dist / dist-ssr
- .facadeflow-runtime
- coverage
- .env / .env.*
- *.log / *.tmp / *.bak / *.rej / *.orig
$(if ($Mode -eq "ShareableClean") { "- local-samples`r`n- *.dwg / *.lte" } else { "" })
"@

  Set-Content -Path (Join-Path $temp "CHECKPOINT_MANIFEST.txt") -Value $manifest -Encoding UTF8

  New-PortableZip -SourceDirectory $temp -DestinationZip $zip
  Assert-PortableZip -ZipPath $zip

  Write-Host ""
  Write-Host "=== FACADEFLOW CHECKPOINT READY ===" -ForegroundColor Green
  Write-Host "MODE:   $Mode"
  Write-Host "COMMIT: $shortCommit"
  Write-Host "ZIP:    $zip"

  Remove-Item $temp -Recurse -Force
}
finally {
  Pop-Location
}
