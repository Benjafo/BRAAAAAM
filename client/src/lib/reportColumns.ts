export type ColumnDefinition = {
    key: string; // Field key (can use dot notation for nested: "address.city")
    label: string; // Display name in UI
    group: string; // Category grouping
    getValue?: (item: any) => string | number | null; // Optional custom accessor
};

// Define columns for each entity
export const CLIENT_COLUMNS: ColumnDefinition[] = [
    // Basic Information
    { key: "id", label: "Client ID", group: "Basic Information" },
    { key: "firstName", label: "First Name", group: "Basic Information" },
    { key: "lastName", label: "Last Name", group: "Basic Information" },
    { key: "email", label: "Email", group: "Contact Information" },
    { key: "phone", label: "Primary Phone", group: "Contact Information" },
    { key: "phoneIsCell", label: "Phone is Cell", group: "Contact Information" },
    { key: "secondaryPhone", label: "Secondary Phone", group: "Contact Information" },
    {
        key: "secondaryPhoneIsCell",
        label: "Secondary Phone is Cell",
        group: "Contact Information",
    },
    { key: "contactPreference", label: "Contact Preference", group: "Contact Information" },
    { key: "allowMessages", label: "Allow Messages", group: "Contact Information" },
    // Address fields (joined from locations table)
    { key: "address.addressLine1", label: "Address Line 1", group: "Address" },
    { key: "address.addressLine2", label: "Address Line 2", group: "Address" },
    { key: "address.city", label: "City", group: "Address" },
    { key: "address.state", label: "State", group: "Address" },
    { key: "address.zip", label: "ZIP Code", group: "Address" },
    { key: "address.country", label: "Country", group: "Address" },
    // Demographics
    { key: "gender", label: "Gender", group: "Demographics" },
    { key: "birthYear", label: "Birth Year", group: "Demographics" },
    { key: "birthMonth", label: "Birth Month", group: "Demographics" },
    { key: "livesAlone", label: "Lives Alone", group: "Demographics" },
    // Emergency Contact
    { key: "emergencyContactName", label: "Emergency Contact Name", group: "Emergency Contact" },
    {
        key: "emergencyContactPhone",
        label: "Emergency Contact Phone",
        group: "Emergency Contact",
    },
    {
        key: "emergencyContactRelationship",
        label: "Emergency Contact Relationship",
        group: "Emergency Contact",
    },
    // Additional
    { key: "notes", label: "Notes", group: "Additional" },
    { key: "pickupInstructions", label: "Pickup Instructions", group: "Additional" },
    {
        key: "mobilityEquipment",
        label: "Mobility Equipment",
        group: "Accessibility",
        getValue: (item) => item.mobilityEquipment?.join(", ") || "",
    },
    { key: "mobilityEquipmentOther", label: "Mobility Equipment (Other)", group: "Accessibility" },
    {
        key: "vehicleTypes",
        label: "Acceptable Vehicle Types",
        group: "Accessibility",
        getValue: (item) => item.vehicleTypes?.join(", ") || "",
    },
    { key: "hasOxygen", label: "Has Oxygen", group: "Accessibility" },
    { key: "hasServiceAnimal", label: "Has Service Animal", group: "Accessibility" },
    {
        key: "serviceAnimalDescription",
        label: "Service Animal Description",
        group: "Accessibility",
    },
    {
        key: "otherLimitations",
        label: "Other Limitations",
        group: "Accessibility",
        getValue: (item) => item.otherLimitations?.join(", ") || "",
    },
    { key: "otherLimitationsOther", label: "Other Limitations (Other)", group: "Accessibility" },
    { key: "isActive", label: "Active Status", group: "Status" },
    { key: "createdAt", label: "Created Date", group: "Metadata" },
    { key: "updatedAt", label: "Updated Date", group: "Metadata" },
];

