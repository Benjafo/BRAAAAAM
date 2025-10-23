"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import * as React from "react";
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
                <div className="flex flex-row justify-end">
                    <Button variant="outline" className="mr-2">
                        Notify Drivers
                    </Button>
                    <Button variant="default">Assign Driver</Button>
                </div>
                <DataTable
                    fetchData={fetchDrivers}
                    columns={[
                        { header: "Name", accessorKey: "name", enableSorting: false },
                        { header: "Phone", accessorKey: "phoneNumber", enableSorting: false },
                        // {
                        //     header: "",
                        //     cell: () => (
                        //         <a href={`/`} className="hover:underline">
                        //             Notify this Driver
                        //         </a>
                        //     ),
                        //     accessorKey: "assignDriver",
                        //     enableSorting: false,
                        // },
                        // {
                        //     header: "",
                        //     cell: () => (
                        //         <a href={`/`} className="hover:underline">
                        //             Assign this Driver
                        //         </a>
                        //     ),
                        //     accessorKey: "notifiyDriver",
                        //     enableSorting: false,
                        // },
                    ]}
                    showFilters={false}
                    usePagination={false}
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
