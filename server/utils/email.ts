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
import { driverNotificationTemplate } from "../templates/driver-notification.template.js";
import { driverDailyDigestTemplate } from "../templates/driver-daily-digest.template.js";
import { passwordResetTemplate } from "../templates/password-reset.template.js";
import { passwordResetConfirmationTemplate } from "../templates/password-reset-confirmation.template.js";

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
    const { subject, text, html } = driverNotificationTemplate({
        driverName,
        pickupAddress: rideDetails.pickupAddress,
        dropoffAddress: rideDetails.dropoffAddress,
        pickupTime: rideDetails.pickupTime,
    });

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
    // Build Google Maps links
    const ridesWithLinks = rides.map((ride) => ({
        ...ride,
        pickupMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.pickupAddress)}`,
        dropoffMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.dropoffAddress)}`,
    }));

    const { subject, text, html } = driverDailyDigestTemplate({
        driverName: name,
        rides: ridesWithLinks,
    });

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
    const { subject, text, html } = passwordResetTemplate({
        userName,
        resetLink,
        expiresInMinutes,
    });

    return sendEmail({ to: email, subject, text, html });
};

// Send password reset confirmation email to a user
export const sendPasswordResetConfirmationEmail = async (
    email: string,
    userName: string
): Promise<boolean> => {
    const { subject, text, html } = passwordResetConfirmationTemplate({
        userName,
    });

    return sendEmail({ to: email, subject, text, html });
};

// Export for manual testing
export { processPendingMessagesForOrg };
