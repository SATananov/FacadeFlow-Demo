param(
  [ValidateSet("ShareableClean", "InternalAudit")]
  [string]$Mode = "ShareableClean",

  [string]$OutputDirectory = "$env:USERPROFILE\Desktop",

  [switch]$SkipVerify
)

function Get-PortableEntryMap {
  param([Parameter(Mandatory = $true)][string]$SourceDirectory)

  $fileMap = @{}
  $entryNames = @()

  Get-ChildItem -Path $SourceDirectory -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($SourceDirectory.Length).TrimStart([char[]]"\/")
    $entryName = $relative.Replace("\", "/")
    if ($fileMap.ContainsKey($entryName)) {
      throw "Duplicate portable ZIP entry '$entryName'."
    }
    $fileMap[$entryName] = $_.FullName
    $entryNames += $entryName
  }

  [Array]::Sort($entryNames, [System.StringComparer]::Ordinal)
  return @($entryNames | ForEach-Object {
    [PSCustomObject]@{
      EntryName = $_
      FullName = $fileMap[$_]
    }
  })
}

function New-PortableZip {
  param(
    [Parameter(Mandatory = $true)][string]$SourceDirectory,
    [Parameter(Mandatory = $true)][string]$DestinationZip
  )

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  if (Test-Path $DestinationZip) {
    Remove-Item $DestinationZip -Force
  }

  $fixedTimestamp = [DateTimeOffset]::new(1980, 1, 1, 0, 0, 0, [TimeSpan]::Zero)
  $entries = @(Get-PortableEntryMap -SourceDirectory $SourceDirectory)

  $zipStream = [System.IO.File]::Open($DestinationZip, [System.IO.FileMode]::CreateNew)
  try {
    $archive = [System.IO.Compression.ZipArchive]::new(
      $zipStream,
      [System.IO.Compression.ZipArchiveMode]::Create,
      $false
    )
    try {
      foreach ($item in $entries) {
        $entry = $archive.CreateEntry($item.EntryName, [System.IO.Compression.CompressionLevel]::Optimal)
        $entry.LastWriteTime = $fixedTimestamp
        $entryStream = $entry.Open()
        try {
          $fileStream = [System.IO.File]::OpenRead($item.FullName)
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

    $entryNames = @($archive.Entries | ForEach-Object { $_.FullName })
    $sortedEntryNames = @($entryNames)
    [Array]::Sort($sortedEntryNames, [System.StringComparer]::Ordinal)
    if (($entryNames -join "`n") -ne ($sortedEntryNames -join "`n")) {
      throw "Portable ZIP guard failed: archive entries are not in deterministic ordinal order."
    }

    $duplicates = @($entryNames | Group-Object | Where-Object { $_.Count -gt 1 })
    if ($duplicates.Count -gt 0) {
      throw "Portable ZIP guard failed: duplicate archive entries were detected."
    }
  }
  finally {
    $archive.Dispose()
  }
}

function Write-DeterministicPayloadManifest {
  param(
    [Parameter(Mandatory = $true)][string]$SourceDirectory,
    [Parameter(Mandatory = $true)][string]$ManifestPath
  )

  $generatedNames = @("CHECKPOINT_MANIFEST.txt", "CHECKPOINT_CONTENT_SHA256.txt")
  $entries = @(Get-PortableEntryMap -SourceDirectory $SourceDirectory | Where-Object {
    $generatedNames -notcontains $_.EntryName
  })

  $lines = @()
  foreach ($item in $entries) {
    $hash = (Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $lines += "$hash  $($item.EntryName)"
  }

  $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
  $content = if ($lines.Count -gt 0) { ($lines -join "`n") + "`n" } else { "" }
  [System.IO.File]::WriteAllText($ManifestPath, $content, $utf8NoBom)

  return [PSCustomObject]@{
    FileCount = $entries.Count
    Sha256 = (Get-FileHash -LiteralPath $ManifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
  }
}

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $RepoRoot

try {
  if (-not (Test-Path ".git")) {
    throw "Checkpoint packaging requires a Git working tree."
  }

  if ($Mode -eq "ShareableClean" -and $SkipVerify) {
    throw "ShareableClean checkpoints cannot use -SkipVerify. Run the canonical verification gate."
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

  $shortCommit = (git rev-parse --short HEAD).Trim()
  $fullCommit = (git rev-parse HEAD).Trim()
  $branch = (git branch --show-current).Trim()
  $commitTime = (git show -s --format=%cI HEAD).Trim()

  if ([string]::IsNullOrWhiteSpace($branch)) {
    throw "Checkpoint packaging requires a named branch; detached HEAD is not supported."
  }

  git remote get-url origin *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Checkpoint packaging requires a configured 'origin' remote."
  }

  git fetch origin
  if ($LASTEXITCODE -ne 0) {
    throw "git fetch origin failed. Checkpoint provenance cannot be verified."
  }

  git rev-parse --verify "refs/remotes/origin/$branch" *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Remote tracking branch origin/$branch does not exist. Checkpoint provenance cannot be verified."
  }

  $sync = (git rev-list --left-right --count "origin/$branch...HEAD").Trim()
  if ($sync -ne "0`t0") {
    throw "Local branch is not synchronized with origin/$branch ($sync)."
  }

  New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

  $label = if ($Mode -eq "ShareableClean") { "SHAREABLE_CLEAN" } else { "INTERNAL_AUDIT" }
  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
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
    ".env", ".env.*",
    "CHECKPOINT_MANIFEST.txt", "CHECKPOINT_CONTENT_SHA256.txt"
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

  $contentManifestPath = Join-Path $temp "CHECKPOINT_CONTENT_SHA256.txt"
  $payload = Write-DeterministicPayloadManifest -SourceDirectory $temp -ManifestPath $contentManifestPath

  $manifest = @"
FACADEFLOW $label CHECKPOINT
==============================
Repository: FacadeFlow-Demo
Branch: $branch
Commit short: $shortCommit
Commit full: $fullCommit
Commit time: $commitTime
Origin sync: $sync
Working tree: clean
Verification: $(if ($SkipVerify) { "SKIPPED BY EXPLICIT INTERNAL FLAG" } else { "npm run $verificationScript PASS" })
Payload files: $($payload.FileCount)
Payload manifest: CHECKPOINT_CONTENT_SHA256.txt
Payload manifest SHA-256: $($payload.Sha256)
Private local evidence: $(if ($Mode -eq "InternalAudit") { "retained when present" } else { "excluded" })

Excluded from ZIP:
- .git
- node_modules
- dist / dist-ssr
- .facadeflow-runtime
- coverage
- .env / .env.*
- *.log / *.tmp / *.bak / *.rej / *.orig
$(if ($Mode -eq "ShareableClean") { "- local-samples`n- *.dwg / *.lte" } else { "" })
"@

  $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText(
    (Join-Path $temp "CHECKPOINT_MANIFEST.txt"),
    $manifest.Replace("`r`n", "`n"),
    $utf8NoBom
  )

  New-PortableZip -SourceDirectory $temp -DestinationZip $zip
  Assert-PortableZip -ZipPath $zip

  Write-Host ""
  Write-Host "=== FACADEFLOW CHECKPOINT READY ===" -ForegroundColor Green
  Write-Host "MODE:       $Mode"
  Write-Host "COMMIT:     $shortCommit"
  Write-Host "PAYLOAD:    $($payload.Sha256)"
  Write-Host "ZIP:        $zip"

  Remove-Item $temp -Recurse -Force
}
finally {
  Pop-Location
}
