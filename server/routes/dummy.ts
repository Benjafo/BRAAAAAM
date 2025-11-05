// import express, { Router } from "express";

// const router: Router = express.Router();

// type User = {
//     name: string
//     phoneNumber: string
//     email: string
//     address: string
//     city: string
//     zip: number
//     role: 'driver' | 'dispatcher' | 'admin'
// }

// type Client = {
//     name: string
//     phoneNumber: string
//     address: string
//     city: string
//     zip: number
//     status: 'active' | 'inactive'
// }

// type Ride = {
//     date: string
//     time: string
//     duration: number // duration in minutes
//     clientName: string
//     destinationAddress: string
//     dispatcherName: string
//     status: 'unassigned' | 'scheduled' | 'cancelled' | 'completed' | 'withdrawn'
// }

// type Role = {
//     name: string
// }

// type AuditLogEntry = {
//     user: string;
//     timestamp: string;
//     eventDetails: string;
// };

// type Location = {
//     name: string,
//     address: string,
//     city: string,
//     zip: number
// }

// type UnavailabilityBlock = {
//     id: number
//     startDate: string // e.g., '2025-10-15'
//     startTime: string // e.g., '08:30 AM'
//     endDate: string // e.g., '2025-10-15'
//     endTime: string // e.g., '05:30 PM'
//     reason?: string
//     recurring?: boolean
//     recurringPattern?: 'daily' | 'weekly' | 'monthly'
// }

// const USERS: User[] = [
//     { name: 'Smith, John', phoneNumber: '(555) 123-4567', email: 'john.smith@example.com', address: "105 Stark Street", city: "Rochester", zip: 14623, role: 'driver' },
//     { name: 'Johnson, Sarah', email: 'sarah.j@example.com', phoneNumber: '(555) 234-5678', address: '200 Main St', city: 'Rochester', zip: 14604, role: 'dispatcher' },
//     { name: 'Brown, Michael', email: 'mbrown@example.com', phoneNumber: '(555) 345-6789', address: '300 Oak Ave', city: 'Rochester', zip: 14605, role: 'admin' },
//     { name: 'Davis, Emily', email: 'emily.davis@example.com', phoneNumber: '(555) 456-7890', address: '400 Pine Rd', city: 'Rochester', zip: 14606, role: 'driver' },
//     { name: 'Wilson, James', email: 'j.wilson@example.com', phoneNumber: '(555) 567-8901', address: '500 Elm St', city: 'Rochester', zip: 14607, role: 'driver' },
//     { name: 'Martinez, Lisa', email: 'lisa.m@example.com', phoneNumber: '(555) 678-9012', address: '600 Maple Dr', city: 'Rochester', zip: 14608, role: 'dispatcher' },
//     { name: 'Taylor, Robert', email: 'rtaylor@example.com', phoneNumber: '(555) 789-0123', address: '700 Cedar Ln', city: 'Rochester', zip: 14609, role: 'admin' },
//     { name: 'Anderson, Jennifer', email: 'jennifer.a@example.com', phoneNumber: '(555) 890-1234', address: '800 Birch Way', city: 'Rochester', zip: 14610, role: 'driver' },
//     { name: 'Thomas, William', email: 'w.thomas@example.com', phoneNumber: '(555) 901-2345', address: '900 Spruce Ct', city: 'Rochester', zip: 14611, role: 'dispatcher' },
//     { name: 'Garcia, Maria', email: 'maria.garcia@example.com', phoneNumber: '(555) 012-3456', address: '1000 Walnut Pl', city: 'Rochester', zip: 14612, role: 'driver' },
//     { name: 'Lee, David', email: 'david.lee@example.com', phoneNumber: '(555) 123-4568', address: '1100 Ash Blvd', city: 'Rochester', zip: 14613, role: 'admin' },
//     { name: 'White, Jessica', email: 'jwhite@example.com', phoneNumber: '(555) 234-5679', address: '1200 Poplar Ave', city: 'Rochester', zip: 14614, role: 'driver' },
// ]

