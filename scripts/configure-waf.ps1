# Apply Cloudflare security settings (Bot Fight Mode + rate limiting rules).
# Requires CLOUDFLARE_API_TOKEN with Account:Read, Account Settings:Edit, Account WAF:Edit
# Usage: powershell -ExecutionPolicy Bypass -File scripts/configure-waf.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$AccountId = "fc8761363df4a7a310cc35ed41d1c809"
$PagesHost = "twoside-store.pages.dev"

function Get-CfToken {
  if ($env:CLOUDFLARE_API_TOKEN) { return $env:CLOUDFLARE_API_TOKEN }
  $paths = @(
    "$env:APPDATA\xdg.config\.wrangler\config\default.toml",
    "$env:USERPROFILE\.wrangler\config\default.toml"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) {
      $m = [regex]::Match((Get-Content $p -Raw), 'oauth_token = "([^"]+)"')
      if ($m.Success) { return $m.Groups[1].Value }
    }
  }
  throw "Set CLOUDFLARE_API_TOKEN or run npx wrangler login"
}

$token = Get-CfToken
$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

Write-Host "=== Bot Fight Mode (account) ==="
try {
  Invoke-RestMethod -Method PUT -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/bot_management" `
    -Headers $headers -Body (@{ fight_mode = $true } | ConvertTo-Json) | Out-Null
  Write-Host "Bot Fight Mode enabled."
} catch {
  Write-Warning "Bot Fight Mode: $($_.Exception.Message) (may require paid plan)"
}

Write-Host "=== Security level ==="
try {
  Invoke-RestMethod -Method PATCH -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/settings/security_level" `
    -Headers $headers -Body (@{ value = "medium" } | ConvertTo-Json) | Out-Null
  Write-Host "Security level set to medium."
} catch {
  Write-Warning "Security level: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Manual (Pages on pages.dev until custom domain):"
Write-Host "  Dashboard -> Security -> Settings -> Browser Integrity Check ON"
Write-Host "  Dashboard -> Security -> DDoS -> HTTP sensitivity High"
Write-Host ""
Write-Host "When you add a custom domain, create WAF rate rules for:"
Write-Host "  - POST $PagesHost/api/auth/* -> 10 req/min/IP"
Write-Host "  - $PagesHost/api/* -> 100 req/min/IP"
Write-Host "  - $PagesHost/admin* -> 30 req/min/IP"
Write-Host ""
Write-Host "Worker edge rate limits are in cloudflare/api/wrangler.jsonc (120/min API, 15/min auth)."
