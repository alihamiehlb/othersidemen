# One-shot production setup (run from repo root after `npx wrangler login`)
# Sets secrets, Turnstile test keys, rebuilds Pages, optional GitHub secrets + workflow trigger.

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$PagesUrl = "https://twoside-store.pages.dev"
$ApiUrl = "https://twoside-store-api.alihamiehlb.workers.dev"
# Cloudflare documented test keys (replace with real Turnstile widget keys before launch)
$TurnstileSiteKey = "1x00000000000000000000AA"
$TurnstileSecret = "1x0000000000000000000000000000000AA"
$AccountId = "fc8761363df4a7a310cc35ed41d1c809"

Write-Host "=== Sync Worker secrets from server/.env ==="
& powershell -ExecutionPolicy Bypass -File scripts/sync-wrangler-secrets.ps1 -PagesUrl $PagesUrl -ApiUrl $ApiUrl

Write-Host "=== Set Turnstile secret ==="
Push-Location cloudflare/api
$TurnstileSecret | npx wrangler secret put TURNSTILE_SECRET_KEY --name twoside-store-api
Pop-Location

Write-Host "=== Build & deploy Pages ==="
$env:VITE_API_URL = $ApiUrl
$env:VITE_TURNSTILE_SITE_KEY = $TurnstileSiteKey
npm run build:client
npx wrangler pages deploy client/dist --project-name=twoside-store --branch=main --commit-dirty=true

Write-Host "=== GitHub secrets (if gh authenticated) ==="
$wranglerConfig = "$env:APPDATA\xdg.config\.wrangler\config\default.toml"
if (-not (Test-Path $wranglerConfig)) { $wranglerConfig = "$env:USERPROFILE\.wrangler\config\default.toml" }
$cfToken = ([regex]::Match((Get-Content $wranglerConfig -Raw), 'oauth_token = "([^"]+)"')).Groups[1].Value

if (Get-Command gh -ErrorAction SilentlyContinue) {
  $auth = gh auth status 2>&1
  if ($LASTEXITCODE -eq 0) {
    gh secret set CLOUDFLARE_API_TOKEN --body $cfToken --repo alihamiehlb/othersidemen
    gh secret set CLOUDFLARE_ACCOUNT_ID --body $AccountId --repo alihamiehlb/othersidemen
    gh secret set VITE_API_URL --body $ApiUrl --repo alihamiehlb/othersidemen
    gh secret set VITE_TURNSTILE_SITE_KEY --body $TurnstileSiteKey --repo alihamiehlb/othersidemen
    Write-Host "GitHub secrets updated. Triggering deploy workflow..."
    gh workflow run "Deploy to Cloudflare" --repo alihamiehlb/othersidemen --ref main
  } else {
    Write-Host "Run: gh auth login — then re-run this script to set GitHub secrets and deploy API container."
  }
} else {
  Write-Host "Install GitHub CLI (gh) to auto-set secrets and trigger container deploy via Actions."
}

Write-Host ""
Write-Host "Done. Test API: $ApiUrl/api/health"
Write-Host "Replace Turnstile test keys with real widget keys in Cloudflare Dashboard before public launch."
