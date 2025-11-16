import cron from "node-cron";
import { sendBulkDriverNotifications } from "./email.js";

// Initialize the email notification scheduler
// Runs on a configurable schedule to check if any orgs need to send emails
export const initializeScheduler = () => {
    // Get cron schedule from environment (default: every 15 minutes)
    const scheduleExpression = process.env.EMAIL_JOB_CRON || "*/15 * * * *";

    console.log(`Initializing email scheduler with cron: ${scheduleExpression}`);

    // Validate cron expression
    if (!cron.validate(scheduleExpression)) {
        console.error(`Invalid cron expression: ${scheduleExpression}`);
        throw new Error(`Invalid EMAIL_JOB_CRON expression: ${scheduleExpression}`);
    }

    // Schedule the job
    cron.schedule(scheduleExpression, async () => {
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] Running scheduled email job...`);

        try {
            await sendBulkDriverNotifications();
            console.log(`[${timestamp}] Scheduled email job completed successfully\n`);
        } catch (error) {
            console.error(`[${timestamp}] Scheduled email job failed:`, error);
            console.error(`\n`);
        }
    });

    console.log(`Email scheduler initialized and running`);
    console.log(`   Schedule: ${scheduleExpression}`);
    console.log(`   Timezone: ${process.env.CRON_TIMEZONE || "America/New_York"}`);
    console.log(`   Default close time: ${process.env.DEFAULT_ORG_CLOSE_TIME || "17:00"}`);
};
