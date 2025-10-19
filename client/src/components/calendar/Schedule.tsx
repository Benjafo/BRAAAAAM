/**
 * Schedule component - View all rides calendar
 * This component is used by admins and dispatchers to view and manage all rides
 */

import { useEffect, useState } from "react";
import type { SlotInfo } from "react-big-calendar";
import type { BusinessHoursConfig, CalendarEvent } from "../../types/rides";
import BaseCalendar from "./BaseCalendar";

// Type matching the API response
type RideFromAPI = {
    date: string; // e.g., '2025-10-15'
    time: string; // e.g., '08:30 AM'
    clientName: string;
    destinationAddress: string;
    dispatcherName: string;
    status: "unassigned" | "scheduled" | "cancelled" | "completed" | "withdrawn";
};

const API_RIDES_ENDPOINT = `http://localhost:3000/dummy/rides`;

// Transform API ride data to CalendarEvent format
// ai helped with this data transformation
const transformRidesToCalendarEvents = (rides: RideFromAPI[]): CalendarEvent[] => {
    return rides.map((ride, index) => {
        // Parse date and time
        const [year, month, day] = ride.date.split("-").map(Number);
        const [time, period] = ride.time.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        // Convert to 24-hour format
        if (period === "PM" && hours !== 12) {
            hours += 12;
        } else if (period === "AM" && hours === 12) {
            hours = 0;
        }

        const startDate = new Date(year, month - 1, day, hours, minutes);
        // Default to 1 hour duration for rides
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        // Extract driver name from dispatcher (if assigned)
        const driverName = ride.status === "unassigned" ? undefined : ride.dispatcherName;

        return {
            id: index + 1,
            title: ride.clientName,
            start: startDate,
            end: endDate,
            type: "ride",
            resource: {
                status: ride.status,
                clientName: ride.clientName,
                driverName: driverName,
                purpose: "Medical appointment", // Default purpose since API doesn't provide it
                details: `Ride to ${ride.destinationAddress.split(",")[0]}`,
                driver: driverName,
                location: ride.destinationAddress,
                dispatcherName: ride.dispatcherName,
            },
        };
    });
};

// Sample events data - in production, this would come from an API
// const sampleRides: CalendarEvent[] = [
//     // Monday, Oct 6 - Regular day
//     {
//         id: 1,
//         title: "Alice Johnson",
//         start: new Date(2025, 9, 6, 9, 0), // Oct 6, 2025, 9:00 AM
//         end: new Date(2025, 9, 6, 10, 0), // Oct 6, 2025, 10:00 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Alice Johnson",
//             driverName: "Driver A",
//             purpose: "Cardiology appointment",
//             details: "Cardiology appointment",
//             driver: "Driver A",
//             location: "123 Oak St to Heart Center",
//         },
//     },
//     {
//         id: 2,
//         title: "Bob Williams",
//         start: new Date(2025, 9, 6, 14, 0), // Oct 6, 2025, 2:00 PM
//         end: new Date(2025, 9, 6, 15, 30), // Oct 6, 2025, 3:30 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Bob Williams",
//             driverName: "Driver B",
//             purpose: "Physical therapy",
//             details: "Physical therapy",
//             driver: "Driver B",
//             location: "456 Pine Ave to Rehab Center",
//         },
//     },

