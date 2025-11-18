import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import {
    appointments,
    clients,
    locations,
    messageRecipients,
    messages,
    users,
} from "../drizzle/org/schema.js";
import { getOrCreateOrgDb } from "../drizzle/pool-manager.js";
import { getSysDb } from "../drizzle/sys-client.js";
import { organizations } from "../drizzle/sys/schema.js";

let transporter: Transporter | null = null;

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

interface RideDetails {
    pickupAddress: string;
    dropoffAddress: string;
    pickupTime: string;
}

// Types for driver aggregation
interface PendingMessage {
    messageId: string;
    subject: string | null;
    recipientId: string;
    driverEmail: string;
    driverFirstName: string;
    driverLastName: string;
    appointmentId: string | null;
    startDate: string | null;
    startTime: string | null;
    pickupAddress: string;
    dropoffAddress: string;
    clientFirstName: string | null;
    clientLastName: string | null;
}

interface DriverInfo {
    email: string;
    firstName: string;
    lastName: string;
    rides: Array<{
        appointmentId: string | null;
        clientName: string;
        pickupTime: string;
        pickupAddress: string;
        dropoffAddress: string;
    }>;
    messageIds: Set<string>;
}

/**
 * Initialize the email transporter with SMTP configuration
 */
export const initializeEmailTransporter = (): void => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.warn("Email service not configured. Missing SMTP environment variables.");
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

// Send an email using the configured SMTP transporter
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

// Send a ride notification email to a driver
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

// Get organization close time from environment variable
// TODO: implement and use actual org settings lookup from database
function getCloseTimeForOrg(_orgId: string): string {
    return process.env.DEFAULT_ORG_CLOSE_TIME || "17:00";
}

// Check if current time matches org close time in the configured timezone
function shouldSendForOrg(orgId: string): boolean {
    const closeTime = getCloseTimeForOrg(orgId);
    const timezone = process.env.CRON_TIMEZONE || "America/New_York";

    const now = new Date();
    const currentTime = now.toLocaleString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    // Check if today is a weekday (Monday = 1, Sunday = 0)
    const dayOfWeek = now.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    console.log(`[shouldSendForOrg] orgId: ${orgId}`);
    console.log(`[shouldSendForOrg] Close time: ${closeTime}, Current time: ${currentTime}`);
    console.log(`[shouldSendForOrg] Day of week: ${dayOfWeek}, Is weekday: ${isWeekday}`);
    console.log(
        `[shouldSendForOrg] Time match: ${currentTime === closeTime}, Final result: ${currentTime === closeTime}`
    );

    // Send at any time that matches regardless of day, orgs may have schedulws that include weekends
    return currentTime === closeTime;
}

