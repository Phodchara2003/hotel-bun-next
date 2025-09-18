# Test login with different methods
Write-Host "=== Testing Login API ==="

# Test 1: Direct API call
Write-Host "`n1. Testing direct API call..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@hotel.com","password":"admin123"}'
    Write-Host "✅ Direct API Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "❌ Direct API failed: $($_.Exception.Message)"
}

# Test 2: Test with curl-like syntax
Write-Host "`n2. Testing with alternative credentials..."
try {
    $body = @{
        email = "admin@hotel.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Alternative test successful"
    Write-Host "Response: $($response | ConvertTo-Json)"
} catch {
    Write-Host "❌ Alternative test failed: $($_.Exception.Message)"
}

# Test 3: Check if admin user exists
Write-Host "`n3. Checking admin user in database..."
try {
    $users = Invoke-RestMethod -Uri "http://localhost:3001/api/admin/users" -Method GET
    $adminUser = $users.users | Where-Object { $_.email -eq "admin@hotel.com" }
    if ($adminUser) {
        Write-Host "✅ Admin user found: $($adminUser.email) - Role: $($adminUser.role)"
    } else {
        Write-Host "❌ Admin user not found"
    }
} catch {
    Write-Host "❌ Failed to check users: $($_.Exception.Message)"
}