export const USER_COLUMNS: ColumnDefinition[] = [
    // Basic Information
    { key: "id", label: "User ID", group: "Basic Information" },
    { key: "firstName", label: "First Name", group: "Basic Information" },
    { key: "lastName", label: "Last Name", group: "Basic Information" },
    { key: "email", label: "Email", group: "Contact Information" },
    { key: "phone", label: "Phone", group: "Contact Information" },
    { key: "contactPreference", label: "Contact Preference", group: "Contact Information" },
    // Role information
    { key: "role.name", label: "Role", group: "Role & Permissions" },
    { key: "isDriver", label: "Is Driver", group: "Role & Permissions" },
    // Address
    { key: "address.addressLine1", label: "Address Line 1", group: "Address" },
    { key: "address.addressLine2", label: "Address Line 2", group: "Address" },
    { key: "address.city", label: "City", group: "Address" },
    { key: "address.state", label: "State", group: "Address" },
    { key: "address.zip", label: "ZIP Code", group: "Address" },
    { key: "address.country", label: "Country", group: "Address" },
    // Demographics
    { key: "birthYear", label: "Birth Year", group: "Demographics" },
    { key: "birthMonth", label: "Birth Month", group: "Demographics" },
    // Emergency Contact
    { key: "emergencyContactName", label: "Emergency Contact Name", group: "Emergency Contact" },
    {
        key: "emergencyContactPhone",
        label: "Emergency Contact Phone",
        group: "Emergency Contact",
    },

    // Acessibility

    {
        key: "vehicleTypes",
        label: "Vehicle Types",
        group: "Accessibility",
        getValue: (item) => item.vehicleTypes?.join(", ") || "",
    },
    { key: "vehicleColor", label: "Vehicle Color", group: "Accessibility" },
    {
        key: "maxRidesPerWeek",
        label: "Max Rides per Week",
        group: "Accessibility",
    },
    { key: "townPreferences", label: "Town Preferences", group: "Accessibility" },
    {
        key: "destinationLimitations",
        label: "Destination Limitations",
        group: "Accessibility",
    },
    { key: "lifespanReimbursement", label: "Lifespan Reimbursement", group: "Accessibility" },
    {
        key: "canAccommodateMobilityEquipment",
        label: "Can Accommodate Mobility Equipment",
        group: "Accessibility",
        getValue: (item) => item.canAccommodateMobilityEquipment?.join(", ") || "",
    },
    { key: "canAccommodateOxygen", label: "Can Accommodate Oxygen", group: "Accessibility" },
    {
        key: "canAccommodateServiceAnimal",
        label: "Can Accommodate Service Animal",
        group: "Accessibility",
    },
    {
        key: "canAccommodateAdditionalRider",
        label: "Can Accommodate Additional Rider",
        group: "Accessibility",
    },
    {
        key: "emergencyContactRelationship",
        label: "Emergency Contact Relationship",
        group: "Emergency Contact",
    },
    // Status
    { key: "isActive", label: "Active Status", group: "Status" },
    { key: "createdAt", label: "Created Date", group: "Metadata" },
    { key: "updatedAt", label: "Updated Date", group: "Metadata" },
];

export const VOLUNTEER_RECORDS_COLUMNS: ColumnDefinition[] = [
    // Basic Information
    { key: "id", label: "Record ID", group: "Basic Information" },
    { key: "date", label: "Date", group: "Basic Information" },
    { key: "hours", label: "Hours", group: "Basic Information" },
    { key: "miles", label: "Miles", group: "Basic Information" },
    { key: "description", label: "Description", group: "Basic Information" },
    // Volunteer Information
    { key: "volunteer.firstName", label: "Volunteer First Name", group: "Volunteer" },
    { key: "volunteer.lastName", label: "Volunteer Last Name", group: "Volunteer" },
    { key: "volunteer.email", label: "Volunteer Email", group: "Volunteer" },
    // Metadata
    { key: "createdAt", label: "Submitted At", group: "Metadata" },
    { key: "updatedAt", label: "Updated At", group: "Metadata" },
];

