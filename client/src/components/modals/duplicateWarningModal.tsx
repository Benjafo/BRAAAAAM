"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

type DuplicateClient = {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    secondaryPhone?: string | null;
    email?: string | null;
    birthMonth?: number | null;
    birthYear?: number | null;
    isActive: boolean;
    notes?: string | null;
    address?: {
        addressLine1?: string;
        addressLine2?: string | null;
        city?: string;
        state?: string;
        zip?: string;
    } | null;
};

type Props = {
    open: boolean;
    duplicates: DuplicateClient[];
    onProceed: () => void;
    onCancel: () => void;
};

export default function DuplicateWarningModal({ open, duplicates, onProceed, onCancel }: Props) {
    const formatPhone = (phone: string | null | undefined) => {
        if (!phone) return null;
        // Remove +1 prefix if present and format as (XXX) XXX-XXXX
        const cleaned = phone.replace("+1", "");
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    };

    const formatAddress = (address: DuplicateClient["address"]) => {
        if (!address?.addressLine1) return null;
        const parts = [
            address.addressLine1,
            address.addressLine2,
            address.city,
            address.state,
            address.zip,
        ].filter(Boolean);
        return parts.join(", ");
    };

    const formatBirthDate = (month: number | null | undefined, year: number | null | undefined) => {
        if (!month && !year) return null;
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        if (month && year) {
            return `${monthNames[month - 1]} ${year}`;
        }
        if (month) return monthNames[month - 1];
        if (year) return year.toString();
        return null;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle>Possible Duplicate Client Detected</DialogTitle>
                            <DialogDescription>
                                {duplicates.length === 1
                                    ? "A client with this name already exists"
                                    : `${duplicates.length} clients with this name already exist`}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="my-4">
                    <p className="text-sm text-muted-foreground mb-3">
                        Please review the existing {duplicates.length === 1 ? "client" : "clients"}{" "}
                        below to ensure you're not creating a duplicate:
                    </p>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {duplicates.map((duplicate) => {
                            const phone = formatPhone(duplicate.phone);
                            const secondaryPhone = formatPhone(duplicate.secondaryPhone);
                            const address = formatAddress(duplicate.address);
                            const birthDate = formatBirthDate(duplicate.birthMonth, duplicate.birthYear);

                            return (
                                <div
                                    key={duplicate.id}
                                    className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                                >
                                    <div className="space-y-1.5">
                                        {/* Name - always shown */}
                                        <div className="font-semibold text-amber-900">
                                            {duplicate.firstName} {duplicate.lastName}
                                        </div>

                                        {/* Status - always shown */}
                                        <div className="text-sm">
                                            <span className={duplicate.isActive ? "text-green-700" : "text-gray-600"}>
                                                {duplicate.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>

                                        {/* Phone */}
                                        {phone && (
                                            <div className="text-sm text-amber-800">
                                                <span className="font-medium">Phone:</span> {phone}
                                            </div>
                                        )}

                                        {/* Secondary Phone */}
                                        {secondaryPhone && (
                                            <div className="text-sm text-amber-800">
                                                <span className="font-medium">Secondary Phone:</span> {secondaryPhone}
                                            </div>
                                        )}

                                        {/* Email */}
                                        {duplicate.email && (
                                            <div className="text-sm text-amber-800">
                                                <span className="font-medium">Email:</span> {duplicate.email}
                                            </div>
                                        )}

                                        {/* Address */}
                                        {address && (
                                            <div className="text-sm text-amber-800">
                                                <span className="font-medium">Address:</span> {address}
                                            </div>
                                        )}

                                        {/* Birth Date */}
                                        {birthDate && (
                                            <div className="text-sm text-amber-800">
                                                <span className="font-medium">Birth Date:</span> {birthDate}
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {duplicate.notes && (
                                            <div className="text-sm text-amber-700 mt-2 pt-2 border-t border-amber-200">
                                                <span className="font-medium">Notes:</span> {duplicate.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter className="flex flex-row justify-end gap-3">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={onProceed} className="bg-amber-600 hover:bg-amber-700">
                        Create Anyway
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
