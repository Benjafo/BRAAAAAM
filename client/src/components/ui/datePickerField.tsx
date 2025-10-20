import { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DATE_FORMAT = "MMMM dd, yyyy";

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

    const parsed = parse(dateString, DATE_FORMAT, new Date());
    return isValid(parsed) ? parsed : undefined;
}

interface DatePickerInputProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
}

export function DatePickerInput({
    value,
    onChange,
    placeholder = "Select a date",
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
