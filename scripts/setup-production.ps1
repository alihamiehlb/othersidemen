# One-shot production setup (run from repo root after `npx wrangler login`)
# Reads Turnstile + secrets from server/.env — no hardcoded test keys.

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$PagesUrl = "https://twoside-store.pages.dev"
$ApiUrl = "https://twoside-store-api.alihamiehlb.workers.dev"
$AccountId = "fc8761363df4a7a310cc35ed41d1c809"

function Read-DotEnv([string]$Path) {
  $map = @{}
  if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
    $map[$key] = $val
  }
  return $map
}

$envFile = Read-DotEnv "server/.env"
$TurnstileSiteKey = $envFile["VITE_TURNSTILE_SITE_KEY"]
$TurnstileSecret = $envFile["TURNSTILE_SECRET_KEY"]

if (-not $TurnstileSiteKey -or -not $TurnstileSecret) {
  Write-Host "Add production Turnstile keys to server/.env:"
  Write-Host "  TURNSTILE_SECRET_KEY=..."
  Write-Host "  VITE_TURNSTILE_SITE_KEY=..."
  Write-Host "Create widget: Cloudflare Dashboard → Turnstile → Add site (Invisible) → domain: twoside-store.pages.dev"
}

Write-Host "=== Sync Worker secrets from server/.env ==="
& powershell -ExecutionPolicy Bypass -File scripts/sync-wrangler-secrets.ps1 -PagesUrl $PagesUrl -ApiUrl $ApiUrl

if ($TurnstileSecret) {
  Write-Host "=== Confirm Turnstile secret ==="
  Push-Location cloudflare/api
  $TurnstileSecret | npx wrangler secret put TURNSTILE_SECRET_KEY --name twoside-store-api
  Pop-Location
}

Write-Host "=== Configure WAF (account settings) ==="
& powershell -ExecutionPolicy Bypass -File scripts/configure-waf.ps1

Write-Host "=== Sync catalog images ==="
node scripts/sync-catalog-images.mjs

Write-Host "=== Build & deploy Pages ==="
$env:VITE_API_URL = ""
$env:VITE_CDN_URL = ""
if ($TurnstileSiteKey) { $env:VITE_TURNSTILE_SITE_KEY = $TurnstileSiteKey }
npm run build:client
Push-Location client
npx wrangler pages deploy dist --project-name=twoside-store --branch=main --commit-dirty=true
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Pages deploy failed" }
Pop-Location

Write-Host "=== Deploy API container ==="
Push-Location cloudflare/api
npm install
npx wrangler deploy
Pop-Location

Write-Host ""
Write-Host "=== Google OAuth (fix in Google Cloud Console) ==="
Write-Host "Authorized JavaScript origins:"
Write-Host "  $PagesUrl"
Write-Host "Authorized redirect URIs (must include https://):"
Write-Host "  $PagesUrl/api/auth/google/callback"
Write-Host ""
Write-Host "Done. Store: $PagesUrl | API: $ApiUrl"
