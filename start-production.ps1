#!/usr/bin/env powershell
# Production Start Script for Hotel Booking System
# Frontend: Port 3680
# Backend: Port 5680

Write-Host "🏨 Starting Hotel Booking System in Production Mode" -ForegroundColor Green
Write-Host "Frontend Port: 3680" -ForegroundColor Yellow
Write-Host "Backend Port: 5680" -ForegroundColor Yellow

# Start Backend
Write-Host "`n🚀 Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\mmoor\OneDrive\Desktop\hotel-bun-next\backend'; bun run server.js"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend  
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\mmoor\OneDrive\Desktop\hotel-bun-next\frontend'; npm run start"

Write-Host "`n✅ Production servers are starting..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3680" -ForegroundColor White
Write-Host "Backend: http://localhost:5680" -ForegroundColor White
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")