//     // Tuesday, Oct 7 - 10 EVENTS DAY (with overlaps)
//     {
//         id: 3,
//         title: "Carol Davis",
//         start: new Date(2025, 9, 7, 9, 0), // Oct 7, 9:00 AM
//         end: new Date(2025, 9, 7, 10, 0), // Oct 7, 10:00 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Carol Davis",
//             driverName: "Driver A",
//             purpose: "Dialysis treatment",
//             details: "Dialysis treatment",
//             driver: "Driver A",
//             location: "789 Elm St to Dialysis Center",
//         },
//     },
//     {
//         id: 4,
//         title: "David Miller",
//         start: new Date(2025, 9, 7, 9, 30), // Oct 7, 9:30 AM (OVERLAPS with #3)
//         end: new Date(2025, 9, 7, 10, 30), // Oct 7, 10:30 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "David Miller",
//             driverName: "Driver B",
//             purpose: "X-ray appointment",
//             details: "X-ray appointment",
//             driver: "Driver B",
//             location: "321 Maple Dr to Imaging Center",
//         },
//     },
//     {
//         id: 5,
//         title: "Emma Thompson",
//         start: new Date(2025, 9, 7, 10, 0), // Oct 7, 10:00 AM (OVERLAPS with #4)
//         end: new Date(2025, 9, 7, 11, 30), // Oct 7, 11:30 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Emma Thompson",
//             driverName: "Driver C",
//             purpose: "Chemotherapy session",
//             details: "Chemotherapy session",
//             driver: "Driver C",
//             location: "654 Birch Ln to Cancer Center",
//         },
//     },
//     {
//         id: 6,
//         title: "Frank Garcia",
//         start: new Date(2025, 9, 7, 11, 0), // Oct 7, 11:00 AM (OVERLAPS with #5)
//         end: new Date(2025, 9, 7, 12, 0), // Oct 7, 12:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Frank Garcia",
//             driverName: "Driver D",
//             purpose: "Doctor consultation",
//             details: "Doctor consultation",
//             driver: "Driver D",
//             location: "987 Cedar Ave to Medical Plaza",
//         },
//     },
//     {
//         id: 7,
//         title: "Grace Lee",
//         start: new Date(2025, 9, 7, 12, 0), // Oct 7, 12:00 PM
//         end: new Date(2025, 9, 7, 13, 0), // Oct 7, 1:00 PM
//         type: "ride",
//         resource: {
//             status: "unassigned",
//             clientName: "Grace Lee",
//             purpose: "Blood work",
//             details: "Blood work",
//             location: "147 Spruce St to Lab Corp",
//         },
//     },
//     {
//         id: 8,
//         title: "Henry Brown",
//         start: new Date(2025, 9, 7, 13, 0), // Oct 7, 1:00 PM
//         end: new Date(2025, 9, 7, 14, 30), // Oct 7, 2:30 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Henry Brown",
//             driverName: "Driver E",
//             purpose: "MRI scan",
//             details: "MRI scan",
//             driver: "Driver E",
//             location: "258 Willow Way to Imaging Center",
//         },
//     },
//     {
//         id: 9,
//         title: "Iris Martinez",
//         start: new Date(2025, 9, 7, 14, 0), // Oct 7, 2:00 PM (OVERLAPS with #8)
//         end: new Date(2025, 9, 7, 15, 0), // Oct 7, 3:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Iris Martinez",
//             driverName: "Driver F",
//             purpose: "Wound care",
//             details: "Wound care",
//             driver: "Driver F",
//             location: "369 Palm Dr to Wound Care Center",
//         },
//     },
//     {
//         id: 10,
//         title: "Jack Wilson",
//         start: new Date(2025, 9, 7, 14, 30), // Oct 7, 2:30 PM (OVERLAPS with #9)
//         end: new Date(2025, 9, 7, 16, 0), // Oct 7, 4:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Jack Wilson",
//             driverName: "Driver G",
//             purpose: "Outpatient surgery",
//             details: "Outpatient surgery",
//             driver: "Driver G",
//             location: "741 Oak Ridge to Surgery Center",
//         },
//     },
//     {
//         id: 11,
//         title: "Karen Taylor",
//         start: new Date(2025, 9, 7, 15, 30), // Oct 7, 3:30 PM (OVERLAPS with #10)
//         end: new Date(2025, 9, 7, 16, 30), // Oct 7, 4:30 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Karen Taylor",
//             driverName: "Driver H",
//             purpose: "Eye exam",
//             details: "Eye exam",
//             driver: "Driver H",
//             location: "852 Pine Valley to Eye Care Center",
//         },
//     },
//     {
//         id: 12,
//         title: "Larry Anderson",
//         start: new Date(2025, 9, 7, 16, 0), // Oct 7, 4:00 PM (OVERLAPS with #11)
//         end: new Date(2025, 9, 7, 17, 0), // Oct 7, 5:00 PM
//         type: "ride",
//         resource: {
//             status: "unassigned",
//             clientName: "Larry Anderson",
//             purpose: "Pharmacy pickup",
//             details: "Pharmacy pickup",
//             location: "963 Meadow Ln to CVS Pharmacy",
//         },
//     },

