<#
.SYNOPSIS
  Clone every project listed in repos.json into the current directory.

.DESCRIPTION
  Reads repos.json (sibling to this script) and clones each entry into
  ./<folder> at the specified branch. Idempotent: existing clones are
  fetched + checked out to the target branch instead of re-cloned.

  Run this from the directory you want to become your "Programming" root
  (typically F:\Programming on Windows, ~/Programming on macOS/Linux).

.PARAMETER Root
  Override the destination root. Defaults to the script's own directory.

.PARAMETER UseSsh
  Rewrite https://github.com/<owner>/<repo>.git remotes to git@github.com:<owner>/<repo>.git
  before cloning. Useful on machines configured with SSH keys.

.PARAMETER SkipExisting
  Skip folders that already exist instead of fetching them.

.EXAMPLE
  pwsh ./bootstrap.ps1
  pwsh ./bootstrap.ps1 -Root D:\Code -UseSsh
#>
[CmdletBinding()]
param(
    [string]$Root = $PSScriptRoot,
    [switch]$UseSsh,
    [switch]$SkipExisting
)

$ErrorActionPreference = 'Stop'

# Avoid the GITHUB_TOKEN bug documented in GTPUSH.md
Remove-Item Env:\GITHUB_TOKEN -ErrorAction SilentlyContinue

$manifestPath = Join-Path $PSScriptRoot 'repos.json'
if (-not (Test-Path $manifestPath)) {
    throw "repos.json not found next to bootstrap.ps1 (looked in $PSScriptRoot)"
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

if (-not (Test-Path $Root)) {
    New-Item -ItemType Directory -Path $Root | Out-Null
}
$Root = (Resolve-Path $Root).Path
Write-Host "Bootstrapping into: $Root" -ForegroundColor Cyan

$ok = 0; $skipped = 0; $failed = @()

foreach ($r in $manifest.repos) {
    $dest = Join-Path $Root $r.folder
    $remote = $r.remote
    if ($UseSsh) {
        $remote = $remote -replace '^https://github\.com/', 'git@github.com:'
    }

    Write-Host ""
    Write-Host "=== $($r.folder) [$($r.branch)] ===" -ForegroundColor Cyan

    if (Test-Path (Join-Path $dest '.git')) {
        if ($SkipExisting) {
            Write-Host "  exists, skipping" -ForegroundColor Yellow
            $skipped++
            continue
        }
        Write-Host "  exists, fetching + checking out $($r.branch)"
        try {
            Push-Location $dest
            git fetch --all --prune 2>&1 | Out-Host
            git checkout $r.branch 2>&1 | Out-Host
            git pull --ff-only 2>&1 | Out-Host
            $ok++
        } catch {
            Write-Host "  FAILED: $_" -ForegroundColor Red
            $failed += $r.folder
        } finally {
            Pop-Location
        }
        continue
    }

    $parent = Split-Path $dest -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    try {
        git clone --branch $r.branch $remote $dest 2>&1 | Out-Host
        $ok++
    } catch {
        Write-Host "  FAILED: $_" -ForegroundColor Red
        $failed += $r.folder
    }
}

Write-Host ""
Write-Host "===== Summary =====" -ForegroundColor Green
Write-Host "  OK:      $ok"
Write-Host "  Skipped: $skipped"
Write-Host "  Failed:  $($failed.Count)"
if ($failed.Count) {
    Write-Host "  Failed folders:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    exit 1
}

if ($manifest.skipped) {
    Write-Host ""
    Write-Host "Manifest also lists these intentionally-skipped folders (NOT cloned):" -ForegroundColor DarkGray
    foreach ($s in $manifest.skipped) {
        Write-Host ("  - {0,-26} ({1})" -f $s.folder, $s.reason) -ForegroundColor DarkGray
    }
}
