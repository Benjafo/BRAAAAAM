"use client";

import RideForm, { type RideFormValues } from "@/components/form/rideForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PERMISSIONS } from "@/lib/permissions";
import { formatLocalDate } from "@/lib/utils";
import { http } from "@/services/auth/serviceResolver";
import { AlertCircle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useAuthStore } from "../stores/authStore";
import AssignRideModal from "./assignRideModal";

// Type matching the API response from listClients
type Client = {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    phoneIsCell: boolean;
    secondaryPhone: string | null;
    secondaryPhoneIsCell: boolean;
    contactPreference: "email" | "phone";
    allowMessages: boolean;
    gender: "Male" | "Female" | "Other";
    birthYear: number | null;
    birthMonth: number | null;
    livesAlone: boolean;
    addressLocation: string;
    notes: string | null;
    isActive: boolean | null;
    createdAt: string;
    updatedAt: string;
    address: {
        id: string;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | null;
};

type RideModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: Partial<RideFormValues> & {
        // hacky fix for displaying client info in view mode
        id?: string;
        clientFirstName?: string;
        clientLastName?: string;
        pickupAddressLine1?: string;
        pickupAddressLine2?: string;
        pickupCity?: string;
        pickupState?: string;
        pickupZip?: string;
    };
    onSuccess?: () => void;
    viewMode?: boolean; // If true, form is read-only
};

// Type matching the API response from listUsers
type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    contactPreference: string | null;
    isActive: boolean;
    isDriver: boolean;
};