// const CLIENTS: Client[] = [
//     { name: 'Harris, Christopher', phoneNumber: '(585) 555-1000', address: '100 Corporate Dr', city: 'Rochester', zip: 14623, status: 'active' },
//     { name: 'Moore, Amanda', phoneNumber: '(585) 555-1001', address: '250 Innovation Way', city: 'Rochester', zip: 14604, status: 'active' },
//     { name: 'Clark, Daniel', phoneNumber: '(585) 555-1002', address: '500 Commerce St', city: 'Victor', zip: 14564, status: 'active' },
//     { name: 'Lewis, Michelle', phoneNumber: '(585) 555-1003', address: '750 Health Plaza', city: 'Rochester', zip: 14620, status: 'active' },
//     { name: 'Walker, Brandon', phoneNumber: '(585) 555-1004', address: '1200 River Rd', city: 'Greece', zip: 14626, status: 'inactive' },
//     { name: 'Hall, Nicole', phoneNumber: '(585) 555-1005', address: '300 Builder Ave', city: 'Rochester', zip: 14612, status: 'active' },
//     { name: 'Allen, Gregory', phoneNumber: '(585) 555-1006', address: '45 Main St', city: 'Pittsford', zip: 14534, status: 'active' },
//     { name: 'Young, Stephanie', phoneNumber: '(585) 555-1007', address: '600 Tech Park', city: 'Henrietta', zip: 14467, status: 'active' },
//     { name: 'King, Raymond', phoneNumber: '(585) 555-1008', address: '2500 County Line Rd', city: 'Rush', zip: 14543, status: 'active' },
//     { name: 'Wright, Patricia', phoneNumber: '(585) 555-1009', address: '800 Executive Blvd', city: 'Rochester', zip: 14623, status: 'inactive' },
//     { name: 'Scott, Kevin', phoneNumber: '(585) 555-1010', address: '150 Industrial Pkwy', city: 'Brockport', zip: 14420, status: 'active' },
//     { name: 'Green, Rebecca', phoneNumber: '(585) 555-1011', address: '1000 Lakeshore Dr', city: 'Webster', zip: 14580, status: 'active' },
//     { name: 'Baker, Timothy', phoneNumber: '(585) 555-1012', address: '425 Creative Ln', city: 'Rochester', zip: 14607, status: 'active' },
//     { name: 'Adams, Samantha', phoneNumber: '(585) 555-1013', address: '3000 Factory St', city: 'Rochester', zip: 14611, status: 'inactive' },
//     { name: 'Nelson, Richard', phoneNumber: '(585) 555-1014', address: '200 Wellness Way', city: 'Penfield', zip: 14526, status: 'active' },
//     { name: 'Carter, Elizabeth', phoneNumber: '(585) 555-1015', address: '900 Downtown Plaza', city: 'Rochester', zip: 14604, status: 'active' },
//     { name: 'Mitchell, Andrew', phoneNumber: '(585) 555-1016', address: '1500 Delivery Dr', city: 'Gates', zip: 14624, status: 'active' },
//     { name: 'Perez, Katherine', phoneNumber: '(585) 555-1017', address: '550 Finance Blvd', city: 'Rochester', zip: 14620, status: 'active' },
//     { name: 'Roberts, Jeffrey', phoneNumber: '(585) 555-1018', address: '2200 Construction Ave', city: 'Fairport', zip: 14450, status: 'inactive' },
//     { name: 'Turner, Rachel', phoneNumber: '(585) 555-1019', address: '4000 Server Farm Rd', city: 'Henrietta', zip: 14467, status: 'active' },
//     { name: 'Phillips, Matthew', phoneNumber: '(585) 555-1020', address: '700 Property Ln', city: 'Pittsford', zip: 14534, status: 'active' },
//     { name: 'Campbell, Victoria', phoneNumber: '(585) 555-1021', address: '1800 Box St', city: 'Churchville', zip: 14428, status: 'active' },
//     { name: 'Parker, Benjamin', phoneNumber: '(585) 555-1022', address: '350 Wealth Way', city: 'Rochester', zip: 14618, status: 'active' },
//     { name: 'Evans, Angela', phoneNumber: '(585) 555-1023', address: '5000 Showroom Rd', city: 'Greece', zip: 14626, status: 'inactive' },
//     { name: 'Edwards, Nathan', phoneNumber: '(585) 555-1024', address: '2800 Rental Plaza', city: 'Spencerport', zip: 14559, status: 'active' },
// ]

