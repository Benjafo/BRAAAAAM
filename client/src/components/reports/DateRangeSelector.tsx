import { useState } from "react";
import { Button } from "../ui/button";

interface DateRangeSelectorProps {
    startDate: Date;
    endDate: Date;
    onDateRangeChange: (start: Date, end: Date) => void;
}

interface PresetRange {
    label: string;
    getDates: () => { start: Date; end: Date };
}

const PRESET_RANGES: PresetRange[] = [
    {
        label: "Last 7 Days",
        getDates: () => ({
            start: new Date(new Date().setDate(new Date().getDate() - 7)),
            end: new Date(),
        }),
    },
    {
        label: "Last 30 Days",
        getDates: () => ({
            start: new Date(new Date().setDate(new Date().getDate() - 30)),
            end: new Date(),
        }),
    },
    {
        label: "Last 90 Days",
        getDates: () => ({
            start: new Date(new Date().setDate(new Date().getDate() - 90)),
            end: new Date(),
        }),
    },
    {
        label: "This Month",
        getDates: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return { start, end };
        },
    },
    {
        label: "Last Month",
        getDates: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start, end };
        },
    },
    {
        label: "This Year",
        getDates: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            const end = new Date(now.getFullYear(), 11, 31);
            return { start, end };
        },
    },
    {
        label: "Last Year",
        getDates: () => {
            const now = new Date();
            const start = new Date(now.getFullYear() - 1, 0, 1);
            const end = new Date(now.getFullYear() - 1, 11, 31);
            return { start, end };
        },
    },
    {
        label: "All Time",
        getDates: () => ({
            start: new Date(1900, 0, 1), // Jan 1, 1900
            end: new Date(),
        }),
    },
];

/**
 * Format date to YYYY-MM-DD for input fields
 */
function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function normalizeDates(start: Date, end: Date) {
    if (start > end) {
        return { start: end, end: start }; // swap
    }
    return { start, end };
}

export function DateRangeSelector({
    startDate,
    endDate,
    onDateRangeChange,
}: DateRangeSelectorProps) {
    const [localStartDate, setLocalStartDate] = useState(formatDateForInput(startDate));
    const [localEndDate, setLocalEndDate] = useState(formatDateForInput(endDate));

    /**
     * Handle start date change
     */
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setLocalStartDate(newStartDate);
        const start = new Date(newStartDate);
        const end = new Date(localEndDate);
        const normalizedDate = normalizeDates(start, end);
        onDateRangeChange(normalizedDate.start, normalizedDate.end);
    };

    /**
     * Handle end date change
     */
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = e.target.value;
        setLocalEndDate(newEndDate);
        const start = new Date(localStartDate);
        const end = new Date(newEndDate);
        const normalizedDate = normalizeDates(start, end);
        onDateRangeChange(normalizedDate.start, normalizedDate.end);
    };

    /**
     * Apply a preset range
     */
    const applyPreset = (preset: PresetRange) => {
        const { start, end } = preset.getDates();
        setLocalStartDate(formatDateForInput(start));
        setLocalEndDate(formatDateForInput(end));
        onDateRangeChange(start, end);
    };

    return (
        <div className="space-y-4">
            {/* Custom Date Range Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium  mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        id="start-date"
                        value={localStartDate}
                        onChange={handleStartDateChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        id="end-date"
                        value={localEndDate}
                        onChange={handleEndDateChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Preset Ranges */}
            <div>
                <label className="block text-sm font-medium mb-2">Quick Presets</label>
                <div className="flex flex-wrap gap-2">
                    {PRESET_RANGES.map((preset) => (
                        <Button
                            variant={"secondary"}
                            key={preset.label}
                            onClick={() => applyPreset(preset)}
                            size="sm"
                        >
                            {preset.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
