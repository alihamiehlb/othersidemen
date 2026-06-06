# Stops stale dev servers blocking ports 3001 and 5173-5176
$ports = 3001, 5173, 5174, 5175, 5176
foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
    $procId = $_.OwningProcess
    if ($procId -and $procId -ne $PID) {
      Write-Host "Stopping process $procId on port $port"
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
  }
}
Write-Host "Ports cleared."