// const RIDES: Ride[] = [
//     // Monday, October 13, 2025 - 8 rides all at 11:00 AM (stress test for overlapping events)
//     { date: '2025-10-13', time: '11:00 AM', duration: 60, clientName: 'Harris, Christopher', destinationAddress: '1000 Medical Center Dr, Rochester NY 14623', dispatcherName: 'Johnson, Sarah', status: 'scheduled' },
//     { date: '2025-10-13', time: '11:00 AM', duration: 60, clientName: 'Moore, Amanda', destinationAddress: '500 Pharmacy Plaza, Rochester NY 14604', dispatcherName: 'Martinez, Lisa', status: 'scheduled' },
//     { date: '2025-10-13', time: '11:00 AM', duration: 90, clientName: 'Clark, Daniel', destinationAddress: '350 Lab Services Way, Victor NY 14564', dispatcherName: 'Thomas, William', status: 'scheduled' },
//     { date: '2025-10-13', time: '11:00 AM', duration: 120, clientName: 'Lewis, Michelle', destinationAddress: '2400 Hospital Rd, Rochester NY 14620', dispatcherName: 'Davis, Emily', status: 'unassigned' },
//     { date: '2025-10-13', time: '11:00 AM', duration: 180, clientName: 'Hall, Nicole', destinationAddress: '800 Dialysis Center, Rochester NY 14612', dispatcherName: 'Wilson, James', status: 'scheduled' },
//     { date: '2025-10-13', time: '11:00 AM', duration: 60, clientName: 'Allen, Gregory', destinationAddress: '150 Clinic Ave, Pittsford NY 14534', dispatcherName: 'Anderson, Jennifer', status: 'scheduled' },
//     { date: '2025-10-13', time: '11:00 AM', duration: 150, clientName: 'Young, Stephanie', destinationAddress: '900 Wellness Center, Henrietta NY 14467', dispatcherName: 'Garcia, Maria', status: 'scheduled' },
//     { date: '2025-10-13', time: '11:00 AM', duration: 30, clientName: 'King, Raymond', destinationAddress: '450 Specialist Office, Rush NY 14543', dispatcherName: 'White, Jessica', status: 'scheduled' },