//     // Thursday, Oct 2 - 8 EVENTS ALL AT 11AM
//     {
//         id: 100,
//         title: "Alex Thompson",
//         start: new Date(2025, 9, 2, 11, 0), // Oct 2, 11:00 AM
//         end: new Date(2025, 9, 2, 12, 0), // Oct 2, 12:00 PM (1 hour)
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Alex Thompson",
//             driverName: "Driver A",
//             purpose: "Routine checkup",
//             details: "Routine checkup",
//             driver: "Driver A",
//             location: "100 Main St to Medical Plaza",
//         },
//     },
//     {
//         id: 101,
//         title: "Bailey Rodriguez",
//         start: new Date(2025, 9, 2, 11, 0), // Oct 2, 11:00 AM (SAME START)
//         end: new Date(2025, 9, 2, 12, 0), // Oct 2, 12:00 PM (same end as #100)
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Bailey Rodriguez",
//             driverName: "Driver B",
//             purpose: "Lab work",
//             details: "Lab work",
//             driver: "Driver B",
//             location: "200 Oak Ave to Quest Lab",
//         },
//     },
//     {
//         id: 102,
//         title: "Cameron Lee",
//         start: new Date(2025, 9, 2, 11, 0), // Oct 2, 11:00 AM (SAME START)
//         end: new Date(2025, 9, 2, 12, 30), // Oct 2, 12:30 PM (1.5 hours)
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Cameron Lee",
//             driverName: "Driver C",
//             purpose: "Physical therapy",
//             details: "Physical therapy session",
//             driver: "Driver C",
//             location: "300 Pine St to Rehab Center",
//         },
//     },
//     {
//         id: 103,
//         title: "Dakota Johnson",
//         start: new Date(2025, 9, 2, 11, 0), // Oct 2, 11:00 AM (SAME START)
//         end: new Date(2025, 9, 2, 13, 0), // Oct 2, 1:00 PM (2 hours)
//         type: "ride",
//         resource: {
//             status: "unassigned",
//             clientName: "Dakota Johnson",
//             purpose: "Dialysis treatment",
//             details: "Dialysis treatment - 2 hours",
//             location: "400 Elm Rd to Dialysis Center",
//         },
//     },
//     {
//         id: 104,
//         title: "Emerson Smith",
//         start: new Date(2025, 9, 2, 11, 0), // Oct 2, 11:00 AM (SAME START)
//         end: new Date(2025, 9, 2, 12, 0), // Oct 2, 12:00 PM (same end as #100, #101)
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Emerson Smith",
//             driverName: "Driver D",
//             purpose: "Eye exam",
//             details: "Annual eye exam",
//             driver: "Driver D",
//             location: "500 Maple Dr to Eye Care Center",
//         },
//     },
//     {
//         id: 105,
//         title: "Finley Martinez",
//         start: new Date(2025, 9, 2, 11, 0), // Oct 2, 11:00 AM (SAME START)
//         end: new Date(2025, 9, 2, 14, 0), // Oct 2, 2:00 PM (3 hours)
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Finley Martinez",
//             driverName: "Driver E",
//             purpose: "Chemotherapy",
//             details: "Chemotherapy infusion - 3 hours",
//             driver: "Driver E",
//             location: "600 Cedar Ln to Cancer Center",
//         },
//     },
//     {
//         id: 107,
//         title: "Harper Davis",
//         start: new Date(2025, 9, 2, 11, 0), // Oct 2, 11:00 AM (SAME START)
//         end: new Date(2025, 9, 2, 15, 0), // Oct 2, 3:00 PM (4 hours - longest)
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Harper Davis",
//             driverName: "Driver G",
//             purpose: "Surgery prep & procedure",
//             details: "Outpatient surgery with prep",
//             driver: "Driver G",
//             location: "800 Willow Way to Surgery Center",
//         },
//     },
//     {
//         id: 106,
//         title: "Gray Wilson",
//         start: new Date(2025, 9, 2, 11, 0), // Oct 2, 11:00 AM (SAME START)
//         end: new Date(2025, 9, 2, 12, 30), // Oct 2, 12:30 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Gray Wilson",
//             driverName: "Driver F",
//             purpose: "Prescription pickup",
//             details: "Quick pharmacy pickup",
//             driver: "Driver F",
//             location: "700 Birch Ave to CVS Pharmacy",
//         },
//     },

