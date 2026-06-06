# Full Cloudflare deploy: API container + Pages frontend + secrets from server/.env
# Prerequisites: npx wrangler login (once)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/deploy-cloudflare.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$pagesProject = "twoside-store"

Write-Host "=== 1/4 Deploy API (Workers Container) ==="
Push-Location cloudflare/api
npm install --silent
$deployOut = npx wrangler deploy 2>&1 | Out-String
Write-Host $deployOut
Pop-Location

$apiUrl = ""
if ($deployOut -match "https://twoside-store-api\.[a-z0-9-]+\.workers\.dev") {
  $apiUrl = $Matches[0]
} elseif ($deployOut -match "https://[a-z0-9-]+\.workers\.dev") {
  $apiUrl = $Matches[0]
}
if (-not $apiUrl) {
  Write-Warning "Could not detect API URL from deploy output. Set -ApiUrl manually for secrets sync."
  $apiUrl = Read-Host "Paste your API workers.dev URL (e.g. https://twoside-store-api.xxx.workers.dev)"
}

$pagesUrl = "https://$pagesProject.pages.dev"
Write-Host "Using Pages URL: $pagesUrl"
Write-Host "Using API URL: $apiUrl"

Write-Host "=== 2/4 Sync Worker secrets ==="
& powershell -ExecutionPolicy Bypass -File scripts/sync-wrangler-secrets.ps1 -PagesUrl $pagesUrl -ApiUrl $apiUrl

Write-Host "=== 3/4 Build client with VITE_API_URL ==="
$env:VITE_API_URL = $apiUrl
npm run build:client
if ($LASTEXITCODE -ne 0) { throw "Client build failed" }

Write-Host "=== 4/4 Deploy Pages ==="
npx wrangler pages deploy client/dist --project-name=$pagesProject --branch=main
if ($LASTEXITCODE -ne 0) { throw "Pages deploy failed" }

Write-Host ""
Write-Host "Deploy complete."
Write-Host "  Store:  $pagesUrl"
Write-Host "  API:    $apiUrl"
Write-Host "  Health: $apiUrl/api/health"
Write-Host ""
Write-Host "Next: add custom domain in Cloudflare dashboard, update Google OAuth redirect URIs, rotate secrets before public launch."