//     // Tuesday, October 14, 2025 - 12 rides throughout the day
//     { date: '2025-10-14', time: '09:00 AM', duration: 60, clientName: 'Wright, Patricia', destinationAddress: '300 Morning Clinic, Rochester NY 14623', dispatcherName: 'Johnson, Sarah', status: 'scheduled' },
//     { date: '2025-10-14', time: '09:00 AM', duration: 90, clientName: 'Scott, Kevin', destinationAddress: '700 Therapy Center, Brockport NY 14420', dispatcherName: 'Thomas, William', status: 'scheduled' },
//     { date: '2025-10-14', time: '09:30 AM', duration: 60, clientName: 'Green, Rebecca', destinationAddress: '1200 Dental Clinic, Webster NY 14580', dispatcherName: 'Johnson, Sarah', status: 'scheduled' },
//     { date: '2025-10-14', time: '09:30 AM', duration: 45, clientName: 'Baker, Timothy', destinationAddress: '600 Eye Center, Rochester NY 14607', dispatcherName: 'Martinez, Lisa', status: 'scheduled' },
//     { date: '2025-10-14', time: '10:00 AM', duration: 120, clientName: 'Adams, Samantha', destinationAddress: '3000 Factory St Medical, Rochester NY 14611', dispatcherName: 'Davis, Emily', status: 'scheduled' },
//     { date: '2025-10-14', time: '11:00 AM', duration: 60, clientName: 'Nelson, Richard', destinationAddress: '200 Wellness Way, Penfield NY 14526', dispatcherName: 'Wilson, James', status: 'scheduled' },
//     { date: '2025-10-14', time: '12:00 PM', duration: 90, clientName: 'Carter, Elizabeth', destinationAddress: '900 Downtown Plaza Medical, Rochester NY 14604', dispatcherName: 'Anderson, Jennifer', status: 'scheduled' },
//     { date: '2025-10-14', time: '01:00 PM', duration: 60, clientName: 'Mitchell, Andrew', destinationAddress: '1500 Delivery Dr Clinic, Gates NY 14624', dispatcherName: 'Garcia, Maria', status: 'unassigned' },
//     { date: '2025-10-14', time: '02:00 PM', duration: 120, clientName: 'Perez, Katherine', destinationAddress: '550 Finance Blvd Medical, Rochester NY 14620', dispatcherName: 'White, Jessica', status: 'scheduled' },
//     { date: '2025-10-14', time: '02:00 PM', duration: 180, clientName: 'Roberts, Jeffrey', destinationAddress: '2200 Construction Ave Health, Fairport NY 14450', dispatcherName: 'Johnson, Sarah', status: 'scheduled' },
//     { date: '2025-10-14', time: '03:30 PM', duration: 90, clientName: 'Turner, Rachel', destinationAddress: '4000 Server Farm Rd Clinic, Henrietta NY 14467', dispatcherName: 'Martinez, Lisa', status: 'scheduled' },
//     { date: '2025-10-14', time: '04:00 PM', duration: 60, clientName: 'Phillips, Matthew', destinationAddress: '700 Property Ln Medical, Pittsford NY 14534', dispatcherName: 'Thomas, William', status: 'scheduled' },

//     // Wednesday - Friday rides (original schedule continues)
//     { date: '2025-10-15', time: '09:00 AM', duration: 90, clientName: 'Campbell, Victoria', destinationAddress: '1800 Box St Medical, Churchville NY 14428', dispatcherName: 'Johnson, Sarah', status: 'scheduled' },
//     { date: '2025-10-15', time: '10:00 AM', duration: 60, clientName: 'Parker, Benjamin', destinationAddress: '350 Wealth Way Clinic, Rochester NY 14618', dispatcherName: 'Martinez, Lisa', status: 'completed' },
//     { date: '2025-10-16', time: '09:15 AM', duration: 75, clientName: 'Evans, Angela', destinationAddress: '5000 Showroom Rd Medical, Greece NY 14626', dispatcherName: 'Thomas, William', status: 'scheduled' },
//     { date: '2025-10-16', time: '11:30 AM', duration: 120, clientName: 'Edwards, Nathan', destinationAddress: '2800 Rental Plaza Health, Spencerport NY 14559', dispatcherName: 'Johnson, Sarah', status: 'scheduled' },
//     { date: '2025-10-16', time: '02:00 PM', duration: 180, clientName: 'Harris, Christopher', destinationAddress: '800 Shopping Center, Rochester NY 14612', dispatcherName: 'Martinez, Lisa', status: 'unassigned' },
//     { date: '2025-10-17', time: '09:00 AM', duration: 60, clientName: 'Moore, Amanda', destinationAddress: '150 Clinic Ave, Pittsford NY 14534', dispatcherName: 'Thomas, William', status: 'scheduled' },
//     { date: '2025-10-17', time: '01:30 PM', duration: 90, clientName: 'Clark, Daniel', destinationAddress: '900 Wellness Center, Henrietta NY 14467', dispatcherName: 'Johnson, Sarah', status: 'unassigned' },
//     { date: '2025-10-18', time: '10:30 AM', duration: 45, clientName: 'Lewis, Michelle', destinationAddress: '450 Specialist Office, Rush NY 14543', dispatcherName: 'Martinez, Lisa', status: 'cancelled' },
//     { date: '2025-10-18', time: '03:00 PM', duration: 120, clientName: 'Hall, Nicole', destinationAddress: '700 Therapy Center, Brockport NY 14420', dispatcherName: 'Thomas, William', status: 'scheduled' },
//     { date: '2025-10-19', time: '09:00 AM', duration: 60, clientName: 'Allen, Gregory', destinationAddress: '1200 Dental Clinic, Webster NY 14580', dispatcherName: 'Johnson, Sarah', status: 'completed' },
//     { date: '2025-10-19', time: '11:00 AM', duration: 30, clientName: 'Young, Stephanie', destinationAddress: '600 Eye Center, Rochester NY 14607', dispatcherName: 'Martinez, Lisa', status: 'withdrawn' },
//     { date: '2025-10-20', time: '09:00 AM', duration: 90, clientName: 'King, Raymond', destinationAddress: '300 Physical Therapy, Penfield NY 14526', dispatcherName: 'Thomas, William', status: 'scheduled' },
//     { date: '2025-10-20', time: '02:30 PM', duration: 150, clientName: 'Wright, Patricia', destinationAddress: '1500 Urgent Care, Rochester NY 14604', dispatcherName: 'Johnson, Sarah', status: 'unassigned' },
//     { date: '2025-10-21', time: '10:15 AM', duration: 60, clientName: 'Scott, Kevin', destinationAddress: '2000 Senior Center, Gates NY 14624', dispatcherName: 'Martinez, Lisa', status: 'scheduled' },
//     { date: '2025-10-21', time: '01:00 PM', duration: 120, clientName: 'Green, Rebecca', destinationAddress: '850 Community Health, Rochester NY 14620', dispatcherName: 'Thomas, William', status: 'completed' },
// ]

