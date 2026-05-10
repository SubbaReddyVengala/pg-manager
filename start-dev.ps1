# PG Manager - RAM Optimized Startup Script
$JAVA_PATH = "C:\Program Files\Java\jdk-21" # Updated based on java -version output
$env:JAVA_HOME = $JAVA_PATH
$ROOT = Get-Location
$Processes = @()

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   PG MANAGER: RAM-OPTIMIZED CONTROL CENTER" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 0. Kill existing processes to free RAM
Write-Host "`n[0/4] Freeing RAM (Stopping existing Java/Node)..." -ForegroundColor Gray
Get-Process -Name "java", "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*pg-manager*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# 1. Check Database
Write-Host "`n[1/4] Checking Database..." -ForegroundColor Yellow
$dbCheck = docker ps --filter "name=pg_manager_db" --format "{{.Status}}"
if ($null -eq $dbCheck -or $dbCheck -eq "") {
    Write-Host "Starting Postgres in Docker..." -ForegroundColor Gray
    Set-Location "$ROOT\docker"
    docker-compose up -d
    Set-Location $ROOT
    Start-Sleep -Seconds 3
} else {
    Write-Host "Database is already running." -ForegroundColor Green
}

# 2. Select Services
$AvailableServices = @(
    @{ name="api-gateway";          path="backend\api-gateway";         port=8080; core=$true },
    @{ name="auth-service";         path="backend\auth-service";        port=8081; core=$true },
    @{ name="room-service";         path="backend\room-service";        port=8082; core=$false },
    @{ name="tenant-service";        path="backend\tenant-service";       port=8083; core=$false },
    @{ name="payment-service";       path="backend\payment-service";      port=8084; core=$false },
    @{ name="notification-service";  path="backend\notification-service"; port=8087; core=$false },
    @{ name="report-service";        path="backend\report-service";       port=8088; core=$false },
    @{ name="maintenance-service";   path="backend\maintenance-service";  port=8089; core=$false }
)

Write-Host "`n[2/4] Choose Startup Mode:" -ForegroundColor Yellow
Write-Host " [0] Lean Mode (Consolidated API) - BEST FOR RAM"
Write-Host " [1] Core Only (Gateway + Auth + Frontend) - MINIMAL RAM"
Write-Host " [2] Selective (Pick specific services)"
Write-Host " [3] Full Suite (All 8 services) - HEAVY RAM"
$choice = Read-Host "Select (Default: 0)"
if ($null -eq $choice -or $choice -eq "") { $choice = "0" }

$SelectedServices = @()
if ($choice -eq "0") {
    $SelectedServices = @(@{ name="pg-manager-api"; path="backend\pg-manager-api"; port=8080 })
} elseif ($choice -eq "1") {
    $SelectedServices = $AvailableServices | Where-Object { $_.core -eq $true }
} elseif ($choice -eq "2") {
    foreach ($svc in $AvailableServices) {
        $start = Read-Host "Start $($svc.name)? (y/n)"
        if ($start -eq "y") { $SelectedServices += $svc }
    }
} else {
    $SelectedServices = $AvailableServices
}

# 3. Launch Backend
Write-Host "`n[3/4] Launching Selected Services..." -ForegroundColor Yellow
foreach ($svc in $SelectedServices) {
    Write-Host "Starting $($svc.name)..." -ForegroundColor Gray
    # Try to find JAR first for lower RAM usage, else use mvnw
    $jarPath = Get-ChildItem -Path "$ROOT\$($svc.path)\target" -Filter "*.jar" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
    
    if ($jarPath) {
        # RAM optimized JAR execution
        $cmd = "Set-Location `"$ROOT\$($svc.path)`"; `$env:JAVA_HOME='$JAVA_PATH'; java -Xmx192m -Xms64m -jar `"$jarPath`""
    } else {
        # Fallback to Maven (Heavier)
        $cmd = "Set-Location `"$ROOT\$($svc.path)`"; `$env:JAVA_HOME='$JAVA_PATH'; `$env:MAVEN_OPTS='-Xmx192m'; ./mvnw spring-boot:run"
    }
    
    $proc = Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle Minimized -PassThru
    $Processes += $proc
}

# 4. Launch Frontend
Write-Host "`n[4/4] Launching Frontend..." -ForegroundColor Yellow
$feProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location `"$ROOT\frontend`"; npm.cmd start" -WindowStyle Minimized -PassThru
$Processes += $feProc

Write-Host "`n======================================================" -ForegroundColor Green
Write-Host " RUNNING IN OPTIMIZED MODE" -ForegroundColor Green
Write-Host " - Services active: $($SelectedServices.Count)"
Write-Host " - Gateway: http://localhost:8080"
Write-Host " - Frontend: http://localhost:4200"
Write-Host "======================================================" -ForegroundColor Green
Write-Host "`nPress [ENTER] to stop everything and free up RAM." -ForegroundColor Red

Read-Host
foreach ($p in $Processes) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
Get-Process -Name "java", "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*pg-manager*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Cleanup complete." -ForegroundColor Cyan