//     // Wednesday, Oct 8 - Light day
//     {
//         id: 13,
//         title: "Monica White",
//         start: new Date(2025, 9, 8, 10, 0), // Oct 8, 10:00 AM
//         end: new Date(2025, 9, 8, 11, 0), // Oct 8, 11:00 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Monica White",
//             driverName: "Driver A",
//             purpose: "Follow-up appointment",
//             details: "Follow-up appointment",
//             driver: "Driver A",
//             location: "159 Forest Ln to Medical Center",
//         },
//     },
//     {
//         id: 14,
//         title: "Nathan Clark",
//         start: new Date(2025, 9, 8, 14, 0), // Oct 8, 2:00 PM
//         end: new Date(2025, 9, 8, 15, 0), // Oct 8, 3:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Nathan Clark",
//             driverName: "Driver B",
//             purpose: "Dental cleaning",
//             details: "Dental cleaning",
//             driver: "Driver B",
//             location: "753 River Rd to Dental Office",
//         },
//     },

//     // Thursday, Oct 9 - 6 EVENTS (5 starting at same time)
//     {
//         id: 15,
//         title: "Olivia Harris",
//         start: new Date(2025, 9, 9, 13, 0), // Oct 9, 1:00 PM (START TIME 1)
//         end: new Date(2025, 9, 9, 14, 0), // Oct 9, 2:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Olivia Harris",
//             driverName: "Driver A",
//             purpose: "Quick lab test",
//             details: "Quick lab test",
//             driver: "Driver A",
//             location: "951 Lake View to Quest Lab",
//         },
//     },
//     {
//         id: 16,
//         title: "Peter Robinson",
//         start: new Date(2025, 9, 9, 13, 0), // Oct 9, 1:00 PM (START TIME 2 - SAME)
//         end: new Date(2025, 9, 9, 14, 30), // Oct 9, 2:30 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Peter Robinson",
//             driverName: "Driver B",
//             purpose: "Physical exam",
//             details: "Physical exam",
//             driver: "Driver B",
//             location: "357 Valley Dr to Health Clinic",
//         },
//     },
//     {
//         id: 17,
//         title: "Quinn Adams",
//         start: new Date(2025, 9, 9, 13, 0), // Oct 9, 1:00 PM (START TIME 3 - SAME)
//         end: new Date(2025, 9, 9, 15, 0), // Oct 9, 3:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Quinn Adams",
//             driverName: "Driver C",
//             purpose: "Dialysis treatment",
//             details: "Dialysis treatment",
//             driver: "Driver C",
//             location: "468 Hillside Ln to Dialysis Center",
//         },
//     },
//     {
//         id: 18,
//         title: "Rachel Lewis",
//         start: new Date(2025, 9, 9, 13, 0), // Oct 9, 1:00 PM (START TIME 4 - SAME)
//         end: new Date(2025, 9, 9, 15, 30), // Oct 9, 3:30 PM
//         type: "ride",
//         resource: {
//             status: "unassigned",
//             clientName: "Rachel Lewis",
//             purpose: "Infusion therapy",
//             details: "Infusion therapy",
//             location: "579 Creek Rd to Infusion Center",
//         },
//     },
//     {
//         id: 19,
//         title: "Samuel King",
//         start: new Date(2025, 9, 9, 13, 0), // Oct 9, 1:00 PM (START TIME 5 - SAME)
//         end: new Date(2025, 9, 9, 16, 0), // Oct 9, 4:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Samuel King",
//             driverName: "Driver D",
//             purpose: "Chemotherapy session",
//             details: "Chemotherapy session",
//             driver: "Driver D",
//             location: "681 Park Ave to Cancer Center",
//         },
//     },
//     {
//         id: 20,
//         title: "Tina Wright",
//         start: new Date(2025, 9, 9, 10, 0), // Oct 9, 10:00 AM (Different time)
//         end: new Date(2025, 9, 9, 11, 0), // Oct 9, 11:00 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Tina Wright",
//             driverName: "Driver E",
//             purpose: "Vaccination",
//             details: "Vaccination",
//             driver: "Driver E",
//             location: "792 Garden St to Health Dept",
//         },
//     },