// const ROLES: Role[] = [
//     {name: "Admin"},
//     {name: "Dispatcher"},
//     {name: "Driver"},
// ]

// const AUDIT_LOG: AuditLogEntry[] = [
//     { user: 'Brown, Michael ', timestamp: 'October 01, 2025 09:15 AM', eventDetails: 'Created org Webster Wasps' },
//     { user: 'Taylor, Robert ', timestamp: 'October 01, 2025 10:30 AM', eventDetails: 'Updated org settings for organization Webster Wasps' },
//     { user: 'Johnson, Sarah ', timestamp: 'October 02, 2025 08:45 AM', eventDetails: 'Created user Smith, John' },
//     { user: 'Martinez, Lisa ', timestamp: 'October 02, 2025 11:20 AM', eventDetails: 'Created client Harris, Christopher' },
//     { user: 'Brown, Michael ', timestamp: 'October 02, 2025 02:30 PM', eventDetails: 'Updated user Johnson, Sarah' },
//     { user: 'Thomas, William ', timestamp: 'October 03, 2025 09:00 AM', eventDetails: 'Created client Moore, Amanda' },
//     { user: 'Taylor, Robert ', timestamp: 'October 03, 2025 10:15 AM', eventDetails: 'Created ride for client Harris, Christopher' },
//     { user: 'Johnson, Sarah ', timestamp: 'October 03, 2025 01:45 PM', eventDetails: 'Updated client Clark, Daniel' },
//     { user: 'Lee, David ', timestamp: 'October 04, 2025 08:30 AM', eventDetails: 'Created user Davis, Emily' },
//     { user: 'Martinez, Lisa ', timestamp: 'October 04, 2025 11:00 AM', eventDetails: 'Created ride for client Moore, Amanda' },
//     { user: 'Brown, Michael ', timestamp: 'October 04, 2025 03:20 PM', eventDetails: 'Updated org settings for organization Webster Wasps' },
//     { user: 'Thomas, William ', timestamp: 'October 05, 2025 09:30 AM', eventDetails: 'Created client Lewis, Michelle' },
//     { user: 'Johnson, Sarah ', timestamp: 'October 05, 2025 12:00 PM', eventDetails: 'Updated ride for client Clark, Daniel' },
//     { user: 'Taylor, Robert ', timestamp: 'October 06, 2025 08:00 AM', eventDetails: 'Created user Wilson, James' },
//     { user: 'Lee, David ', timestamp: 'October 06, 2025 10:45 AM', eventDetails: 'Updated client Hall, Nicole' },
//     { user: 'Martinez, Lisa ', timestamp: 'October 06, 2025 02:15 PM', eventDetails: 'Created ride for client Lewis, Michelle' },
//     { user: 'Brown, Michael ', timestamp: 'October 07, 2025 09:20 AM', eventDetails: 'Created client Allen, Gregory' },
//     { user: 'Thomas, William ', timestamp: 'October 07, 2025 11:30 AM', eventDetails: 'Updated user Martinez, Lisa' },
//     { user: 'Johnson, Sarah ', timestamp: 'October 07, 2025 03:45 PM', eventDetails: 'Updated ride for client Allen, Gregory' },
//     { user: 'Taylor, Robert ', timestamp: 'October 08, 2025 08:50 AM', eventDetails: 'Created user Anderson, Jennifer' },
//     { user: 'Lee, David ', timestamp: 'October 08, 2025 10:30 AM', eventDetails: 'Created client Young, Stephanie' },
//     { user: 'Martinez, Lisa ', timestamp: 'October 08, 2025 01:00 PM', eventDetails: 'Created ride for client Young, Stephanie' },
//     { user: 'Brown, Michael ', timestamp: 'October 08, 2025 04:00 PM', eventDetails: 'Updated org Webster Wasps' },
//     { user: 'Thomas, William ', timestamp: 'October 09, 2025 09:10 AM', eventDetails: 'Updated client King, Raymond' },
//     { user: 'Johnson, Sarah ', timestamp: 'October 09, 2025 11:45 AM', eventDetails: 'Created ride for client King, Raymond' },
//     { user: 'Taylor, Robert ', timestamp: 'October 09, 2025 02:30 PM', eventDetails: 'Updated user Thomas, William' },
//     { user: 'Lee, David ', timestamp: 'October 10, 2025 08:25 AM', eventDetails: 'Created client Scott, Kevin' },
//     { user: 'Martinez, Lisa ', timestamp: 'October 10, 2025 10:50 AM', eventDetails: 'Updated ride for client Scott, Kevin' },
//     { user: 'Brown, Michael ', timestamp: 'October 10, 2025 03:15 PM', eventDetails: 'Updated org settings for organization Webster Wasps' },
//     { user: 'Johnson, Sarah ', timestamp: 'October 11, 2025 09:00 AM', eventDetails: 'Created ride for client Green, Rebecca' }
// ]

