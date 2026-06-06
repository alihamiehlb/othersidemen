# Sync server/.env secrets to Cloudflare Worker (twoside-store-api).
# Usage: from repo root after `npx wrangler login`
#   powershell -ExecutionPolicy Bypass -File scripts/sync-wrangler-secrets.ps1
# Optional overrides:
#   -PagesUrl https://twoside-store.pages.dev
#   -ApiUrl https://twoside-store-api.<account>.workers.dev

param(
  [string]$EnvFile = "server/.env",
  [string]$PagesUrl = "",
  [string]$ApiUrl = "",
  [string]$WorkerDir = "cloudflare/api"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing $EnvFile"
}

function Read-DotEnv([string]$Path) {
  $map = @{}
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    if ($val.StartsWith('"') -and $val.EndsWith('"')) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    $map[$key] = $val
  }
  return $map
}

$envMap = Read-DotEnv $EnvFile

if ($PagesUrl) {
  $envMap["CORS_ORIGIN"] = $PagesUrl
  $envMap["CLIENT_URL"] = $PagesUrl
}
if ($ApiUrl) {
  $envMap["GOOGLE_CALLBACK_URL"] = "$ApiUrl/api/auth/google/callback"
}

$secretKeys = @(
  "MONGODB_URI",
  "REDIS_URL",
  "JWT_SECRET",
  "CSRF_SECRET",
  "CORS_ORIGIN",
  "CLIENT_URL",
  "ADMIN_EMAIL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL"
  "TURNSTILE_SECRET_KEY"
)

Push-Location $WorkerDir
try {
  foreach ($key in $secretKeys) {
    if (-not $envMap.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envMap[$key])) {
      Write-Host "Skipping $key (not set in $EnvFile)"
      continue
    }
    Write-Host "Setting secret: $key"
    $envMap[$key] | npx wrangler secret put $key --name twoside-store-api
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to set secret $key"
    }
  }
  Write-Host "All secrets synced."
}
finally {
  Pop-Location
}