//     // Friday, Oct 10 - Moderate day
//     {
//         id: 21,
//         title: "Uma Patel",
//         start: new Date(2025, 9, 10, 9, 30), // Oct 10, 9:30 AM
//         end: new Date(2025, 9, 10, 10, 30), // Oct 10, 10:30 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Uma Patel",
//             driverName: "Driver A",
//             purpose: "Orthopedic consultation",
//             details: "Orthopedic consultation",
//             driver: "Driver A",
//             location: "135 Sunset Blvd to Orthopedic Center",
//         },
//     },
//     {
//         id: 22,
//         title: "Victor Chen",
//         start: new Date(2025, 9, 10, 11, 0), // Oct 10, 11:00 AM
//         end: new Date(2025, 9, 10, 12, 0), // Oct 10, 12:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Victor Chen",
//             driverName: "Driver B",
//             purpose: "Dermatology appointment",
//             details: "Dermatology appointment",
//             driver: "Driver B",
//             location: "246 Dawn Dr to Dermatology Clinic",
//         },
//     },
//     {
//         id: 23,
//         title: "Wendy Lopez",
//         start: new Date(2025, 9, 10, 14, 0), // Oct 10, 2:00 PM
//         end: new Date(2025, 9, 10, 15, 0), // Oct 10, 3:00 PM
//         type: "ride",
//         resource: {
//             status: "cancelled",
//             clientName: "Wendy Lopez",
//             purpose: "Cancelled - Patient request",
//             details: "Cancelled - Patient request",
//             location: "357 Spring St to Medical Plaza",
//         },
//     },

//     // ========================================
//     // MAIN TEST WEEK: October 13-17, 2025
//     // ========================================

//     // Monday, Oct 13
//     {
//         id: 24,
//         title: "Xavier Young",
//         start: new Date(2025, 9, 13, 9, 0), // Oct 13, 9:00 AM
//         end: new Date(2025, 9, 13, 10, 0), // Oct 13, 10:00 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             clientName: "Xavier Young",
//             driverName: "Driver A",
//             purpose: "Routine checkup",
//             details: "Routine checkup",
//             driver: "Driver A",
//             location: "456 Oak Ave to Medical Center",
//         },
//     },
//     {
//         id: 25,
//         title: "Yolanda Brown",
//         start: new Date(2025, 8, 25, 13, 0), // Sep 25, 2025, 1:00 PM
//         end: new Date(2025, 8, 25, 14, 0), // Sep 25, 2025, 2:00 PM
//         type: "ride",
//         resource: {
//             status: "cancelled",
//             details: "Patient cancelled",
//             location: "Airport pickup",
//         },
//     },
//     {
//         id: 4,
//         title: "Sarah Wilson",
//         start: new Date(2025, 8, 25, 15, 0), // Sep 25, 2025, 3:00 PM
//         end: new Date(2025, 8, 25, 16, 0), // Sep 25, 2025, 4:00 PM
//         type: "ride",
//         resource: {
//             status: "unassigned",
//             details: "Dialysis appointment",
//             location: "789 Pine St to Dialysis Center",
//         },
//     },
//     {
//         id: 5,
//         title: "Tom Brown",
//         start: new Date(2025, 8, 25, 9, 0), // Sep 25, 2025, 9:00 AM
//         end: new Date(2025, 8, 25, 13, 0), // Sep 25, 2025, 1:00 PM
//         type: "ride",
//         resource: {
//             status: "unassigned",
//             details: "Round trip - Surgery center",
//             location: "234 Elm St to Surgery Center and back",
//         },
//     },

