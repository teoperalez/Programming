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

# ── Pre-flight 1: Ensure PowerShell 7+ ───────────────────────────────────────
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Host "PowerShell $($PSVersionTable.PSVersion) detected — installing PowerShell 7..." -ForegroundColor Yellow
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "winget not found. Install PowerShell 7 manually from https://aka.ms/powershell and re-run this script with pwsh."
    }
    winget install --id Microsoft.PowerShell --source winget --accept-package-agreements --accept-source-agreements
    Write-Host ""
    Write-Host "PowerShell 7 installed. Please re-run this script using:" -ForegroundColor Green
    Write-Host "  pwsh -File `"$PSCommandPath`"" -ForegroundColor Green
    exit 0
}

# ── Pre-flight 2: Ensure uv is installed ─────────────────────────────────────
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    $uvBin = "$env:USERPROFILE\.local\bin\uv.exe"
    if (Test-Path $uvBin) {
        $env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"
        Write-Host "uv: found at $uvBin" -ForegroundColor Green
    } else {
        Write-Host "uv not found — installing..." -ForegroundColor Yellow
        powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
        $env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"
        Write-Host "uv installed." -ForegroundColor Green
    }
} else {
    Write-Host "uv: already installed." -ForegroundColor Green
}

# ── Pre-flight 4: Ensure GitHub CLI is authenticated ─────────────────────────
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) is not installed. Install it from https://cli.github.com and re-run."
}
gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged into GitHub — launching auth..." -ForegroundColor Yellow
    gh auth login
    if ($LASTEXITCODE -ne 0) { throw "GitHub authentication failed. Re-run the script and try again." }
    Write-Host "GitHub auth successful." -ForegroundColor Green
} else {
    Write-Host "GitHub: already authenticated." -ForegroundColor Green
}

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

function Invoke-ProjectSetup {
    param([string]$Dest, [string]$FolderName)
    $setupScript = Join-Path $Dest 'setup.ps1'
    if (-not (Test-Path $setupScript)) { return }
    Write-Host "  [setup] Running setup.ps1..." -ForegroundColor Cyan
    try {
        & pwsh -File $setupScript -Dest $Dest
    } catch {
        Write-Host "  [setup] FAILED: $_" -ForegroundColor Red
        $script:failed += "$FolderName (setup)"
    }
}

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
        Invoke-ProjectSetup -Dest $dest -FolderName $r.folder
        continue
    }

    $parent = Split-Path $dest -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    try {
        git clone --branch $r.branch $remote $dest 2>&1 | Out-Host
        $ok++
        Invoke-ProjectSetup -Dest $dest -FolderName $r.folder
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
