export interface PasswordResetConfirmationData {
    userName: string;
}

export interface EmailTemplate {
    subject: string;
    text: string;
    html: string;
}

export const passwordResetConfirmationTemplate = (
    data: PasswordResetConfirmationData
): EmailTemplate => {
    const currentYear = new Date().getFullYear();
    const timestamp = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        dateStyle: "long",
        timeStyle: "short",
    });
    const subject = "Password Reset Successful - BRAAAAAM";

    const text = `Hello ${data.userName},

Your password was successfully reset on ${timestamp}.

If you didn't make this change, please contact your organization administrator immediately.

You can now sign in with your new password.

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
        .success {
            background-color: #ECFDF5;
            border: 1px solid #6EE7B7;
            border-radius: 6px;
            padding: 10px 12px;
            margin: 28px 0;
            font-size: 14px;
            color: #065F46;
        }
        .success-icon {
            margin-right: 6px;
        }
        .timestamp {
            margin-top: 4px;
            font-size: 13px;
            color: #047857;
        }
        .security-note {
            font-weight: 500;
            color: #111827;
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
                <h2>✓ Password Reset Successful</h2>
            </div>
            <div class="content">
                <p>Hello ${data.userName},</p>

                <div class="success">
                    <span class="success-icon">✓</span> Your password was successfully reset.
                    <div class="timestamp">Changed on ${timestamp}</div>
                </div>

                <p>You can now sign in to your account with your new password.</p>

                <p class="security-note">If you didn't make this change, please contact your organization administrator immediately.</p>
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
