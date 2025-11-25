export interface RideInfo {
    appointmentId: string | null;
    clientName: string;
    pickupTime: string;
    pickupAddress: string;
    dropoffAddress: string;
    pickupMapsLink: string;
    dropoffMapsLink: string;
}

export interface DriverDailyDigestData {
    driverName: string;
    rides: RideInfo[];
}

export interface EmailTemplate {
    subject: string;
    text: string;
    html: string;
}

// Helper function to format date/time from "YYYY-MM-DD HH:MM" format
const formatDateTime = (input: string): string => {
    const [datePart, timePart] = input.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour24, minute] = timePart.split(":").map(Number);

    const ampm = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;

    const date = new Date(year, month - 1, day);
    const monthName = date.toLocaleString("en-US", { month: "long" });

    return `${monthName} ${day}, ${year} ${hour12}:${String(minute).padStart(2, "0")} ${ampm}`;
};

export const driverDailyDigestTemplate = (data: DriverDailyDigestData): EmailTemplate => {
    const rideCount = data.rides.length;
    const subject = `Daily Ride Notifications - ${rideCount} New Opportunit${rideCount === 1 ? "y" : "ies"}`;

    // Text version
    const text = `Hello ${data.driverName},

You have ${rideCount} new ride notification${rideCount === 1 ? "" : "s"}:

${data.rides
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
            margin: 0 0 8px 0;
            font-size: 22px;
            font-weight: 600;
            color: #111827;
        }
        .header p {
            margin: 0;
            font-size: 14px;
            color: #6B7280;
        }
        .content {
            padding: 32px;
            font-size: 15px;
        }
        .content > p {
            margin: 0 0 18px 0;
        }
        .ride-card {
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .ride-card h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }
        .ride-detail {
            margin: 12px 0;
        }
        .ride-detail strong {
            font-weight: 500;
            color: #374151;
            display: inline-block;
            min-width: 80px;
        }
        .maps-link {
            color: #22C55E;
            text-decoration: none;
        }
        .maps-link:hover {
            text-decoration: underline;
        }
        .placeholder-note {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #E5E7EB;
            color: #9CA3AF;
            font-size: 13px;
            font-style: italic;
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
                <h2>Daily Ride Notifications</h2>
                <p>${rideCount} New Opportunit${rideCount === 1 ? "y" : "ies"}</p>
            </div>
            <div class="content">
                <p>Hello ${data.driverName},</p>
                <p>You have been notified about ${rideCount} ride opportunit${rideCount === 1 ? "y" : "ies"}:</p>

                ${data.rides
                    .map(
                        (ride) => `
                <div class="ride-card">
                    <h3>${formatDateTime(ride.pickupTime)}</h3>
                    <div class="ride-detail">
                        <strong>Client:</strong> ${ride.clientName}
                    </div>
                    <div class="ride-detail">
                        <strong>Pickup:</strong> <a href="${ride.pickupMapsLink}" class="maps-link" target="_blank">${ride.pickupAddress}</a>
                    </div>
                    <div class="ride-detail">
                        <strong>Dropoff:</strong> <a href="${ride.dropoffMapsLink}" class="maps-link" target="_blank">${ride.dropoffAddress}</a>
                    </div>
                </div>
            `
                    )
                    .join("")}

                <p style="margin-top: 28px;">Please log in to the system to view full details and accept rides.</p>
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
