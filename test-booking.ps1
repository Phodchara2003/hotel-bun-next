$body = @{
    user_id = 4
    hotel_id = 1
    room_type_id = 2
    check_in_date = "2025-09-17"
    check_out_date = "2025-09-18"
    guests = 1
    guest_name = "Test User"
    guest_email = "user@hotel.com"
    guest_phone = "0812345678"
    total_price = 1800
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/bookings" -Method POST -Body $body -ContentType "application/json"