//     // Tuesday rides
//     {
//         id: 6,
//         title: "Emily Davis",
//         start: new Date(2025, 8, 26, 11, 0), // Sep 26, 2025, 11:00 AM
//         end: new Date(2025, 8, 26, 12, 0), // Sep 26, 2025, 12:00 PM
//         type: "ride",
//         resource: {
//             status: "completed",
//             details: "Doctor appointment",
//             driver: "Driver C",
//             location: "567 Maple Dr to Medical Plaza",
//         },
//     },

//     // Wednesday rides
//     {
//         id: 7,
//         title: "Robert Miller",
//         start: new Date(2025, 8, 24, 11, 0), // Sep 24, 2025, 11:00 AM
//         end: new Date(2025, 8, 24, 12, 0), // Sep 24, 2025, 12:00 PM
//         type: "ride",
//         resource: {
//             status: "completed",
//             details: "Cardiology checkup",
//             driver: "Driver A",
//             location: "890 Cedar Ln to Heart Center",
//         },
//     },
//     {
//         id: 8,
//         title: "Linda Garcia",
//         start: new Date(2025, 8, 26, 15, 0), // Sep 26, 2025, 3:00 PM
//         end: new Date(2025, 8, 26, 17, 0), // Sep 26, 2025, 5:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Chemotherapy session",
//             driver: "Driver D",
//             location: "345 Birch St to Cancer Center",
//         },
//     },

//     // Thursday rides
//     {
//         id: 9,
//         title: "James Martinez",
//         start: new Date(2025, 8, 29, 12, 0), // Sep 29, 2025, 12:00 PM
//         end: new Date(2025, 8, 29, 15, 0), // Sep 29, 2025, 3:00 PM
//         type: "ride",
//         resource: {
//             status: "withdrawn",
//             details: "Driver unavailable",
//             location: "678 Spruce Ave to Specialist Clinic",
//         },
//     },

//     // Friday rides
//     {
//         id: 10,
//         title: "Patricia Anderson",
//         start: new Date(2025, 8, 29, 9, 0), // Sep 29, 2025, 9:00 AM
//         end: new Date(2025, 8, 29, 11, 0), // Sep 29, 2025, 11:00 AM
//         type: "ride",
//         resource: {
//             status: "withdrawn",
//             details: "Vehicle breakdown",
//             location: "901 Willow Way to Lab",
//         },
//     },
//     {
//         id: 11,
//         title: "David Taylor",
//         start: new Date(2025, 8, 29, 13, 0), // Sep 29, 2025, 1:00 PM
//         end: new Date(2025, 8, 29, 14, 0), // Sep 29, 2025, 2:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "X-ray appointment",
//             driver: "Driver E",
//             location: "234 Palm Dr to Imaging Center",
//         },
//     },
//     {
//         id: 12,
//         title: "Barbara Thomas",
//         start: new Date(2025, 8, 29, 16, 0), // Sep 29, 2025, 4:00 PM
//         end: new Date(2025, 8, 29, 17, 0), // Sep 29, 2025, 5:00 PM
//         type: "ride",
//         resource: {
//             status: "unassigned",
//             details: "Urgent care visit",
//             location: "567 Oak Ridge to Urgent Care",
//         },
//     },
//     {
//         id: 13,
//         title: "Christopher Jackson",
//         start: new Date(2025, 8, 30, 16, 0), // Sep 30, 2025, 4:00 PM
//         end: new Date(2025, 8, 30, 17, 0), // Sep 30, 2025, 5:00 PM
//         type: "ride",
//         resource: {
//             status: "unassigned",
//             details: "Pharmacy pickup",
//             location: "890 Pine Valley to CVS Pharmacy",
//         },
//     },