// const LOCATIONS: Location[] = [
//     { name: 'Strong Memorial Hospital', address: '601 Elmwood Ave', city: 'Rochester', zip: 14642 },
//     { name: 'Highland Hospital', address: '1000 South Ave', city: 'Rochester', zip: 14620 },
//     { name: 'Rochester General Hospital', address: '1425 Portland Ave', city: 'Rochester', zip: 14621 },
//     { name: 'Unity Hospital', address: '1555 Long Pond Rd', city: 'Greece', zip: 14626 },
//     { name: 'Wegmans Pittsford', address: '3195 Monroe Ave', city: 'Pittsford', zip: 14618 },
//     { name: 'Tops Friendly Markets', address: '1900 Empire Blvd', city: 'Webster', zip: 14580 },
//     { name: 'CVS Pharmacy Penfield', address: '1902 Penfield Rd', city: 'Penfield', zip: 14526 },
//     { name: 'Walgreens East Ave', address: '3349 East Ave', city: 'Rochester', zip: 14618 },
//     { name: 'RiteAid Victor', address: '825 Eastview Mall Dr', city: 'Victor', zip: 14564 },
//     { name: 'Marketplace Mall', address: '1 Miracle Mile Dr', city: 'Henrietta', zip: 14623 },
//     { name: 'Eastview Mall', address: '7979 Pittsford-Victor Rd', city: 'Victor', zip: 14564 },
//     { name: 'Greece Ridge Mall', address: '271 Greece Ridge Center Dr', city: 'Rochester', zip: 14626 },
//     { name: 'Senior Care of Rochester', address: '2180 Empire Blvd', city: 'Webster', zip: 14580 },
//     { name: 'St. John\'s Meadows Senior Living', address: '1355 Long Pond Rd', city: 'Rochester', zip: 14606 },
//     { name: 'UR Medicine Immediate Care Victor', address: '965 Route 96', city: 'Victor', zip: 14564 },
//     { name: 'Linden Oaks Family Medicine', address: '150 Linden Oaks', city: 'Rochester', zip: 14625 },
//     { name: 'Pluta Cancer Center', address: '95 White Spruce Blvd', city: 'Rochester', zip: 14623 },
//     { name: 'Rochester Dialysis Center', address: '2000 East Henrietta Rd', city: 'Henrietta', zip: 14623 },
//     { name: 'ProHealth Physical Therapy', address: '3140 Monroe Ave', city: 'Rochester', zip: 14618 },
//     { name: 'Webster Community Center', address: '1350 Chiyoda Dr', city: 'Webster', zip: 14580 },
//     { name: 'Greece Community Center', address: '2 Island Cottage Rd', city: 'Rochester', zip: 14612 },
//     { name: 'Fairport Village Landing', address: '1 North Main St', city: 'Fairport', zip: 14450 },
//     { name: 'Brockport Family Care', address: '6265 Brockport-Spencerport Rd', city: 'Brockport', zip: 14420 },
//     { name: 'Gates-Chili Senior Center', address: '3360 Union St', city: 'North Chili', zip: 14514 },
//     { name: 'Brighton Community Center', address: '220 Idlewood Rd', city: 'Rochester', zip: 14618 },
//     { name: 'Irondequoit Public Library', address: '1290 Titus Ave', city: 'Rochester', zip: 14617 },
//     { name: 'Honeoye Falls Village Hall', address: '1 East St', city: 'Honeoye Falls', zip: 14472 },
//     { name: 'Scottsville Free Library', address: '28 Main St', city: 'Scottsville', zip: 14546 },
//     { name: 'YMCA of Greater Rochester', address: '444 East Ave', city: 'Rochester', zip: 14607 },
//     { name: 'Jewish Community Center', address: '1200 Edgewood Ave', city: 'Rochester', zip: 14618 }
// ]

