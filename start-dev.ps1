# PowerShell Development Startup Script
# Script สำหรับเริ่ม development servers พร้อม cleanup เมื่อกด Ctrl+C

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Hotel Booking Development Server" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to cleanup processes
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Shutting down servers..." -ForegroundColor Yellow
    
    # Kill Node.js processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "bun" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Kill processes on specific ports
    $ports = @(3001, 3002, 3003)
    foreach ($port in $ports) {
        $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($process) {
            Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Stopped process on port $port" -ForegroundColor Green
        }
    }
    
    Write-Host "✅ All servers stopped." -ForegroundColor Green
    exit
}

# Register Ctrl+C handler
[Console]::TreatControlCAsInput = $false
$Host.UI.RawUI.KeyAvailable = $false

try {
    # Cleanup existing processes
    Write-Host "🔄 Cleaning up existing processes..." -ForegroundColor Yellow
    Cleanup
    Start-Sleep -Seconds 1
    
    # Start backend server
    Write-Host "🚀 Starting Backend Server (Port 3003)..." -ForegroundColor Green
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node backend\customer-server.js
    }
    
    Start-Sleep -Seconds 3
    
    # Start frontend server  
    Write-Host "🚀 Starting Frontend Server (Port 3002)..." -ForegroundColor Green
    Write-Host "   Frontend URL: http://localhost:3002" -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop all servers" -ForegroundColor Yellow
    Write-Host ""
    
    Set-Location frontend
    
    # Start frontend with signal handling
    $process = Start-Process -FilePath "bun" -ArgumentList "run", "dev", "--", "-p", "3002" -NoNewWindow -PassThru
    
    # Wait for Ctrl+C
    while ($true) {
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true)
            if ($key.Key -eq "C" -and $key.Modifiers -eq "Control") {
                break
            }
        }
        Start-Sleep -Milliseconds 100
        
        # Check if process is still running
        if ($process.HasExited) {
            Write-Host "Frontend process exited" -ForegroundColor Red
            break
        }
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    Cleanup
}