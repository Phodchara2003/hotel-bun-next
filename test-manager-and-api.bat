:: Test Script for Manager Role and API Optimization
@echo off
echo.
echo ============================================
echo   Testing Manager Role & API Optimization
echo ============================================
echo.
echo Starting development server...
echo.

cd /d "C:\Users\mmoor\OneDrive\Desktop\hotel-bun-next\frontend"
npm run dev

echo.
echo ============================================
echo   Test Instructions:
echo ============================================
echo.
echo 1. Open browser to http://localhost:3000
echo 2. Login with: manager@example.com / password: 123456
echo 3. Navigate between pages (Dashboard, Hotels, Rooms, etc.)
echo 4. Open browser console (F12)
echo 5. Type: showAPIStats()
echo 6. Check if /notifications/unread-count calls are reduced
echo.
echo Expected: Much fewer API calls than before (was 118)
echo.
pause