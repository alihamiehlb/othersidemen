# Enable R2, configure env, migrate catalog, sync Worker secrets.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-r2.ps1
# Optional: pass keys as env vars before running (non-interactive):
#   $env:R2_ACCESS_KEY_ID='...'; $env:R2_SECRET_ACCESS_KEY='...'; npm run setup:r2

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$AccountId = "fc8761363df4a7a310cc35ed41d1c809"
$BucketName = "twoside-store-assets"
$EnvFile = "server/.env"

Write-Host "=== OTHER SIDE - R2 setup ===" -ForegroundColor Cyan

Push-Location cloudflare/api
try {
  Write-Host "Ensuring bucket: $BucketName"
  npx wrangler r2 bucket create $BucketName 2>&1 | Out-Host
} finally {
  Pop-Location
}

& powershell -ExecutionPolicy Bypass -File scripts/apply-r2-env.ps1

$accessKey = $env:R2_ACCESS_KEY_ID
$secretKey = $env:R2_SECRET_ACCESS_KEY
if (-not $accessKey) { $accessKey = Read-Host "R2_ACCESS_KEY_ID (from Cloudflare R2 API Tokens - skip with Enter to use Worker upload only)" }
if ($accessKey -and -not $secretKey) {
  $secure = Read-Host "R2_SECRET_ACCESS_KEY" -AsSecureString
  $secretKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

function Set-EnvLine([string]$Key, [string]$Value) {
  $lines = @()
  if (Test-Path $EnvFile) { $lines = Get-Content $EnvFile }
  $found = $false
  $out = foreach ($line in $lines) {
    if ($line -match "^$Key=") { $found = $true; "$Key=$Value" }
    else { $line }
  }
  if (-not $found) { $out += "$Key=$Value" }
  $out | Set-Content $EnvFile -Encoding utf8
}

if ($accessKey -and $secretKey) {
  Set-EnvLine "R2_ACCESS_KEY_ID" $accessKey
  Set-EnvLine "R2_SECRET_ACCESS_KEY" $secretKey
  Write-Host "Saved R2 S3 credentials to server/.env"
} else {
  Write-Host "Skipping S3 credentials - admin uploads will use Worker R2 binding." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Migrating catalog to R2 (wrangler)..."
node scripts/migrate-catalog-to-r2-wrangler.mjs

Write-Host ""
Write-Host "Syncing Worker secrets..."
& powershell -ExecutionPolicy Bypass -File scripts/sync-wrangler-secrets.ps1

Write-Host ""
Write-Host "Done. Next:" -ForegroundColor Green
Write-Host "  npm run build:client"
Write-Host "  npm run deploy:pages"
Write-Host "  Set GitHub repository variable VITE_CDN_URL to your R2 public URL"
