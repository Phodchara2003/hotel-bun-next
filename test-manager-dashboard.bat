:: Test Manager Dashboard
@echo off
echo.
echo ============================================
echo   Manager Dashboard Test
echo ============================================
echo.
echo New Manager Features:
echo - Dedicated /manager/dashboard for executives
echo - Auto-redirect for manager login
echo - Manager-specific sidebar navigation
echo - Executive analytics and reporting
echo.
echo Test Users:
echo - Manager: manager@example.com / 123456
echo - Admin: admin@hotel.com / 123456 (for comparison)
echo.
echo Starting development server...
echo.

cd /d "C:\Users\mmoor\OneDrive\Desktop\hotel-bun-next\frontend"

echo Expected Behavior:
echo 1. Manager login -> /manager/dashboard
echo 2. Admin login -> /admin/dashboard  
echo 3. Manager dashboard shows executive metrics
echo 4. Separate navigation for managers
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev