import nodemailer from 'nodemailer';

// Generate 6-digit random code
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create email transporter
const createTransporter = () => {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (emailService === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Add other services (SendGrid, Mailgun) here if needed
    throw new Error('Unsupported email service');
};

// Send verification email
export const sendVerificationEmail = async (email, name, code) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM || 'GoBD Digital Vault'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Email Verification Code - GoBD Digital Vault',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 10px 10px 0 0;
                        }
                        .content {
                            background: #f8fafc;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .code-box {
                            background: white;
                            border: 2px solid #3b82f6;
                            border-radius: 8px;
                            padding: 20px;
                            text-align: center;
                            margin: 20px 0;
                        }
                        .code {
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            color: #1e293b;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            color: #64748b;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>GoBD Digital Vault</h1>
                            <p>Email Verification</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${name}!</h2>
                            <p>Thank you for registering with GoBD Digital Vault. To complete your registration, please use the verification code below:</p>
                            
                            <div class="code-box">
                                <div class="code">${code}</div>
                            </div>
                            
                            <p><strong>This code will expire in 10 minutes.</strong></p>
                            
                            <p>If you didn't request this code, please ignore this email.</p>
                            
                            <div class="footer">
                                <p>GoBD Digital Vault - Compliant Document Archive System</p>
                                <p>This is an automated email. Please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};