// Process pending messages for a specific organization
async function processPendingMessagesForOrg(db: any, orgId: string): Promise<void> {
    console.log(`[processPendingMessagesForOrg] Processing org: ${orgId}`);

    // Check if it's time to send for this org
    if (!shouldSendForOrg(orgId)) {
        console.log(`[processPendingMessagesForOrg] Not time to send for org ${orgId}, skipping`);
        return; // Not time yet for this org
    }

    console.log(
        `[processPendingMessagesForOrg] Time check passed! Proceeding to fetch pending messages...`
    );

    // Get all pending email messages with normal priority (not immediate)
    // Immediate priority messages should be sent right away by a separate process
    const pickupLocations = alias(locations, "pickup_locations");
    const dropoffLocations = alias(locations, "dropoff_locations");

    const pendingMessages = await db
        .select({
            messageId: messages.id,
            subject: messages.subject,
            recipientId: messageRecipients.userId,
            driverEmail: users.email,
            driverFirstName: users.firstName,
            driverLastName: users.lastName,
            appointmentId: appointments.id,
            startDate: appointments.startDate,
            startTime: appointments.startTime,
            pickupAddress: sql<string>`CONCAT(
                ${pickupLocations.addressLine1}, ', ',
                ${pickupLocations.city}, ', ',
                ${pickupLocations.state}, ' ',
                ${pickupLocations.zip}
            )`,
            dropoffAddress: sql<string>`CONCAT(
                ${dropoffLocations.addressLine1}, ', ',
                ${dropoffLocations.city}, ', ',
                ${dropoffLocations.state}, ' ',
                ${dropoffLocations.zip}
            )`,
            clientFirstName: clients.firstName,
            clientLastName: clients.lastName,
        })
        .from(messages)
        .innerJoin(messageRecipients, eq(messages.id, messageRecipients.messageId))
        .innerJoin(users, eq(messageRecipients.userId, users.id))
        .leftJoin(appointments, eq(messages.appointmentId, appointments.id))
        .leftJoin(pickupLocations, eq(appointments.pickupLocation, pickupLocations.id))
        .leftJoin(dropoffLocations, eq(appointments.destinationLocation, dropoffLocations.id))
        .leftJoin(clients, eq(appointments.clientId, clients.id))
        .where(
            and(
                eq(messages.status, "pending"),
                eq(messages.messageType, "Email"),
                eq(messages.priority, "normal"),
                // Filter out rides that are already assigned
                isNull(appointments.driverId)
            )
        )
        .orderBy(messageRecipients.userId, appointments.startDate, appointments.startTime);

    console.log(
        `[processPendingMessagesForOrg] Found ${pendingMessages.length} pending message(s) matching criteria`
    );

    if (pendingMessages.length === 0) {
        console.log(`No pending messages to send for org ${orgId}`);
        return;
    }

    console.log(`Processing ${pendingMessages.length} pending message(s) for org ${orgId}`);

    // Group messages by driver
    const messagesByDriver = pendingMessages.reduce(
        (acc: Record<string, DriverInfo>, msg: PendingMessage) => {
            if (!acc[msg.recipientId]) {
                acc[msg.recipientId] = {
                    email: msg.driverEmail,
                    firstName: msg.driverFirstName,
                    lastName: msg.driverLastName,
                    rides: [],
                    messageIds: new Set(),
                };
            }
            acc[msg.recipientId].rides.push({
                appointmentId: msg.appointmentId,
                clientName:
                    msg.clientFirstName && msg.clientLastName
                        ? `${msg.clientFirstName} ${msg.clientLastName}`
                        : "Client",
                pickupTime: `${msg.startDate} ${msg.startTime}`,
                pickupAddress: msg.pickupAddress || "Not specified",
                dropoffAddress: msg.dropoffAddress || "Not specified",
            });
            acc[msg.recipientId].messageIds.add(msg.messageId);
            return acc;
        },
        {} as Record<string, DriverInfo>
    );

    // Send aggregated emails
    const sentMessageIds: string[] = [];
    const failedMessageIds: string[] = [];

    for (const [_driverId, driver] of Object.entries(messagesByDriver) as [string, DriverInfo][]) {
        try {
            const success = await sendAggregatedDriverEmail(
                driver.email,
                `${driver.firstName} ${driver.lastName}`,
                driver.rides
            );

            if (success) {
                sentMessageIds.push(...Array.from(driver.messageIds));
                console.log(`Email sent to ${driver.email} (${driver.rides.length} ride(s))`);
            } else {
                failedMessageIds.push(...Array.from(driver.messageIds));
                console.error(`Failed to send email to ${driver.email}`);
            }
        } catch (error) {
            failedMessageIds.push(...Array.from(driver.messageIds));
            console.error(`Error sending email to ${driver.email}:`, error);
        }
    }

    // Update message statuses
    if (sentMessageIds.length > 0) {
        await db
            .update(messages)
            .set({
                status: "sent",
                sentAt: new Date().toISOString(),
            })
            .where(inArray(messages.id, sentMessageIds));

        console.log(`Marked ${sentMessageIds.length} message(s) as sent`);
    }

    if (failedMessageIds.length > 0) {
        await db
            .update(messages)
            .set({ status: "failed" })
            .where(inArray(messages.id, failedMessageIds));

        console.log(`Marked ${failedMessageIds.length} message(s) as failed`);
    }
}

