# Apply R2 public URL + bucket settings to local env and Worker secrets (non-interactive).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/apply-r2-env.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$AccountId = "fc8761363df4a7a310cc35ed41d1c809"
$BucketName = "twoside-store-assets"
$EnvFile = "server/.env"
$ClientEnv = "client/.env.production.local"

Write-Host "=== Apply R2 environment ===" -ForegroundColor Cyan

function Invoke-Wrangler {
  param([Parameter(Mandatory = $true)][string[]]$WranglerArgs)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $out = & npx wrangler @WranglerArgs 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0 -and $out -notmatch 'https://pub-[a-f0-9]+\.r2\.dev') {
      throw "wrangler $($WranglerArgs -join ' ') failed (exit $LASTEXITCODE): $out"
    }
    return $out
  } finally {
    $ErrorActionPreference = $prev
  }
}

Push-Location cloudflare/api
try {
  $devUrlOut = Invoke-Wrangler -WranglerArgs @('r2', 'bucket', 'dev-url', 'get', $BucketName)
  if ($devUrlOut -notmatch '(https://pub-[a-f0-9]+\.r2\.dev)') {
    Write-Host "Enabling R2 public dev URL..."
    Invoke-Wrangler -WranglerArgs @('r2', 'bucket', 'dev-url', 'enable', $BucketName) | Out-Host
    $devUrlOut = Invoke-Wrangler -WranglerArgs @('r2', 'bucket', 'dev-url', 'get', $BucketName)
  }
  if ($devUrlOut -notmatch '(https://pub-[a-f0-9]+\.r2\.dev)') {
    throw "Could not resolve R2 public URL. Enable public access in the Cloudflare dashboard."
  }
  $PublicUrl = $Matches[1]
} finally {
  Pop-Location
}

Write-Host "R2 public URL: $PublicUrl"

function Set-EnvLine([string]$Path, [string]$Key, [string]$Value) {
  $lines = @()
  if (Test-Path $Path) { $lines = Get-Content $Path }
  $found = $false
  $out = foreach ($line in $lines) {
    if ($line -match "^$Key=") { $found = $true; "$Key=$Value" }
    else { $line }
  }
  if (-not $found) { $out += "$Key=$Value" }
  $out | Set-Content $Path -Encoding utf8
}

Set-EnvLine $EnvFile "R2_ACCOUNT_ID" $AccountId
Set-EnvLine $EnvFile "R2_BUCKET_NAME" $BucketName
Set-EnvLine $EnvFile "R2_PUBLIC_URL" $PublicUrl

if (-not (Test-Path $ClientEnv)) { New-Item -ItemType File -Path $ClientEnv -Force | Out-Null }
Set-EnvLine $ClientEnv "VITE_CDN_URL" $PublicUrl

Write-Host "Updated $EnvFile and $ClientEnv"

Write-Host "Syncing R2_PUBLIC_URL to Worker..."
Push-Location cloudflare/api
try {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $PublicUrl | & npx wrangler secret put R2_PUBLIC_URL --name twoside-store-api 2>&1 | Out-Host
  $ErrorActionPreference = $prev
  if ($LASTEXITCODE -ne 0) { throw "wrangler secret put R2_PUBLIC_URL failed" }
} finally {
  Pop-Location
}

Write-Host "Done. Run: node scripts/migrate-catalog-to-r2-wrangler.mjs" -ForegroundColor Green
