# Email Verification Setup Required

## Backend Email Configuration

Before the email verification feature will work, you need to configure your email service in the backend `.env` file.

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update `/Users/fristineinfotech/Desktop/GoBD/backend/.env`**:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=GoBD Digital Vault
   ```

### Option 2: Other Email Services

For SendGrid, Mailgun, or other services, update the `emailService.js` file accordingly.

## Testing

Once configured, restart the backend server:
```bash
cd backend
npm run dev
```

The email verification flow will then work:
1. User enters name & email
2. System sends 6-digit code to email
3. User verifies code
4. User creates password

## Next Steps

I'm now implementing the frontend multi-step registration form with:
- Step indicator
- OTP input (6 separate boxes)
- Password confirmation
- Countdown timer
- Resend code functionality
