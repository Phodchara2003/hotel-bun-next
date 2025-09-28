# Simple PowerShell script to start both servers
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Hotel Booking Development Server" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend server
Write-Host "🚀 Starting Backend Server (Port 3001)..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\mmoor\OneDrive\Desktop\hotel-bun-next\backend"
    node simple-http-server.js
}

Start-Sleep -Seconds 3

# Start frontend server  
Write-Host "🚀 Starting Frontend Server (Port 3002)..." -ForegroundColor Green
Write-Host "   Backend URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Frontend URL: http://localhost:3002" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

Set-Location "c:\Users\mmoor\OneDrive\Desktop\hotel-bun-next\frontend"

try {
    # Start frontend
    npm run dev
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "🛑 Shutting down servers..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "✅ All servers stopped." -ForegroundColor Green
}