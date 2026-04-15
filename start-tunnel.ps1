$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$cloudflaredPath = Join-Path $projectRoot "cloudflared.exe"
$originUrl = "http://127.0.0.1:8000"

if (-not (Test-Path -LiteralPath $cloudflaredPath)) {
    Write-Error "cloudflared.exe not found: $cloudflaredPath"
}

try {
    $response = Invoke-WebRequest -UseBasicParsing $originUrl -TimeoutSec 3
    if ($response.StatusCode -ne 200) {
        Write-Warning "Backend at $originUrl returned $($response.StatusCode)."
    }
} catch {
    Write-Warning "Backend at $originUrl is not responding. Start Django first."
}

Write-Host ""
Write-Host "Starting quick tunnel..." -ForegroundColor Cyan
Write-Host "Backend: $originUrl" -ForegroundColor DarkGray
Write-Host "Cloudflared: $cloudflaredPath" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Do not close this window after the URL appears." -ForegroundColor Yellow
Write-Host ""

& $cloudflaredPath tunnel --url $originUrl --no-autoupdate --protocol http2
