import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

const DATE_FORMAT = "MMMM dd, yyyy";

// Array of date formats to try parsing
const DATE_FORMATS_TO_TRY = [
    "MMMM dd, yyyy", // November 5, 2025
    "MMMM dd yyyy", // November 5 2025
    "MMMM d, yyyy", // November 5, 2025 (single digit day)
    "MMMM d yyyy", // November 5 2025 (single digit day)
    "MMM dd, yyyy", // Nov 5, 2025
    "MMM dd yyyy", // Nov 5 2025
    "MMM d, yyyy", // Nov 5, 2025 (single digit day)
    "MMM d yyyy", // Nov 5 2025 (single digit day)
    "MM/dd/yyyy", // 11/05/2025
    "M/d/yyyy", // 11/5/2025
    "yyyy-MM-dd", // 2025-11-05
];

function formatDate(date: Date | undefined): string {
    if (!date || !isValid(date)) {
        return "";
    }
    return format(date, DATE_FORMAT);
}

function parseDate(dateString: string): Date | undefined {
    if (!dateString.trim()) {
        return undefined;
    }

    // Only try to parse if the string looks reasonably complete
    // Check if it contains at least 4 consecutive digits (year)
    const hasYear = /\d{4}/.test(dateString);
    if (!hasYear) {
        return undefined;
    }

    // Try each format until one works
    for (const formatStr of DATE_FORMATS_TO_TRY) {
        const parsed = parse(dateString, formatStr, new Date());
        if (isValid(parsed)) {
            return parsed;
        }
    }

    return undefined;
}

interface DatePickerInputProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function DatePickerInput({
    value,
    onChange,
    placeholder = "Select a date",
    disabled = false,
}: DatePickerInputProps) {
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState<Date | undefined>(value || new Date());
    const [inputValue, setInputValue] = useState(formatDate(value));

    // Sync inputValue when value prop changes externally (e.g., form reset)
    useEffect(() => {
        setInputValue(formatDate(value));
    }, [value]);

    return (
        <div className="relative flex gap-2">
            <Input
                value={inputValue}
                placeholder={placeholder}
                className="bg-background pr-10"
                disabled={disabled}
                onClick={() => setOpen(true)}
                onChange={(e) => {
                    const inputVal = e.target.value;
                    setInputValue(inputVal);

                    if (inputVal.trim() === "") {
                        onChange(undefined);
                        return;
                    }

                    const parsedDate = parseDate(inputVal);
                    if (parsedDate) {
                        onChange(parsedDate);
                        setMonth(parsedDate);
                    }
                    // If invalid format, don't update form value
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setOpen(true);
                    }
                }}
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={disabled}
                        className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                    >
                        <CalendarIcon className="size-3.5" />
                        <span className="sr-only">Select date</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="end"
                    alignOffset={-8}
                    sideOffset={10}
                >
                    <Calendar
                        mode="single"
                        selected={value}
                        captionLayout="dropdown"
                        startMonth={new Date(1900, 0, 1)} // January 1900
                        endMonth={new Date(2099, 11, 31)} // December 2099
                        month={month}
                        onMonthChange={setMonth}
                        onSelect={(date) => {
                            onChange(date);
                            setInputValue(formatDate(date));
                            setOpen(false);
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