//     // October rides
//     {
//         id: 14,
//         title: "Michelle White",
//         start: new Date(2025, 9, 4, 16, 0), // Oct 4, 2025, 4:00 PM
//         end: new Date(2025, 9, 4, 17, 0), // Oct 4, 2025, 5:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Follow-up appointment",
//             driver: "Driver F",
//             location: "123 River Rd to Medical Center",
//         },
//     },
//     {
//         id: 15,
//         title: "Jennifer Harris",
//         start: new Date(2025, 9, 6, 13, 0), // Oct 6, 2025, 1:00 PM
//         end: new Date(2025, 9, 6, 17, 0), // Oct 6, 2025, 5:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Outpatient procedure",
//             driver: "Driver G",
//             location: "456 Lake View to Surgery Center",
//         },
//     },
//     {
//         id: 16,
//         title: "William Clark",
//         start: new Date(2025, 9, 13, 9, 0), // Oct 13, 2025, 9:00 AM
//         end: new Date(2025, 9, 13, 10, 0), // Oct 13, 2025, 10:00 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Blood work",
//             driver: "Driver H",
//             location: "789 Mountain Ave to Lab Corp",
//         },
//     },
//     {
//         id: 17,
//         title: "Susan Lewis",
//         start: new Date(2025, 9, 13, 11, 0), // Oct 13, 2025, 11:00 AM
//         end: new Date(2025, 9, 13, 12, 30), // Oct 13, 2025, 12:30 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Orthopedic consultation",
//             driver: "Driver A",
//             location: "234 Valley Dr to Orthopedic Center",
//         },
//     },
//     {
//         id: 18,
//         title: "Joseph Robinson",
//         start: new Date(2025, 9, 13, 13, 30), // Oct 13, 2025, 1:30 PM
//         end: new Date(2025, 9, 13, 14, 30), // Oct 13, 2025, 2:30 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Eye exam",
//             driver: "Driver B",
//             location: "567 Hillside Ln to Eye Care Center",
//         },
//     },
//     {
//         id: 19,
//         title: "Karen Walker",
//         start: new Date(2025, 9, 14, 14, 30), // Oct 14, 2025, 2:30 PM
//         end: new Date(2025, 9, 14, 15, 30), // Oct 14, 2025, 3:30 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Dental cleaning",
//             driver: "Driver C",
//             location: "890 Creek Rd to Dental Office",
//         },
//     },
//     {
//         id: 20,
//         title: "Nancy Hall",
//         start: new Date(2025, 9, 14, 15, 30), // Oct 14, 2025, 3:30 PM
//         end: new Date(2025, 9, 14, 17, 0), // Oct 14, 2025, 5:00 PM
//         type: "ride",
//         resource: {
//             status: "cancelled",
//             details: "Rescheduled by patient",
//             location: "123 Forest Ln to Wellness Center",
//         },
//     },
//     {
//         id: 21,
//         title: "Mark Allen",
//         start: new Date(2025, 9, 15, 10, 30), // Oct 15, 2025, 10:30 AM
//         end: new Date(2025, 9, 15, 11, 30), // Oct 15, 2025, 11:30 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Vaccination appointment",
//             driver: "Driver D",
//             location: "456 Park Ave to Health Dept",
//         },
//     },
//     {
//         id: 22,
//         title: "Betty Young",
//         start: new Date(2025, 9, 15, 15, 0), // Oct 15, 2025, 3:00 PM
//         end: new Date(2025, 9, 15, 17, 0), // Oct 15, 2025, 5:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Infusion therapy",
//             driver: "Driver E",
//             location: "789 Garden St to Infusion Center",
//         },
//     },
//     {
//         id: 23,
//         title: "Paul King",
//         start: new Date(2025, 9, 16, 12, 0), // Oct 16, 2025, 12:00 PM
//         end: new Date(2025, 9, 16, 14, 0), // Oct 16, 2025, 2:00 PM
//         type: "ride",
//         resource: {
//             status: "withdrawn",
//             details: "Driver called out sick",
//             location: "234 Sunset Blvd to Rehab Facility",
//         },
//     },
//     {
//         id: 24,
//         title: "Dorothy Wright",
//         start: new Date(2025, 9, 17, 9, 0), // Oct 17, 2025, 9:00 AM
//         end: new Date(2025, 9, 17, 10, 0), // Oct 17, 2025, 10:00 AM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "MRI scan",
//             driver: "Driver F",
//             location: "567 Dawn Dr to Imaging Center",
//         },
//     },
//     {
//         id: 25,
//         title: "Steven Lopez",
//         start: new Date(2025, 9, 17, 16, 0), // Oct 17, 2025, 4:00 PM
//         end: new Date(2025, 9, 17, 17, 0), // Oct 17, 2025, 5:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Wound care",
//             driver: "Driver G",
//             location: "890 Meadow Ln to Wound Care Center",
//         },
//     },
//     {
//         id: 26,
//         title: "Lisa Hill",
//         start: new Date(2025, 9, 18, 13, 0), // Oct 18, 2025, 1:00 PM
//         end: new Date(2025, 9, 18, 14, 0), // Oct 18, 2025, 2:00 PM
//         type: "ride",
//         resource: {
//             status: "scheduled",
//             details: "Dermatology appointment",
//             driver: "Driver H",
//             location: "123 Spring St to Dermatology Clinic",
//         },
//     },
// ];

