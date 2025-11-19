import { desc, eq, and, inArray, gte, lte, sql } from "drizzle-orm";
import { Request, Response } from "express";
import {
    appointments,
    clients,
    users,
    callLogs,
    volunteerRecords,
} from "../drizzle/org/schema.js";
import { hasPermission } from "../utils/permissions.js";

type ActivityType = 'client_created' | 'client_updated' | 'user_created' | 'user_updated' | 'call_log_created' | 'call_log_updated' | 'volunteer_record_created' | 'volunteer_record_updated';

interface Activity {
    id: string;
    type: ActivityType;
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

export const getDashboardData = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Check dashboard read permission
        const hasDashboardPermission = await hasPermission(userId, "dashboard.read", db);
        if (!hasDashboardPermission) {
            return res.status(403).json({ error: "Dashboard access denied" });
        }

        // Get current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startDate = startOfMonth.toISOString().split('T')[0];
        const endDate = endOfMonth.toISOString().split('T')[0];

        // Get ride stats for current month
        const rideStats = await db
            .select({
                status: appointments.status,
                count: sql<number>`count(*)::int`,
            })
            .from(appointments)
            .where(
                and(
                    inArray(appointments.status, ["Scheduled", "Unassigned", "Cancelled", "Completed"]),
                    gte(appointments.startDate, startDate),
                    lte(appointments.startDate, endDate)
                )
            )
            .groupBy(appointments.status);

        const stats = {
            scheduledRides: rideStats.find(s => s.status === "Scheduled")?.count || 0,
            unassignedRides: rideStats.find(s => s.status === "Unassigned")?.count || 0,
            cancelledRides: rideStats.find(s => s.status === "Cancelled")?.count || 0,
            completedRides: rideStats.find(s => s.status === "Completed")?.count || 0,
        };

        // Get upcoming rides (next 5 with Unassigned or Scheduled status)
        const today = new Date().toISOString().split('T')[0];
        const upcomingRides = await db
            .select({
                id: appointments.id,
                date: appointments.startDate,
                time: appointments.startTime,
                status: appointments.status,
                clientId: appointments.clientId,
                clientFirstName: clients.firstName,
                clientLastName: clients.lastName,
                driverId: appointments.driverId,
                driverFirstName: sql<string | null>`driver.first_name`,
                driverLastName: sql<string | null>`driver.last_name`,
                pickupAddressLine1: sql<string | null>`pickup.address_line_1`,
                destinationAddressLine1: sql<string | null>`destination.address_line_1`,
            })
            .from(appointments)
            .leftJoin(clients, eq(appointments.clientId, clients.id))
            .leftJoin(
                sql`users as driver`,
                eq(appointments.driverId, sql`driver.id`)
            )
            .leftJoin(
                sql`locations as pickup`,
                eq(appointments.pickupLocation, sql`pickup.id`)
            )
            .leftJoin(
                sql`locations as destination`,
                eq(appointments.destinationLocation, sql`destination.id`)
            )
            .where(
                and(
                    inArray(appointments.status, ["Unassigned", "Scheduled"]),
                    gte(appointments.startDate, today)
                )
            )
            .orderBy(appointments.startDate, appointments.startTime)
            .limit(5);

        // Get recent activity - combine multiple sources
        const activities: Activity[] = [];

        // Recent clients (created)
        const recentClientsCreated = await db
            .select({
                id: clients.id,
                firstName: clients.firstName,
                lastName: clients.lastName,
                createdAt: clients.createdAt,
            })
            .from(clients)
            .orderBy(desc(clients.createdAt))
            .limit(5);

        recentClientsCreated.forEach(client => {
            activities.push({
                id: client.id,
                type: 'client_created',
                description: `New client enrolled: ${client.firstName} ${client.lastName}`,
                timestamp: client.createdAt,
            });
        });

        // Recent clients (updated)
        const recentClientsUpdated = await db
            .select({
                id: clients.id,
                firstName: clients.firstName,
                lastName: clients.lastName,
                updatedAt: clients.updatedAt,
                createdAt: clients.createdAt,
            })
            .from(clients)
            .where(sql`${clients.updatedAt} > ${clients.createdAt}`)
            .orderBy(desc(clients.updatedAt))
            .limit(5);

        recentClientsUpdated.forEach(client => {
            activities.push({
                id: client.id,
                type: 'client_updated',
                description: `Client updated: ${client.firstName} ${client.lastName}`,
                timestamp: client.updatedAt,
            });
        });

