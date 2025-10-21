"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable } from "../dataTable";

type Driver = {
    name: string;
    phoneNumber: string;
};

export default function AssignRideModal() {
    const [open, setOpen] = React.useState(false);

    const fetchDrivers = async () => {
        const drivers: Driver[] = [{ name: "one", phoneNumber: "123" }];
        return {
            data: drivers,
            total: 1,
        };
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Assign Ride</Button>
            </DialogTrigger>

            <DialogContent className="max-w-[692px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>Suggested Drivers for This Ride</DialogTitle>
                    <p className="text-center text-sm mt-4">
                        The system suggests these drivers for the selected ride.
                        <br />
                        "Perfect matches" have been highlighted in green; all subsequent drivers are
                        displayed in order of how well they match this ride's constraints.
                    </p>
                </DialogHeader>
                <DataTable
                    fetchData={fetchDrivers}
                    columns={[
                        { header: "Name", accessorKey: "name" },
                        { header: "Phone", accessorKey: "phoneNumber" },
                        {
                            header: "",
                            cell: () => (
                                <a href={`/`} className="hover:underline">
                                    Notify this Driver
                                </a>
                            ),
                            accessorKey: "assignDriver",
                        },
                        {
                            header: "",
                            cell: () => (
                                <a href={`/`} className="hover:underline">
                                    Assign this Driver
                                </a>
                            ),
                            accessorKey: "notifiyDriver",
                        },
                    ]}
                    showFilters={false}
                />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
