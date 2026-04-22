# PG Manager - Simple Control Center
Clear-Host
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   PG MANAGER - SIMPLE CONTROL CENTER" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$ROOT = Get-Location
$JAVA_PATH = "C:\Program Files\Java\jdk-21" # From your java -version
$env:JAVA_HOME = $JAVA_PATH

function Show-Menu {
    Write-Host "`nWhat do you want to do?" -ForegroundColor Yellow
    Write-Host " [1] First Time Setup (Build everything)"
    Write-Host " [2] Run All Services (Optimized - No hanging)"
    Write-Host " [3] Restart a Service (Use this after fixing a bug)"
    Write-Host " [Q] Quit"
    Write-Host ""
}

while($true) {
    Show-Menu
    $choice = Read-Host "Enter Choice"

    if ($choice -eq "1") {
        Write-Host "`nBuilding all services... This may take a few minutes." -ForegroundColor Cyan
        .\build-all.ps1
        Write-Host "Done! You can now use Option 2." -ForegroundColor Green
    }
    elseif ($choice -eq "2") {
        Write-Host "`nStarting everything in Lean Mode..." -ForegroundColor Cyan
        .\start-dev.ps1 # This runs Option 3 (Full Suite) by default now
    }
    elseif ($choice -eq "3") {
        $AvailableServices = Get-ChildItem -Path "$ROOT\backend" -Directory | Select-Object -ExpandProperty Name
        Write-Host "`nAvailable Services: " -ForegroundColor Gray
        $AvailableServices | ForEach-Object { Write-Host " - $_" -ForegroundColor Gray }
        
        $svcName = Read-Host "`nWhich service did you fix?"
        if (-not $svcName -or -not (Test-Path "$ROOT\backend\$svcName")) {
            Write-Host "Error: Service '$svcName' not found in backend/ directory." -ForegroundColor Red
            continue
        }

        Write-Host "`nRestarting $svcName..." -ForegroundColor Cyan
        
        # 1. Stop the old process
        Write-Host "Stopping existing $svcName processes..." -ForegroundColor Gray
        # Use Path check - most reliable on Windows for own JAR processes
        Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$svcName*" -or $_.CommandLine -like "*$svcName*" } | Stop-Process -Force -ErrorAction SilentlyContinue
        
        # 2. Rebuild
        Set-Location "$ROOT\backend\$svcName"
        Write-Host "Rebuilding $svcName..." -ForegroundColor Gray
        if (Test-Path "mvnw.cmd") {
            .\mvnw.cmd clean package -DskipTests
        } else {
            ./mvnw clean package -DskipTests
        }
        
        # 3. Start
        if ($LASTEXITCODE -eq 0) {
            $jar = Get-ChildItem -Path "target" -Filter "*.jar" | Where-Object { $_.Name -notlike "*.original" } | Select-Object -First 1 -ExpandProperty FullName
            if ($jar) {
                Write-Host "Starting $svcName..." -ForegroundColor Gray
                $runCmd = "`$env:JAVA_HOME='$JAVA_PATH'; java -Xmx192m -Xms64m -jar `"$jar`""
                Start-Process powershell -ArgumentList "-NoExit", "-Command", $runCmd -WindowStyle Minimized
                Write-Host "`n$svcName is back online!" -ForegroundColor Green
            } else {
                Write-Host "Error: Could not find JAR file in target/ directory." -ForegroundColor Red
            }
        } else {
            Write-Host "Error: Build failed for $svcName." -ForegroundColor Red
        }
        
        Set-Location $ROOT
    }
    elseif ($choice -eq "q") { break }
}
