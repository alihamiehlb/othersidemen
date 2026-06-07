# Sync build/runtime env from server/.env into GitHub Actions secrets & variables.
# Prerequisite: gh auth login  (once)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/sync-github-secrets.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$Repo = "alihamiehlb/othersidemen"
$EnvFile = "server/.env"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  $ghLocal = Join-Path (Join-Path $PSScriptRoot "..\.tools\gh\bin") "gh.exe"
  if (Test-Path $ghLocal) { $env:Path = "$(Split-Path $ghLocal -Parent);$env:Path" }
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) not found. Install from https://cli.github.com/ then run: gh auth login"
}

gh auth status --hostname github.com 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Run 'gh auth login' first, then re-run this script."
}

function Read-DotEnv([string]$Path) {
  $map = @{}
  if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim().Trim('"')
    $map[$key] = $val
  }
  return $map
}

$envMap = Read-DotEnv $EnvFile

Write-Host "Syncing GitHub secrets/variables for $Repo ..."

# --- Secrets (sensitive) ---
$secretMap = @{
  VITE_WHATSAPP_NUMBER = $envMap["VITE_WHATSAPP_NUMBER"]
  VITE_TURNSTILE_SITE_KEY = $envMap["VITE_TURNSTILE_SITE_KEY"]
}

foreach ($entry in $secretMap.GetEnumerator()) {
  if ([string]::IsNullOrWhiteSpace($entry.Value)) {
    Write-Host "  skip secret $($entry.Key) (not in $EnvFile)"
    continue
  }
  Write-Host "  set secret $($entry.Key)"
  $entry.Value | gh secret set $entry.Key --repo $Repo
  if ($LASTEXITCODE -ne 0) { throw "Failed to set secret $($entry.Key)" }
}

# --- Variables (non-secret, safe to expose in logs) ---
$varMap = @{
  VITE_API_URL = ""
  VITE_CDN_URL = ""
}

foreach ($entry in $varMap.GetEnumerator()) {
  Write-Host "  set variable $($entry.Key) = '$($entry.Value)'"
  gh variable set $entry.Key --body $entry.Value --repo $Repo
  if ($LASTEXITCODE -ne 0) { throw "Failed to set variable $($entry.Key)" }
}

Write-Host ""
Write-Host "Done. Required for deploy: CLOUDFLARE_API_TOKEN (set manually in GitHub if not already)."
Write-Host "Optional: VITE_TURNSTILE_SITE_KEY - add to server/.env or Cloudflare Turnstile dashboard, then re-run."
Write-Host "Re-run deploy workflow: deploy-cloudflare.yml on GitHub Actions"