        // Recent users (created)
        const recentUsersCreated = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                createdAt: users.createdAt,
            })
            .from(users)
            .orderBy(desc(users.createdAt))
            .limit(5);

        recentUsersCreated.forEach(user => {
            activities.push({
                id: user.id,
                type: 'user_created',
                description: `New user added: ${user.firstName} ${user.lastName}`,
                timestamp: user.createdAt,
            });
        });

        // Recent users (updated)
        const recentUsersUpdated = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                updatedAt: users.updatedAt,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(sql`${users.updatedAt} > ${users.createdAt}`)
            .orderBy(desc(users.updatedAt))
            .limit(5);

        recentUsersUpdated.forEach(user => {
            activities.push({
                id: user.id,
                type: 'user_updated',
                description: `User updated: ${user.firstName} ${user.lastName}`,
                timestamp: user.updatedAt,
            });
        });

        // Recent call logs (created)
        const recentCallLogsCreated = await db
            .select({
                id: callLogs.id,
                callType: callLogs.callType,
                phoneNumber: callLogs.phoneNumber,
                createdAt: callLogs.createdAt,
            })
            .from(callLogs)
            .orderBy(desc(callLogs.createdAt))
            .limit(5);

        recentCallLogsCreated.forEach(log => {
            activities.push({
                id: log.id,
                type: 'call_log_created',
                description: `Call log: ${log.callType}${log.phoneNumber ? ` from ${log.phoneNumber}` : ''}`,
                timestamp: log.createdAt,
            });
        });

        // Recent call logs (updated)
        const recentCallLogsUpdated = await db
            .select({
                id: callLogs.id,
                callType: callLogs.callType,
                phoneNumber: callLogs.phoneNumber,
                updatedAt: callLogs.updatedAt,
                createdAt: callLogs.createdAt,
            })
            .from(callLogs)
            .where(sql`${callLogs.updatedAt} > ${callLogs.createdAt}`)
            .orderBy(desc(callLogs.updatedAt))
            .limit(5);

        recentCallLogsUpdated.forEach(log => {
            activities.push({
                id: log.id,
                type: 'call_log_updated',
                description: `Call log updated: ${log.callType}${log.phoneNumber ? ` from ${log.phoneNumber}` : ''}`,
                timestamp: log.updatedAt,
            });
        });

        // Recent volunteer records (created)
        const recentVolunteerRecordsCreated = await db
            .select({
                id: volunteerRecords.id,
                userId: volunteerRecords.userId,
                userFirstName: users.firstName,
                userLastName: users.lastName,
                hours: volunteerRecords.hours,
                miles: volunteerRecords.miles,
                createdAt: volunteerRecords.createdAt,
            })
            .from(volunteerRecords)
            .leftJoin(users, eq(volunteerRecords.userId, users.id))
            .orderBy(desc(volunteerRecords.createdAt))
            .limit(5);

        recentVolunteerRecordsCreated.forEach(record => {
            const details = [];
            if (record.hours) details.push(`${record.hours} hours`);
            if (record.miles) details.push(`${record.miles} miles`);
            activities.push({
                id: record.id,
                type: 'volunteer_record_created',
                description: `Volunteer hours logged by ${record.userFirstName} ${record.userLastName}: ${details.join(', ')}`,
                timestamp: record.createdAt,
            });
        });

        // Recent volunteer records (updated)
        const recentVolunteerRecordsUpdated = await db
            .select({
                id: volunteerRecords.id,
                userId: volunteerRecords.userId,
                userFirstName: users.firstName,
                userLastName: users.lastName,
                hours: volunteerRecords.hours,
                miles: volunteerRecords.miles,
                updatedAt: volunteerRecords.updatedAt,
                createdAt: volunteerRecords.createdAt,
            })
            .from(volunteerRecords)
            .leftJoin(users, eq(volunteerRecords.userId, users.id))
            .where(sql`${volunteerRecords.updatedAt} > ${volunteerRecords.createdAt}`)
            .orderBy(desc(volunteerRecords.updatedAt))
            .limit(5);

        recentVolunteerRecordsUpdated.forEach(record => {
            const details = [];
            if (record.hours) details.push(`${record.hours} hours`);
            if (record.miles) details.push(`${record.miles} miles`);
            activities.push({
                id: record.id,
                type: 'volunteer_record_updated',
                description: `Volunteer record updated by ${record.userFirstName} ${record.userLastName}: ${details.join(', ')}`,
                timestamp: record.updatedAt,
            });
        });

        // Sort all activities by timestamp descending and take top 5
        const recentActivity = activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);

        return res.json({
            stats,
            recentActivity,
            upcomingRides,
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};
