# Create Cloudflare Turnstile widget and sync secrets (requires wrangler login).
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$AccountId = "fc8761363df4a7a310cc35ed41d1c809"
$Domain = "twoside-store.pages.dev"

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
  throw "Run npx wrangler login first"
}

$token = Get-CfToken
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "Creating Turnstile widget for $Domain ..."
$body = @{
  name = "twoside-store-prod"
  domains = @($Domain)
  mode = "invisible"
  bot_fight_mode = $false
} | ConvertTo-Json

$secret = $null
$siteKey = $null

try {
  $res = Invoke-RestMethod -Method POST -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/challenges/widgets" -Headers $headers -Body $body
  if ($res.success) {
    $siteKey = $res.result.sitekey
    $secret = $res.result.secret
    Write-Host "Created widget."
  }
} catch {
  Write-Host "Create failed, listing existing widgets..."
}

if (-not $siteKey) {
  $list = Invoke-RestMethod -Method GET -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/challenges/widgets" -Headers $headers
  $widget = $list.result | Where-Object { $_.domains -contains $Domain } | Select-Object -First 1
  if (-not $widget) { throw "Could not create or find Turnstile widget for $Domain" }
  $siteKey = $widget.sitekey
  Write-Host "Using existing widget: $($widget.name)"
}

if ($secret) {
  Push-Location cloudflare/api
  $secret | npx wrangler secret put TURNSTILE_SECRET_KEY --name twoside-store-api
  Pop-Location
}

$envPath = "server/.env"
$lines = if (Test-Path $envPath) { @(Get-Content $envPath) } else { @() }
$lines = $lines | Where-Object { $_ -notmatch '^(TURNSTILE_SECRET_KEY|VITE_TURNSTILE_SITE_KEY)=' }
if ($secret) { $lines += "TURNSTILE_SECRET_KEY=$secret" }
$lines += "VITE_TURNSTILE_SITE_KEY=$siteKey"
Set-Content -Path $envPath -Value ($lines -join [Environment]::NewLine) -Encoding UTF8

Write-Host "Site key: $siteKey"
Write-Host "Updated server/.env"

if (Get-Command gh -ErrorAction SilentlyContinue) {
  gh secret set VITE_TURNSTILE_SITE_KEY --body $siteKey --repo alihamiehlb/othersidemen 2>$null
  Write-Host "GitHub secret VITE_TURNSTILE_SITE_KEY set."
}

Write-Host "Done. Rebuild Pages to embed the site key."
