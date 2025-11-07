import { type ColumnDefinition } from "./reportColumns";

/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
function escapeCSV(value: any): string {
    if (value === null || value === undefined) {
        return "";
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Get value from nested object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV(
    data: Record<string, unknown>[],
    columns: ColumnDefinition[],
    entityType: string,
    dateRange: { start: Date; end: Date }
): void {
    // Build header row
    const headers = columns.map((col) => escapeCSV(col.label)).join(",");

    // Build data rows
    const rows = data.map((item) => {
        return columns
            .map((col) => {
                let value;

                if (col.getValue) {
                    value = col.getValue(item);
                } else {
                    value = getNestedValue(item, col.key);
                }

                return escapeCSV(value);
            })
            .join(",");
    });

    // Combine into full CSV
    const csv = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Generate filename with date range
    const startStr = dateRange.start.toISOString().split("T")[0];
    const endStr = dateRange.end.toISOString().split("T")[0];
    const filename = `${entityType}_report_${startStr}_to_${endStr}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
