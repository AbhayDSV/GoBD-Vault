# Email Verification Troubleshooting

## Common Issues & Solutions

### Issue 1: "Failed to send verification code"

**Cause**: Email service not configured in `.env` file

**Solution**: 
1. Open `/Users/fristineinfotech/Desktop/GoBD/backend/.env`
2. Add these lines:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM=GoBD Digital Vault
```

### Issue 2: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Cause**: Using regular Gmail password instead of App Password

**Solution**:
1. Go to Google Account: https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select "Mail" and your device
5. Copy the 16-character password (no spaces)
6. Use this in `EMAIL_PASSWORD` in `.env`

### Issue 3: "Unsupported email service"

**Cause**: EMAIL_SERVICE not set to 'gmail'

**Solution**: Set `EMAIL_SERVICE=gmail` in `.env`

### Issue 4: Email not received

**Possible causes**:
- Check spam/junk folder
- Verify email address is correct
- Check Gmail sent folder to confirm email was sent
- Wait a few minutes (sometimes delayed)

### Issue 5: "ECONNREFUSED" or connection errors

**Cause**: Firewall or network blocking SMTP

**Solution**:
- Check internet connection
- Try disabling VPN temporarily
- Check if port 587 or 465 is blocked

## Testing Email Configuration

After configuring `.env`, restart the backend:

```bash
cd /Users/fristineinfotech/Desktop/GoBD/backend
# Stop the current server (Ctrl+C)
npm run dev
```

Then try registration:
1. Go to Register tab
2. Enter name and email
3. Click "Send Verification Code"
4. Check backend terminal for errors
5. Check email inbox (and spam folder)

## Quick Test

You can test if email is working by checking the backend logs. When you click "Send Verification Code", you should see:

✅ **Success**: `Verification email sent: <message-id>`
❌ **Error**: Error message will show the specific problem

## Need Help?

If you're still having issues, share the error message from the backend terminal and I can help diagnose it!
