"use client";

import RideForm, { type RideFormValues } from "@/components/form/rideForm";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { http } from "@/services/auth/serviceResolver";
import * as React from "react";
import { toast } from "sonner";
import AssignRideModal from "./assignRideModal";
import { useAuthStore } from "../stores/authStore";

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
    defaultValues?: Partial<RideFormValues> & { id?: string };
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
}: RideModalProps) {
    const isEditing = Boolean(defaultValuesProp.id);
    const modalTitle = isEditing ? "Edit Ride" : "Create Ride";
    const successMessage = isEditing ? "Ride Updated" : "Ride Created";

    const [clients, setClients] = React.useState<Client[]>([]);
    const [drivers, setDrivers] = React.useState<User[]>([]);
    const [isLoadingClients, setIsLoadingClients] = React.useState(false);
    const [isLoadingDrivers, setIsLoadingDrivers] = React.useState(false);
    const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = React.useState(false);

    React.useEffect(() => {
        if (!open) return; // Only fetch when modal is open

        const fetchClients = async () => {
            setIsLoadingClients(true);
            try {
                const orgID = "braaaaam";
                const response = (await http
                    .get(`o/${orgID}/clients`, {
                        headers: {
                            "x-org-subdomain": orgID,
                        },
                    })
                    .json()) as { results: Client[] };
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
                const orgID = "braaaaam";
                // TODO: Add URL param to filter drivers on backend: `/o/${orgID}/users?isDriver=true`
                const response = (await http
                    .get(`o/${orgID}/users`, {
                        headers: {
                            "x-org-subdomain": orgID,
                        },
                    })
                    .json()) as { results: User[] };
                const driverUsers = response.results.filter((user) => user.isDriver === true);
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
    }, [open]);

    // Transform clients into format expected by RideForm
    const clientList = clients.map((client) => ({
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
            console.log("Form values:", values);

            const orgID = "braaaaam";

            // Find the selected client to get their address
            const selectedClient = clients.find((c) => c.id === values.clientId);
            if (!selectedClient?.address) {
                toast.error("Client address not found");
                return;
            }

            console.log("Selected client address:", selectedClient.address);

            // Map form values to API structure
            const requestBody = {
                startDate: values.tripDate.toISOString().split("T")[0],
                startTime: values.appointmentTime,
                estimatedEndDate: values.tripDate.toISOString().split("T")[0],
                estimatedEndTime: values.appointmentTime,
                clientId: values.clientId,
                driverId: values.assignedDriver || null,
                dispatcherId: userId,
                createdByUserId: userId,
                tripPurpose: values.purposeOfTrip || null,
                tripCount: values.tripType === "roundTrip" ? 2 : 1, // Convert tripType to tripCount
                pickupAddress: {
                    addressLine1: selectedClient.address.addressLine1,
                    addressLine2: selectedClient.address.addressLine2 || null,
                    city: selectedClient.address.city,
                    state: selectedClient.address.state,
                    zip: selectedClient.address.zip,
                    country: selectedClient.address.country || "USA",
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
            };

            console.log("Sending to API:", requestBody);

            // Make API call based on editing status
            if (isEditing) {
                await http
                    .put(`o/${orgID}/appointments/${defaultValuesProp.id}`, {
                        json: requestBody,
                        headers: {
                            "x-org-subdomain": orgID,
                        },
                    })
                    .json();
            } else {
                await http
                    .post(`o/${orgID}/appointments/`, {
                        json: requestBody,
                        headers: {
                            "x-org-subdomain": orgID,
                        },
                    })
                    .json();
            }

            toast.success(successMessage);
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

                <RideForm
                    defaultValues={defaultValues}
                    onSubmit={handleSubmit}
                    clients={clientList}
                    drivers={driverList}
                    onClientChange={handleClientChange}
                    onFindMatchingDrivers={handleFindMatchingDrivers}
                    isLoading={isLoadingClients || isLoadingDrivers}
                />

                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="create-ride-form">
                        Save
                    </Button>
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
