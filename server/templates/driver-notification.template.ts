export interface DriverNotificationData {
    driverName: string;
    pickupAddress: string;
    dropoffAddress: string;
    pickupTime: string;
}

export interface EmailTemplate {
    subject: string;
    text: string;
    html: string;
}

export const driverNotificationTemplate = (data: DriverNotificationData): EmailTemplate => {
    const subject = "New Ride Notification - Action Required";

    const text = `Hello ${data.driverName},

You have been notified about a new ride opportunity!

Ride Details:
- Pickup: ${data.pickupAddress}
- Dropoff: ${data.dropoffAddress}
- Pickup Time: ${data.pickupTime}

Please log in to the system to view more details and accept this ride.

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
        .details {
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 20px;
            margin: 28px 0;
        }
        .details h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }
        .detail-row {
            margin: 12px 0;
        }
        .detail-label {
            font-weight: 500;
            color: #374151;
            display: inline-block;
            min-width: 100px;
        }
        .detail-value {
            color: #1F2937;
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
                <h2>New Ride Notification</h2>
            </div>
            <div class="content">
                <p>Hello ${data.driverName},</p>
                <p>You have been notified about a new ride opportunity!</p>

                <div class="details">
                    <h3>Ride Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Pickup:</span>
                        <span class="detail-value">${data.pickupAddress}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Dropoff:</span>
                        <span class="detail-value">${data.dropoffAddress}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Pickup Time:</span>
                        <span class="detail-value">${data.pickupTime}</span>
                    </div>
                </div>

                <p>Please log in to the system to view more details and accept this ride.</p>
                <p>Thank you,<br>BRAAAAAM Team</p>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;

    return { subject, text, html };
};
