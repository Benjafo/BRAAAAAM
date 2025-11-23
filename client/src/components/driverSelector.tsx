"use client";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { http } from "@/services/auth/serviceResolver";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

type Driver = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isDriverRole?: boolean;
    isActive?: boolean;
};

type DriverSelectorProps = {
    value?: string | null;
    onChange: (driverId: string, driverName: string) => void;
    disabled?: boolean;
    required?: boolean;
};

export function DriverSelector({ value, onChange, disabled, required }: DriverSelectorProps) {
    const [open, setOpen] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDrivers() {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch all users and filter for drivers with driver roles
                const response = await http
                    .get("o/users?pageSize=1000")
                    .json<{ results: Driver[] }>();

                console.log("Fetched users:", response.results);

                // Filter for users with driver roles who are active
                const driverUsers = response.results.filter(
                    (user) => user.isDriverRole === true && user.isActive === true
                );

                console.log("Filtered drivers:", driverUsers);

                setDrivers(driverUsers);
            } catch (err) {
                console.error("Failed to fetch drivers:", err);
                setError("Failed to load drivers");
            } finally {
                setIsLoading(false);
            }
        }

        fetchDrivers();
    }, []);

    const selectedDriver = drivers.find((driver) => driver.id === value);
    const selectedDriverName = selectedDriver
        ? `${selectedDriver.firstName} ${selectedDriver.lastName}`
        : "Select a driver...";

    return (
        <div className="w-full space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Driver {required && <span className="text-destructive">*</span>}
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        disabled={disabled || isLoading}
                        className={cn("w-full justify-between", !value && "text-muted-foreground")}
                    >
                        {isLoading ? "Loading drivers..." : error ? error : selectedDriverName}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandInput placeholder="Search drivers..." />
                        <CommandList>
                            <CommandEmpty>No drivers found.</CommandEmpty>
                            <CommandGroup>
                                {drivers.map((driver) => {
                                    const driverName = `${driver.firstName} ${driver.lastName}`;
                                    return (
                                        <CommandItem
                                            key={driver.id}
                                            value={driverName}
                                            onSelect={() => {
                                                onChange(driver.id, driverName);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    driver.id === value
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {driverName}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
