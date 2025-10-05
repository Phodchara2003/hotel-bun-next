# Email Configuration for Forgot Password Feature
# Add these to your .env.local file

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# For Gmail:
# 1. Enable 2-factor authentication
# 2. Generate App Password: https://support.google.com/accounts/answer/185833
# 3. Use the App Password as SMTP_PASS

# Alternative SMTP Services:
# - Outlook: smtp.live.com (port 587)
# - Yahoo: smtp.mail.yahoo.com (port 587)
# - Custom SMTP: your-smtp-server.com

# Base URL for reset links
NEXT_PUBLIC_BASE_URL=http://localhost:3002

# Backend URL
BACKEND_URL=http://localhost:3001