// const UNAVAILABILITY_BLOCKS: UnavailabilityBlock[] = [
//     {
//         id: 1,
//         startDate: '2025-10-20',
//         startTime: '09:00 AM',
//         endDate: '2025-10-20',
//         endTime: '12:00 PM',
//         reason: 'Doctor Appointment',
//         recurring: false,
//     },
//     {
//         id: 2,
//         startDate: '2025-10-22',
//         startTime: '02:00 PM',
//         endDate: '2025-10-22',
//         endTime: '05:00 PM',
//         reason: 'Personal',
//         recurring: false,
//     },
//     {
//         id: 3,
//         startDate: '2025-10-25',
//         startTime: '09:00 AM',
//         endDate: '2025-10-25',
//         endTime: '05:00 PM',
//         reason: 'Vacation',
//         recurring: false,
//     },
//     {
//         id: 4,
//         startDate: '2025-10-21',
//         startTime: '01:00 PM',
//         endDate: '2025-10-21',
//         endTime: '03:00 PM',
//         reason: 'Vehicle Maintenance',
//         recurring: false,
//     },
//     {
//         id: 5,
//         startDate: '2025-10-23',
//         startTime: '10:00 AM',
//         endDate: '2025-10-23',
//         endTime: '02:00 PM',
//         reason: 'Family Emergency',
//         recurring: false,
//     },
//     {
//         id: 6,
//         startDate: '2025-10-24',
//         startTime: '09:00 AM',
//         endDate: '2025-10-24',
//         endTime: '10:00 AM',
//         reason: 'Medical Appointment',
//         recurring: false,
//     },
//     {
//         id: 7,
//         startDate: '2025-10-26',
//         startTime: '09:00 AM',
//         endDate: '2025-10-28',
//         endTime: '05:00 PM',
//         reason: 'Out of Town',
//         recurring: false,
//     },
//     {
//         id: 8,
//         startDate: '2025-10-19',
//         startTime: '03:00 PM',
//         endDate: '2025-10-19',
//         endTime: '05:00 PM',
//         reason: 'Training Session',
//         recurring: true,
//         recurringPattern: 'weekly',
//     },
//     {
//         id: 9,
//         startDate: '2025-10-27',
//         startTime: '11:00 AM',
//         endDate: '2025-10-27',
//         endTime: '01:00 PM',
//         reason: 'Lunch Break',
//         recurring: true,
//         recurringPattern: 'daily',
//     },
//     {
//         id: 10,
//         startDate: '2025-10-29',
//         startTime: '08:00 AM',
//         endDate: '2025-10-29',
//         endTime: '12:00 PM',
//         reason: 'Court Appearance',
//         recurring: false,
//     },
// ]

