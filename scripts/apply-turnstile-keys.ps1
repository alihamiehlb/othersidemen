# Apply Cloudflare Turnstile keys everywhere (local env, Worker, GitHub, client).
# Production usage:
#   powershell -ExecutionPolicy Bypass -File scripts/apply-turnstile-keys.ps1 -SiteKey "0x4..." -SecretKey "0x4..."
# Local dev test keys (always pass):
#   powershell -ExecutionPolicy Bypass -File scripts/apply-turnstile-keys.ps1 -LocalDevOnly

param(
  [string]$SiteKey,
  [string]$SecretKey,
  [switch]$LocalDevOnly,
  [string]$Repo = "alihamiehlb/othersidemen",
  [string]$PagesUrl = "https://twoside-store.pages.dev"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if ($LocalDevOnly) {
  $SiteKey = "1x00000000000000000000AA"
  $SecretKey = "1x0000000000000000000000000000000AA"
  Write-Host "Applying Cloudflare Turnstile TEST keys for local dev only..."
} elseif ([string]::IsNullOrWhiteSpace($SiteKey) -or [string]::IsNullOrWhiteSpace($SecretKey)) {
  throw "Provide -SiteKey and -SecretKey, or use -LocalDevOnly for local testing."
}

function Set-DotEnvKey([string]$Path, [string]$Key, [string]$Value) {
  $lines = if (Test-Path $Path) { @(Get-Content $Path) } else { @() }
  $lines = $lines | Where-Object { $_ -notmatch "^$([regex]::Escape($Key))=" }
  $lines += "$Key=$Value"
  Set-Content -Path $Path -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
}

Write-Host "Updating local env files..."
Set-DotEnvKey "server/.env" "TURNSTILE_SECRET_KEY" $SecretKey
Set-DotEnvKey "server/.env" "VITE_TURNSTILE_SITE_KEY" $SiteKey
Set-DotEnvKey ".env" "VITE_TURNSTILE_SITE_KEY" $SiteKey
Set-DotEnvKey "client/.env.development" "VITE_TURNSTILE_SITE_KEY" $SiteKey
if (-not $LocalDevOnly) {
  Set-DotEnvKey "client/.env.production.local" "VITE_TURNSTILE_SITE_KEY" $SiteKey
}

if ($LocalDevOnly) {
  Write-Host ""
  Write-Host "Local dev Turnstile test keys applied. Restart npm run dev."
  Write-Host "Do NOT run sync-wrangler-secrets.ps1 with test keys."
  exit 0
}

Write-Host "Syncing TURNSTILE_SECRET_KEY to Cloudflare Worker..."
Push-Location cloudflare/api
$SecretKey | npx wrangler secret put TURNSTILE_SECRET_KEY --name twoside-store-api
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "wrangler secret put failed" }
Pop-Location

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  $ghPath = Join-Path $env:ProgramFiles "GitHub CLI\gh.exe"
  if (Test-Path $ghPath) {
    $ghDir = Split-Path $ghPath -Parent
    $env:Path = "$ghDir;$env:Path"
    $gh = Get-Command gh -ErrorAction SilentlyContinue
  }
}

if ($gh) {
  $ghAuthed = $false
  try {
    gh auth status --hostname github.com 2>$null | Out-Null
    $ghAuthed = ($LASTEXITCODE -eq 0)
  } catch {
    $ghAuthed = $false
  }
  if ($ghAuthed) {
    Write-Host "Setting GitHub secret VITE_TURNSTILE_SITE_KEY..."
    $SiteKey | gh secret set VITE_TURNSTILE_SITE_KEY --repo $Repo
    Write-Host "GitHub secret updated."
  } else {
    Write-Host "Skip GitHub: run gh auth login then re-run this script."
  }
} else {
  Write-Host "Skip GitHub: set VITE_TURNSTILE_SITE_KEY manually in repo secrets."
}

Write-Host ""
Write-Host "Done. Production Turnstile keys applied."
Write-Host "Next: push to main or re-run GitHub deploy so Pages rebuilds."
Write-Host "Turnstile widget domains must include $PagesUrl and localhost."