export const APPOINTMENT_COLUMNS: ColumnDefinition[] = [
    // Basic Information
    { key: "id", label: "Appointment ID", group: "Basic Information" },
    { key: "status", label: "Status", group: "Basic Information" },
    { key: "startDate", label: "Ride Date", group: "Schedule" },
    { key: "startTime", label: "Ride Time", group: "Schedule" },
    { key: "estimatedDurationMinutes", label: "Duration (minutes)", group: "Schedule" },
    { key: "tripType", label: "Trip Type", group: "Trip Details" },
    { key: "tripPurpose", label: "Trip Purpose", group: "Trip Details" },
    // Client Information
    { key: "client.firstName", label: "Client First Name", group: "Client" },
    { key: "client.lastName", label: "Client Last Name", group: "Client" },
    { key: "client.phone", label: "Client Phone", group: "Client" },
    // Driver Information
    { key: "driver.firstName", label: "Driver First Name", group: "Driver" },
    { key: "driver.lastName", label: "Driver Last Name", group: "Driver" },
    { key: "driver.phone", label: "Driver Phone", group: "Driver" },
    // Dispatcher Information
    { key: "dispatcher.firstName", label: "Dispatcher First Name", group: "Dispatcher" },
    { key: "dispatcher.lastName", label: "Dispatcher Last Name", group: "Dispatcher" },
    // Pickup Location
    { key: "pickupLocation.addressLine1", label: "Pickup Address", group: "Pickup Location" },
    {
        key: "pickupLocation.addressLine2",
        label: "Pickup Address Line 2",
        group: "Pickup Location",
    },
    { key: "pickupLocation.city", label: "Pickup City", group: "Pickup Location" },
    { key: "pickupLocation.state", label: "Pickup State", group: "Pickup Location" },
    { key: "pickupLocation.zip", label: "Pickup ZIP", group: "Pickup Location" },
    // Destination Location
    {
        key: "destinationLocation.addressLine1",
        label: "Destination Address",
        group: "Destination Location",
    },
    {
        key: "destinationLocation.addressLine2",
        label: "Destination Address Line 2",
        group: "Destination Location",
    },
    { key: "destinationLocation.city", label: "Destination City", group: "Destination Location" },
    {
        key: "destinationLocation.state",
        label: "Destination State",
        group: "Destination Location",
    },

    // Additional Rider Information
    {
        key: "hasAdditionalRider",
        label: "Has Additional Rider",
        group: "Additional Rider",
    },
    {
        key: "additionalRiderFirstName",
        label: "Additional Rider First Name",
        group: "Additional Rider",
    },
    {
        key: "additionalRiderLastName",
        label: "Additional Rider Last Name",
        group: "Additional Rider",
    },
    {
        key: "relationshipToClient",
        label: "Relationship to Client",
        group: "Additional Rider",
    },
    { key: "destinationLocation.zip", label: "Destination ZIP", group: "Destination Location" },
    // Financial
    { key: "donationType", label: "Donation Type", group: "Financial" },
    { key: "donationAmount", label: "Donation Amount", group: "Financial" },
    { key: "milesDriven", label: "Miles Driven", group: "Financial" },
    // Additional
    { key: "notes", label: "Notes", group: "Additional" },
    { key: "createdAt", label: "Created Date", group: "Metadata" },
    { key: "updatedAt", label: "Updated Date", group: "Metadata" },
];

// Helper function to get columns for entity type
export function getColumnsForEntity(
    entityType: "clients" | "users" | "appointments" | "volunteerRecords"
): ColumnDefinition[] {
    switch (entityType) {
        case "clients":
            return CLIENT_COLUMNS;
        case "users":
            return USER_COLUMNS;
        case "appointments":
            return APPOINTMENT_COLUMNS;
        case "volunteerRecords":
            return VOLUNTEER_RECORDS_COLUMNS;
        default:
            return [];
    }
}

// Helper function to group columns
export function getGroupedColumns(columns: ColumnDefinition[]): Record<string, ColumnDefinition[]> {
    return columns.reduce(
        (acc, column) => {
            if (!acc[column.group]) {
                acc[column.group] = [];
            }
            acc[column.group].push(column);
            return acc;
        },
        {} as Record<string, ColumnDefinition[]>
    );
}