// const mock = <T> (req, res, next, data) => {
//     try {
//         // Simulate network delay
//         setTimeout(() => {
//             let results = [...data]

//             // Apply search filter
//             const search = (req.query.search as string) || ''
//             if (search) {
//                 results = results.filter(record =>
//                     Object.values(record).some(value =>
//                         String(value).toLowerCase().includes(search.toLowerCase())
//                     )
//                 )
//             }

//             // Apply column filters (dynamic based on query params)
//             Object.entries(req.query).forEach(([key, value]) => {
//                 if (key !== 'page' && key !== 'pageSize' && key !== 'sortBy' && key !== 'sortDir' && key !== 'search' && value) {
//                     results = results.filter(record =>
//                         String(record[key as keyof T])
//                             .toLowerCase()
//                             .includes(String(value).toLowerCase())
//                     )
//                 }
//             })

//             // Apply sorting
//             const sortBy = req.query.sortBy as string
//             const sortDir = req.query.sortDir as 'asc' | 'desc' | undefined
//             if (sortBy && sortDir) {
//                 results = [...results].sort((a, b) => {
//                     const aVal = a[sortBy as keyof T]
//                     const bVal = b[sortBy as keyof T]

//                     if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
//                     if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
//                     return 0
//                 })
//             }

//             // Get total before pagination
//             const total = results.length

//             // Apply pagination
//             const page = parseInt(req.query.page as string || '0')
//             const pageSize = parseInt(req.query.pageSize as string || '10')
//             const start = page * pageSize
//             const paginatedResults = results.slice(start, start + pageSize)

//             res.json({
//                 data: paginatedResults,
//                 total
//             })
//         }, 300) // 300ms delay to simulate network
//     } catch (error) {
//         next(error)
//     }
// }

// router.get("/users", (req, res, next) => mock<User>(req, res, next, USERS));

// router.get("/clients", (req, res, next) => mock<Client>(req, res, next, CLIENTS));

// router.get("/rides", (req, res, next) => mock<Ride>(req, res, next, RIDES));

// router.get("/roles", (req, res, next) => mock<Role>(req, res, next, ROLES));

// router.get("/audit-log", (req, res, next) => mock<AuditLogEntry>(req, res, next, AUDIT_LOG));

// router.get("/locations", (req, res, next) => mock<Location>(req, res, next, LOCATIONS))

// router.get("/unavailability", (req, res, next) => mock<UnavailabilityBlock>(req, res, next, UNAVAILABILITY_BLOCKS))

// export default router;