export default function RideModal({
    open,
    onOpenChange,
    defaultValues: defaultValuesProp = {},
    onSuccess,
    viewMode = false,
}: RideModalProps) {
    const isEditing = Boolean(defaultValuesProp.id);
    const modalTitle = viewMode ? "View Ride" : isEditing ? "Edit Ride" : "Create Ride";
    const successMessage = isEditing ? "Ride Updated" : "Ride Created";

    const [clients, setClients] = React.useState<Client[]>([]);
    const [drivers, setDrivers] = React.useState<User[]>([]);
    const [isLoadingClients, setIsLoadingClients] = React.useState(false);
    const [isLoadingDrivers, setIsLoadingDrivers] = React.useState(false);
    const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = React.useState(false);

    // Check permissions
    const hasFullUpdatePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_APPOINTMENTS_UPDATE)
    );
    const hasOwnUpdatePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.OWN_APPOINTMENTS_UPDATE)
    );
    const canViewClientInfo = useAuthStore((s) =>
        s.hasAnyPermission([PERMISSIONS.APPOINTMENT_CLIENTS_READ, PERMISSIONS.CLIENTS_READ])
    );
    const canViewClientList = useAuthStore((s) => s.hasPermission(PERMISSIONS.CLIENTS_READ));

    const user = useAuthStore((s) => s.user);
    const userFirstName = user?.firstName;
    const userLastName = user?.lastName;
    const dispatcherFullName =
        userFirstName && userLastName ? `${userFirstName} ${userLastName}` : "";

    // Limited edit mode: user only has ownappointments.update permission
    const limitedEditMode = !hasFullUpdatePermission && hasOwnUpdatePermission;

    console.log("Default Values:", defaultValuesProp);

    React.useEffect(() => {
        if (!open) return; // Only fetch when modal is open

        const fetchClients = async () => {
            // Only fetch clients if not in view mode and user has clients.read permission
            if (viewMode || !canViewClientList) {
                setIsLoadingClients(false);
                return;
            }

            setIsLoadingClients(true);
            try {
                const response = await http.get(`o/clients`).json<{ results: Client[] }>();

                setClients(response.results);
            } catch (error) {
                console.error("Failed to fetch clients:", error);
                toast.error("Failed to load clients");
            } finally {
                setIsLoadingClients(false);
            }
        };

        const fetchDrivers = async () => {
            setIsLoadingDrivers(true);
            try {
                // TODO: Add URL param to filter drivers on backend: `/o/users?isDriver=true`
                const response = await http.get(`o/users`).json<{ results: User[] }>();
                const driverUsers = response.results.filter(
                    (user) => user.isDriver === true && user.isActive === true
                );
                setDrivers(driverUsers);
            } catch (error) {
                console.error("Failed to fetch drivers:", error);
                toast.error("Failed to load drivers");
            } finally {
                setIsLoadingDrivers(false);
            }
        };

        fetchClients();
        fetchDrivers();
    }, [open, viewMode, canViewClientList]);

    // Transform clients into format expected by RideForm
    let clientList;
    if (viewMode && defaultValuesProp.clientId && defaultValuesProp.clientFirstName) {
        // Create a single client entry from appointment data for view mode
        clientList = [
            {
                id: defaultValuesProp.clientId,
                value: defaultValuesProp.clientId,
                label: `${defaultValuesProp.clientFirstName} ${defaultValuesProp.clientLastName}`,
                profile: {
                    address: defaultValuesProp.pickupAddressLine1 ?? "",
                    address2: defaultValuesProp.pickupAddressLine2 ?? undefined,
                    zip: defaultValuesProp.pickupZip ?? "",
                    city: defaultValuesProp.pickupCity ?? "",
                    state: defaultValuesProp.pickupState ?? "",
                    primaryPhone: "",
                    secondaryPhone: undefined,
                    emailAddress: undefined,
                    commentsFromProfile: undefined,
                },
            },
        ];
        console.log("Created synthetic client entry:", clientList[0]);
        console.log("Client ID from appointment:", defaultValuesProp.clientId);
    } else {
        clientList = clients.map((client) => ({
            id: client.id,
            value: client.id,
            label: `${client.firstName} ${client.lastName}`,
            profile: {
                address: client.address?.addressLine1 ?? "",
                address2: client.address?.addressLine2 ?? undefined,
                zip: client.address?.zip ?? "",
                city: client.address?.city ?? "",
                state: client.address?.state ?? "",
                primaryPhone: client.phone,
                secondaryPhone: client.secondaryPhone ?? undefined,
                emailAddress: client.email ?? undefined,
                commentsFromProfile: client.notes ?? undefined,
            },
        }));
    }
    console.log(
        "If check:",
        viewMode,
        defaultValuesProp.clientId,
        defaultValuesProp.clientFirstName
    );

    // Transform drivers into format expected by RideForm
    const driverList = drivers.map((driver) => ({
        value: driver.id,
        label: `${driver.firstName} ${driver.lastName}`,
    }));

    // TODO get rid of this I think
    // Merge incoming defaultValues with base defaults
    const defaultValues: Partial<RideFormValues> = {
        // additionalRider: "No",
        // tripType: "roundTrip",
        dispatcherName: dispatcherFullName,
        ...defaultValuesProp,
    };

    // Get the id for current user (presumably this is the dispatcher also)
    const userId = useAuthStore((s) => s.user?.id);

    // Handle client selection changes
    function handleClientChange(clientId: string) {
        // TODO remove this
        console.log(`Client changed: ${clientId}`);
    }

    // Handle opening assign driver modal
    function handleFindMatchingDrivers() {
        if (!isEditing) {
            toast.info("Please save the ride first to find matching drivers");
            return;
        }
        setIsAssignDriverModalOpen(true);
    }

    async function handleSubmit(values: RideFormValues) {
        try {
            console.log("Submit ride form values:", values);

            // Skip validation for drivers with limited permissions (they're only updating completion fields)
            let selectedClient: Client | undefined;
            if (!limitedEditMode) {
                const appointmentDate = values.tripDate;
                const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 6 = Saturday
                const [hour] = values.appointmentTime.split(":").map(Number); // HH:MM

                // Is appointment Mon-Fri 9-5?
                if (dayOfWeek === 0 || dayOfWeek === 6 || hour < 9 || hour >= 17) {
                    toast.error("Appointment must be within operating hours (Mon–Fri, 9 AM–5 PM)");
                    return;
                }

                // Find the selected client to get their address
                selectedClient = clients.find((c) => c.id === values.clientId);
                if (!selectedClient?.address) {
                    toast.error("Client address not found");
                    return;
                }

                console.log("Selected client address:", selectedClient.address);
            }

            // Map form values to API structure
            let requestBody: Record<string, unknown>;

            if (limitedEditMode) {
                // Drivers with limited permissions can only update completion fields
                requestBody = {
                    status: values.rideStatus,
                    milesDriven: values.tripDistance,
                    actualDurationMinutes: values.tripDuration,
                    estimatedDurationMinutes: values.estimatedDuration
                        ? values.estimatedDuration * 60
                        : undefined,
                    notes: values.tripDistance
                        ? `Trip completed: ${values.tripDistance} miles`
                        : undefined,
                    donationType: values.donationType || "None",
                    donationAmount: values.donationAmount,
                    hasAdditionalRider: values.additionalRider === "Yes",
                    additionalRiderFirstName:
                        values.additionalRider === "Yes" ? values.additionalRiderFirstName : null,
                    additionalRiderLastName:
                        values.additionalRider === "Yes" ? values.additionalRiderLastName : null,
                    relationshipToClient:
                        values.additionalRider === "Yes" ? values.relationshipToClient : null,
                    customFields: values.customFields,
                };
            } else {
                // Full permissions - can update all fields
                requestBody = {
                    startDate: formatLocalDate(values.tripDate),
                    startTime: values.appointmentTime,
                    estimatedEndDate: formatLocalDate(values.tripDate),
                    estimatedEndTime: values.appointmentTime,
                    clientId: values.clientId,
                    driverId: values.assignedDriver || null,
                    dispatcherId: userId,
                    dispatcherFirstName: userFirstName,
                    dispatcherLastName: userLastName,
                    createdByUserId: userId,
                    tripPurpose: values.purposeOfTrip || null,
                    tripType: values.tripType,
                    pickupAddress: {
                        addressLine1: selectedClient!.address!.addressLine1,
                        addressLine2: selectedClient!.address!.addressLine2 || null,
                        city: selectedClient!.address!.city,
                        state: selectedClient!.address!.state,
                        zip: selectedClient!.address!.zip,
                        country: selectedClient!.address!.country || "USA",
                    },
                    destinationAddress: {
                        addressLine1: values.destinationAddress,
                        addressLine2: values.destinationAddress2 || null,
                        city: values.destinationCity,
                        state: values.destinationState,
                        zip: values.destinationZip,
                        country: "USA",
                    },
                    status: values.rideStatus || "unassigned",
                    hasAdditionalRider: values.additionalRider === "Yes",
                    additionalRiderFirstName:
                        values.additionalRider === "Yes" ? values.additionalRiderFirstName : null,
                    additionalRiderLastName:
                        values.additionalRider === "Yes" ? values.additionalRiderLastName : null,
                    relationshipToClient:
                        values.additionalRider === "Yes" ? values.relationshipToClient : null,
                    milesDriven: values.tripDistance,
                    estimatedDurationMinutes: values.estimatedDuration
                        ? values.estimatedDuration * 60
                        : undefined,
                    actualDurationMinutes: values.tripDuration
                        ? values.tripDuration * 60
                        : undefined,
                    donationType: values.donationType || "None",
                    donationAmount: values.donationAmount,
                    customFields: values.customFields,
                };
            }

            console.log("Sending to API:", requestBody);

            // Make API call based on editing status
            if (isEditing) {
                await http
                    .put(`o/appointments/${defaultValuesProp.id}`, {
                        json: requestBody,
                    })
                    .json();
            } else {
                await http
                    .post(`o/appointments/`, {
                        json: requestBody,
                    })
                    .json();
            }

            toast.success(successMessage);
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to create appointment:", error);
            toast.error("Failed to save ride. Please try again.");
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="!max-w-[692px] w-[95vw] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle>{modalTitle}</DialogTitle>
                    </DialogHeader>

                    {!canViewClientInfo && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                You do not have permission to view client details for this
                                appointment.
                            </AlertDescription>
                        </Alert>
                    )}

                    <RideForm
                        defaultValues={defaultValues}
                        onSubmit={handleSubmit}
                        clients={clientList}
                        drivers={driverList}
                        onClientChange={handleClientChange}
                        onFindMatchingDrivers={handleFindMatchingDrivers}
                        isLoading={isLoadingClients || isLoadingDrivers}
                        viewMode={viewMode}
                        limitedEditMode={limitedEditMode}
                    />

                    <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {viewMode ? "Close" : "Cancel"}
                        </Button>
                        {!viewMode && (
                            <Button type="submit" form="create-ride-form">
                                Save
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {isEditing && defaultValuesProp.id && (
                <AssignRideModal
                    appointmentId={defaultValuesProp.id}
                    open={isAssignDriverModalOpen}
                    onOpenChange={setIsAssignDriverModalOpen}
                    onDriverAssigned={() => {
                        // Refresh or notify that driver was assigned
                        toast.success("Driver assigned! Please refresh to see updates.");
                    }}
                />
            )}
        </>
    );
}