// Standard 9-5 business hours configuration
const businessHours: BusinessHoursConfig = {
    monday: [{ start: "09:00", end: "17:00" }],
    tuesday: [{ start: "09:00", end: "17:00" }],
    wednesday: [{ start: "09:00", end: "17:00" }],
    thursday: [{ start: "09:00", end: "17:00" }],
    friday: [{ start: "09:00", end: "17:00" }],
    saturday: [], // Closed on Saturday
    sunday: [], // Closed on Sunday
};

export default function Schedule() {
    const [rides, setRides] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch rides from API
    useEffect(() => {
        const fetchRides = async () => {
            try {
                setLoading(true);

                // Fetch all rides without pagination for calendar view
                const response = await fetch(`${API_RIDES_ENDPOINT}?pageSize=1000`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch rides: ${response.status}`);
                }

                const data = await response.json();
                const transformedRides = transformRidesToCalendarEvents(data.data || []);
                setRides(transformedRides);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching rides:", err);
            }
        };

        fetchRides();
    }, []);

    // Handle ride selection
    const handleRideSelect = (event: CalendarEvent) => {
        console.log("Selected ride:", event);
        alert(`
            Ride Details:
            ID: ${event.id}
            Title: ${event.title}
            Status: ${event.resource?.status}
            Location: ${event.resource?.location}
            Details: ${event.resource?.details}
            Driver: ${event.resource?.driver || "Unassigned"}
        `);
    };

    // Handle slot selection
    const handleSlotSelect = (slotInfo: SlotInfo) => {
        console.log("Selected time slot:", slotInfo);
        const startTime = slotInfo.start.toLocaleTimeString();
        const endTime = slotInfo.end.toLocaleTimeString();
        alert(`Create new ride for:\nStart: ${startTime}\nEnd: ${endTime}`);
    };

    // Handle create ride button click
    const handleCreateRide = () => {
        console.log("Create Ride button clicked");
        alert("Create Ride modal would open here");
    };

    // Show loading state
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading rides...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <BaseCalendar
                events={rides}
                businessHours={businessHours}
                actionButton={{
                    label: "Create Ride",
                    onClick: handleCreateRide,
                }}
                onEventSelect={handleRideSelect}
                onSlotSelect={handleSlotSelect}
            />
        </div>
    );
}