// Send aggregated email to a driver with all their ride notifications
async function sendAggregatedDriverEmail(
    email: string,
    name: string,
    rides: Array<{
        appointmentId: string | null;
        clientName: string;
        pickupTime: string;
        pickupAddress: string;
        dropoffAddress: string;
    }>
): Promise<boolean> {
    const subject = `Daily Ride Notifications - ${rides.length} New Opportunit${rides.length === 1 ? "y" : "ies"}`;

    // Build Google Maps links
    const ridesWithLinks = rides.map((ride) => ({
        ...ride,
        pickupMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.pickupAddress)}`,
        dropoffMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.dropoffAddress)}`,
    }));

    const formatDateTime = (input: string) => {
        const [datePart, timePart] = input.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour24, minute] = timePart.split(":").map(Number);

        const ampm = hour24 >= 12 ? "PM" : "AM";
        const hour12 = hour24 % 12 || 12;

        const date = new Date(year, month - 1, day);
        const monthName = date.toLocaleString("en-US", { month: "long" });

        return `${monthName} ${day}, ${year} ${hour12}:${String(minute).padStart(2, "0")} ${ampm}`;
    };

    // Text version
    const text = `Hello ${name},

You have ${rides.length} new ride notification${rides.length === 1 ? "" : "s"}:

${ridesWithLinks
    .map(
        (ride, i) => `${i + 1}. Ride on ${formatDateTime(ride.pickupTime)}
   Client: ${ride.clientName}
   Pickup: ${ride.pickupAddress}
   Pickup Maps: ${ride.pickupMapsLink}
   Dropoff: ${ride.dropoffAddress}
   Dropoff Maps: ${ride.dropoffMapsLink}

   [Placeholder: Accept Ride Link]`
    )
    .join("\n\n")}

Please log in to the system to view full details and accept rides.

Thank you,
BRAAAAAM Team`;

    // HTML version
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .ride-card { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; border-radius: 4px; }
        .ride-card h3 { margin-top: 0; color: #4CAF50; }
        .ride-detail { margin: 8px 0; }
        .ride-detail strong { display: inline-block; width: 80px; }
        .maps-link { color: #4CAF50; text-decoration: none; font-size: 0.9em; }
        .maps-link:hover { text-decoration: underline; }
        .accept-btn { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px; }
        .accept-btn:hover { background-color: #45a049; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Daily Ride Notifications</h2>
            <p>${rides.length} New Opportunit${rides.length === 1 ? "y" : "ies"}</p>
        </div>
        <div class="content">
            <p>Hello ${name},</p>
            <p>You have been notified about ${rides.length} ride opportunit${rides.length === 1 ? "y" : "ies"}:</p>

            ${ridesWithLinks
                .map(
                    (ride, i) => `
                <div class="ride-card">
                    <h3>${formatDateTime(ride.pickupTime)}</h3>
                    <div class="ride-detail"><strong>Client:</strong> ${ride.clientName}</div>
                    <div class="ride-detail">
                        <strong>Pickup:</strong> <a href="${ride.pickupMapsLink}" class="maps-link" target="_blank">${ride.pickupAddress}</a>
                    </div>
                    <div class="ride-detail">
                        <strong>Dropoff:</strong> <a href="${ride.dropoffMapsLink}" class="maps-link" target="_blank">${ride.dropoffAddress}</a>
                    </div>
                    <div style="margin-top: 10px; color: #666; font-style: italic;">
                        [Accept ride button here]
                    </div>
                </div>
            `
                )
                .join("")}

            <p style="margin-top: 20px;">Please log in to the system to view full details and accept rides.</p>
            <p>Thank you,<br>BRAAAAAM Team</p>
        </div>
        <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;

    return sendEmail({ to: email, subject, text, html });
}

// Main entry point for bulk driver notifications job, called by the scheduler
export async function sendBulkDriverNotifications(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Starting bulk driver notifications job...`);

    try {
        // Get all organizations from system DB
        const sysDb = getSysDb();
        const orgs = await sysDb.select().from(organizations);

        console.log(`Found ${orgs.length} organization(s) to process`);

        // Process each organization
        for (const org of orgs) {
            try {
                console.log(`Processing organization: ${org.subdomain}`);
                const orgDb = getOrCreateOrgDb(org.subdomain);
                await processPendingMessagesForOrg(orgDb, org.subdomain);
            } catch (error) {
                console.error(`Error processing org ${org.subdomain}:`, error);
                // Continue with next org even if one fails
            }
        }

        // Placeholder for audit logging
        // TODO: Add audit log entry when middleware is ready
        // await auditLog.create({
        //     action: "bulk_email_job_run",
        //     details: { timestamp: new Date().toISOString() }
        // });
    } catch (error) {
        console.error("Error in bulk driver notifications job:", error);
        throw error;
    }

    console.log(`[${new Date().toISOString()}] Bulk driver notifications job completed`);
}

// Send password reset email to a user
export const sendPasswordResetEmail = async (
    email: string,
    userName: string,
    resetLink: string,
    expiresInMinutes: number
): Promise<boolean> => {
    const currentYear = new Date().getFullYear();
    const subject = "Password Reset Request - BRAAAAAM";

    const text = `Hello ${userName},

We received a request to reset your password for your BRAAAAAM account.

Click the link below to reset your password:
${resetLink}

This link will expire in ${expiresInMinutes} minutes.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Thank you,
BRAAAAAM Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        .button:hover { background-color: #45a049; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password for your BRAAAAAM account.</p>

            <p style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">Reset Your Password</a>
            </p>

            <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in ${expiresInMinutes} minutes.
            </div>

            <p><strong>If you didn't request this password reset, you can safely ignore this email.</strong> Your password will remain unchanged.</p>

            <p style="font-size: 12px; color: #666;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                ${resetLink}
            </p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>© ${currentYear} BRAAAAAM. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    return sendEmail({ to: email, subject, text, html });
};

// Send password reset confirmation email to a user
export const sendPasswordResetConfirmationEmail = async (
    email: string,
    userName: string
): Promise<boolean> => {
    const currentYear = new Date().getFullYear();
    const timestamp = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        dateStyle: "long",
        timeStyle: "short",
    });
    const subject = "Password Reset Successful - BRAAAAAM";

    const text = `Hello ${userName},

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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 15px 0; }
        .warning { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>✓ Password Reset Successful</h2>
        </div>
        <div class="content">
            <p>Hello ${userName},</p>

            <div class="success">
                <p style="margin: 0;"><strong>Your password was successfully reset.</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Changed on ${timestamp}</p>
            </div>

            <p>You can now sign in to your account with your new password.</p>

            <div class="warning">
                <strong>⚠️ Security Alert:</strong> If you didn't make this change, please contact your organization administrator immediately.
            </div>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>© ${currentYear} BRAAAAAM. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    return sendEmail({ to: email, subject, text, html });
};

// Export for manual testing
export { processPendingMessagesForOrg };
