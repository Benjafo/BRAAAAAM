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
            const end = new Date();
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
            const end = new Date();
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
            start: new Date(2000, 0, 1), // Jan 1, 2000
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
        onDateRangeChange(new Date(newStartDate), new Date(localEndDate));
    };

    /**
     * Handle end date change
     */
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = e.target.value;
        setLocalEndDate(newEndDate);
        onDateRangeChange(new Date(localStartDate), new Date(newEndDate));
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
                    <label
                        htmlFor="start-date"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                    <label
                        htmlFor="end-date"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                    {PRESET_RANGES.map((preset) => (
                        <Button
                            key={preset.label}
                            onClick={() => applyPreset(preset)}
                            variant="outline"
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
