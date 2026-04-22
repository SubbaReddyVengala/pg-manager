# PG Manager - Build All Services
$ROOT = Get-Location
$Services = @(
    "backend\api-gateway",
    "backend\auth-service",
    "backend\room-service",
    "backend\tenant-service",
    "backend\payment-service",
    "backend\notification-service",
    "backend\report-service",
    "backend\maintenance-service"
)

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   BUILDING ALL MICROSERVICES (PLEASE WAIT)" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 0. Kill existing processes to free RAM and avoid file locks
Write-Host "`n[0/1] Freeing RAM and unlocking JARs (Stopping existing Java/Node)..." -ForegroundColor Gray
Get-Process -Name "java", "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*pg-manager*" } | Stop-Process -Force -ErrorAction SilentlyContinue

foreach ($svc in $Services) {
    Write-Host "`nBuilding $svc..." -ForegroundColor Yellow
    Set-Location "$ROOT\$svc"
    ./mvnw clean package -DskipTests
}

Set-Location $ROOT
Write-Host "`n======================================================" -ForegroundColor Green
Write-Host " ALL SERVICES BUILT SUCCESSFULLY!" -ForegroundColor Green
Write-Host " You can now use start-dev.ps1 in Lean Mode." -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
