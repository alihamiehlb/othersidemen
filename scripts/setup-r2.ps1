# Enable R2, create bucket, configure server/.env, migrate catalog, sync Worker secrets.
# Prerequisite: R2 enabled in Cloudflare Dashboard (R2 → Get started).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-r2.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$AccountId = "fc8761363df4a7a310cc35ed41d1c809"
$BucketName = "twoside-store-assets"
$EnvFile = "server/.env"

Write-Host "=== OTHER SIDE — R2 setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step 1: Enable R2 in Cloudflare Dashboard if not already:"
Write-Host "  https://dash.cloudflare.com/$AccountId/r2/overview" -ForegroundColor Yellow
Write-Host ""

Push-Location cloudflare/api
try {
  Write-Host "Creating R2 bucket: $BucketName"
  npx wrangler r2 bucket create $BucketName 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Write-Host "If bucket already exists or R2 not enabled, fix in dashboard then re-run." -ForegroundColor Yellow
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Step 2: Create R2 API token in Dashboard:"
Write-Host "  https://dash.cloudflare.com/$AccountId/r2/api-tokens" -ForegroundColor Yellow
Write-Host "  Permissions: Object Read & Write on bucket $BucketName"
Write-Host ""

Write-Host "Step 3: Enable public access (R2.dev subdomain or custom domain):"
Write-Host "  https://dash.cloudflare.com/$AccountId/r2/default/buckets/$BucketName/settings" -ForegroundColor Yellow
Write-Host "  Copy the public URL (e.g. https://pub-xxxx.r2.dev)"
Write-Host ""

$accessKey = Read-Host "R2_ACCESS_KEY_ID"
$secretKey = Read-Host "R2_SECRET_ACCESS_KEY" -AsSecureString
$secretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey))
$publicUrl = Read-Host "R2_PUBLIC_URL (e.g. https://pub-xxxx.r2.dev)"

if (-not (Test-Path $EnvFile)) {
  Copy-Item "server/.env.example" $EnvFile -ErrorAction SilentlyContinue
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

Set-EnvLine "R2_ACCOUNT_ID" $AccountId
Set-EnvLine "R2_ACCESS_KEY_ID" $accessKey
Set-EnvLine "R2_SECRET_ACCESS_KEY" $secretPlain
Set-EnvLine "R2_BUCKET_NAME" $BucketName
Set-EnvLine "R2_PUBLIC_URL" $publicUrl

# Client build-time CDN
$clientEnv = "client/.env.production.local"
$clientLines = @()
if (Test-Path $clientEnv) {
  $clientLines = Get-Content $clientEnv | Where-Object { $_ -notmatch '^VITE_CDN_URL=' }
}
$clientLines += "VITE_CDN_URL=$publicUrl"
$clientLines | Set-Content $clientEnv -Encoding utf8

Write-Host ""
Write-Host "Step 4: Migrating catalog to R2..."
node scripts/migrate-catalog-to-r2.mjs

Write-Host ""
Write-Host "Step 5: Syncing Worker secrets..."
& powershell -ExecutionPolicy Bypass -File scripts/sync-wrangler-secrets.ps1

Write-Host ""
Write-Host "Done. Next:" -ForegroundColor Green
Write-Host "  npm run build:client"
Write-Host "  npm run deploy:pages"
Write-Host "  git push origin main   (API container deploy via GitHub Actions)"
Write-Host "  Set GitHub variable VITE_CDN_URL=$publicUrl for CI builds"
