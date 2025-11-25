export interface PasswordResetData {
    userName: string;
    resetLink: string;
    expiresInMinutes: number;
}

export interface EmailTemplate {
    subject: string;
    text: string;
    html: string;
}

export const passwordResetTemplate = (data: PasswordResetData): EmailTemplate => {
    const currentYear = new Date().getFullYear();
    const subject = "Password Reset Request - BRAAAAAM";

    const text = `Hello ${data.userName},

We received a request to reset your password for your BRAAAAAM account.

Click the link below to reset your password:
${data.resetLink}

This link will expire in ${data.expiresInMinutes} minutes.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Thank you,
BRAAAAAM Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            color: #1F2937;
            margin: 0;
            padding: 0;
            background-color: #F9FAFB;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 32px 20px;
        }
        .card {
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 10px;
            overflow: hidden;
        }
        .header {
            background-color: #FFFFFF;
            padding: 32px 32px 28px 32px;
            border-bottom: 3px solid #E5E7EB;
        }
        .header h2 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            color: #111827;
        }
        .content {
            padding: 32px;
            font-size: 15px;
        }
        .content p {
            margin: 0 0 18px 0;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .button {
            background-color: #22C55E;
            color: white;
            padding: 14px 24px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            font-weight: 600;
            letter-spacing: 0.2px;
        }
        .button:hover {
            background-color: #16A34A;
        }
        .warning {
            background-color: #FEF9C3;
            border: 1px solid #FDE047;
            border-radius: 6px;
            padding: 10px 12px;
            margin: 28px 0;
            font-size: 14px;
            color: #854D0E;
        }
        .warning-icon {
            margin-right: 6px;
        }
        .security-note {
            font-weight: 500;
            color: #111827;
        }
        .link-fallback {
            font-size: 13px;
            color: #6B7280;
            margin-top: 28px;
            padding-top: 28px;
            border-top: 1px solid #E5E7EB;
        }
        .link-fallback a {
            color: #22C55E;
            word-break: break-all;
        }
        .footer {
            text-align: center;
            padding: 24px 20px;
            color: #6B7280;
            font-size: 13px;
        }
        .footer p {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <h2>Password Reset Request</h2>
            </div>
            <div class="content">
                <p>Hello ${data.userName},</p>
                <p>We received a request to reset your password for your BRAAAAAM account.</p>

                <div class="button-container">
                    <a href="${data.resetLink}" class="button">Reset Your Password</a>
                </div>

                <div class="warning">
                    <span class="warning-icon">⚠️</span> This link will expire in ${data.expiresInMinutes} minutes.
                </div>

                <p class="security-note">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>

                <div class="link-fallback">
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p><a href="${data.resetLink}">${data.resetLink}</a></p>
                </div>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>`;

    return { subject, text, html };
};
