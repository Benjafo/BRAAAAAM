import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

/**
 * Initialize the email transporter with SMTP configuration
 */
export const initializeEmailTransporter = (): void => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.warn(
            "Email service not configured. Missing SMTP environment variables."
        );
        return;
    }

    transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: false, // Use TLS
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    // Verify connection configuration
    transporter.verify((error) => {
        if (error) {
            console.error("Email service configuration error:", error);
        } else {
            console.log("Email service is ready to send messages");
        }
    });
};

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

/**
 * Send an email using the configured SMTP transporter
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    if (!transporter) {
        console.error("Email transporter not initialized");
        return false;
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@example.com";
    const fromName = process.env.SMTP_FROM_NAME || "BRAAAAAM";

    try {
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.text,
        });

        console.log("Email sent successfully:", info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
};

interface RideDetails {
    pickupAddress: string;
    dropoffAddress: string;
    pickupTime: string;
}

/**
 * Send a ride notification email to a driver
 */
export const sendDriverNotificationEmail = async (
    driverEmail: string,
    driverName: string,
    rideDetails: RideDetails
): Promise<boolean> => {
    const subject = "New Ride Notification - Action Required";
    const text = `Hello ${driverName},

You have been notified about a new ride opportunity!

Ride Details:
- Pickup: ${rideDetails.pickupAddress}
- Dropoff: ${rideDetails.dropoffAddress}
- Pickup Time: ${rideDetails.pickupTime}

Please log in to the system to view more details and accept this ride.

Thank you,
BRAAAAAM Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Ride Notification</h2>
        </div>
        <div class="content">
            <p>Hello ${driverName},</p>
            <p>You have been notified about a new ride opportunity!</p>

            <div class="details">
                <h3>Ride Details:</h3>
                <p><strong>Pickup:</strong> ${rideDetails.pickupAddress}</p>
                <p><strong>Dropoff:</strong> ${rideDetails.dropoffAddress}</p>
                <p><strong>Pickup Time:</strong> ${rideDetails.pickupTime}</p>
            </div>

            <p>Please log in to the system to view more details and accept this ride.</p>
            <p>Thank you,<br>BRAAAAAM Team</p>
        </div>
        <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;

    return sendEmail({
        to: driverEmail,
        subject,
        text,
        html,
    });
};
