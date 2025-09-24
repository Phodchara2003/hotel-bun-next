:: Test Manager Navigation Fix
@echo off
echo.
echo ============================================
echo   Testing Manager Navigation Fix
echo ============================================
echo.
echo Changes made:
echo 1. Updated admin/dashboard to use permissions.js instead of roles.js
echo 2. Updated admin/bookings to use permissions.js
echo 3. Updated admin/rooms to use permissions.js  
echo 4. Updated admin/calendar to use permissions.js
echo 5. Updated admin/contact-settings to use permissions.js
echo.
echo Manager users available:
echo - manager@example.com / password: 123456
echo - mmoorrttff7232208@gmail.com / password: 123456
echo - test@hotel.com / password: 123456
echo.
echo Starting frontend development server...
echo.

cd /d "C:\Users\mmoor\OneDrive\Desktop\hotel-bun-next\frontend"

echo Press Ctrl+C to stop the server
echo.
echo Test Steps:
echo 1. Open browser to http://localhost:3000
echo 2. Login with: manager@example.com / 123456
echo 3. Click sidebar menu items (should navigate now!)
echo 4. Check that all navigation works properly
echo.

npm run dev