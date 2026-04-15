$ErrorActionPreference = "SilentlyContinue"

$stopped = $false
Get-Process cloudflared | ForEach-Object {
    Stop-Process -Id $_.Id -Force
    $stopped = $true
}

if ($stopped) {
    Write-Host "cloudflared тоқтатылды." -ForegroundColor Green
} else {
    Write-Host "Іске қосылған cloudflared табылмады." -ForegroundColor Yellow
}
