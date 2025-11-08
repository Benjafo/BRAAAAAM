"use client";

import { useAuthStore } from "@/components/stores/authStore";
import { exportToCSV } from "@/lib/csvExport";
import { PERMISSIONS } from "@/lib/permissions";
import { type ColumnDefinition, getColumnsForEntity } from "@/lib/reportColumns";
import { http } from "@/services/auth/serviceResolver";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { ColumnSelector } from "./ColumnSelector";
import { DateRangeSelector } from "./DateRangeSelector";
import { EntitySelector } from "./EntitySelector";

type EntityType = "clients" | "users" | "appointments";

export function ReportBuilder() {
    const [entityType, setEntityType] = useState<EntityType>("clients");
    const [selectedColumns, setSelectedColumns] = useState<ColumnDefinition[]>([]);
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(new Date().setDate(new Date().getDate() - 30)), // Default to last 30 days
        end: new Date(),
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);

    // Check if user has export permission
    const hasExportPermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.REPORTS_EXPORT));

    // Get available columns for the selected entity type
    const availableColumns = getColumnsForEntity(entityType);

    /**
     * Handle entity type change - reset selected columns
     */
    const handleEntityChange = (newEntityType: EntityType) => {
        setEntityType(newEntityType);
        setSelectedColumns([]);
        setPreviewData([]);
        setTotalRecords(0);
        setError(null);
    };

    /**
     * Handle column selection change
     */
    const handleColumnSelectionChange = (columns: ColumnDefinition[]) => {
        setSelectedColumns(columns);
    };

    /**
     * Handle date range change
     */
    const handleDateRangeChange = (start: Date, end: Date) => {
        setDateRange({ start, end });
    };

    /**
     * Fetch data based on entity type and date range
     * Uses pagination to fetch all records in batches of 100
     */
    const fetchData = async (): Promise<Record<string, unknown>[]> => {
        const orgId = "braaaaam"; // TODO: Get from context
        const startDate = dateRange.start.toISOString();
        const endDate = dateRange.end.toISOString();
        const allData: Record<string, unknown>[] = [];

        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await http
                .get(
                    `o/${orgId}/reports/${entityType}/export?startDate=${startDate}&endDate=${endDate}&page=${page}&pageSize=100`,
                    {
                        headers: { "x-org-subdomain": orgId },
                    }
                )
                .json<{
                    results: Record<string, unknown>[];
                    pagination: {
                        page: number;
                        pageSize: number;
                        totalRecords: number;
                        totalPages: number;
                    };
                }>();

            allData.push(...response.results);

            hasMore = page < response.pagination.totalPages;
            page++;
        }

        return allData;
    };

    /**
     * Generate preview of data (first 10 rows)
     */
    const handleGeneratePreview = async () => {
        if (selectedColumns.length === 0) {
            setError("Please select at least one column");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const data = await fetchData();
            setTotalRecords(data.length);
            setPreviewData(data.slice(0, 10)); // Show first 10 rows in preview
        } catch (err: unknown) {
            console.error("Error generating preview:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to generate preview";
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * Export full report to CSV
     */
    const handleExportCSV = async () => {
        if (!hasExportPermission) {
            setError("You do not have permission to export reports");
            return;
        }

        if (selectedColumns.length === 0) {
            setError("Please select at least one column");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const data = await fetchData();
            exportToCSV(data, selectedColumns, entityType, dateRange);
        } catch (err: unknown) {
            console.error("Error exporting CSV:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to export CSV";
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * Get nested value from object using dot notation
     */
    const getNestedValue = (obj: any, path: string): any => {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="ml-4">
                <h2 className="text-2xl font-bold">Custom Report Builder</h2>
                <p className="text-gray-600 mt-2">
                    Select an entity, customize columns, choose a date range, and export to CSV
                </p>
            </div>

            {/* Step 1: Entity Selection */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Step 1: Select Entity Type</h3>
                <EntitySelector selectedEntity={entityType} onEntityChange={handleEntityChange} />
            </div>

            {/* Step 2: Date Range Selection */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Step 2: Select Date Range</h3>
                <DateRangeSelector
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    onDateRangeChange={handleDateRangeChange}
                />
            </div>

            {/* Step 3: Column Selection */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Step 3: Select Columns ({selectedColumns.length} selected)
                </h3>
                <ColumnSelector
                    availableColumns={availableColumns}
                    selectedColumns={selectedColumns}
                    onSelectionChange={handleColumnSelectionChange}
                />
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Step 4: Generate Report</h3>
                <div className="flex gap-4">
                    <Button
                        onClick={handleGeneratePreview}
                        disabled={isGenerating || selectedColumns.length === 0}
                        variant="outline"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Generate Preview"
                        )}
                    </Button>
                    <Button
                        onClick={handleExportCSV}
                        disabled={
                            isGenerating || selectedColumns.length === 0 || !hasExportPermission
                        }
                        title={
                            !hasExportPermission
                                ? "You do not have permission to export reports"
                                : undefined
                        }
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Export to CSV
                            </>
                        )}
                    </Button>
                </div>
                {totalRecords > 0 && (
                    <p className="text-sm text-gray-600 mt-4">
                        Total records found: {totalRecords}
                    </p>
                )}
            </div>

            {/* Preview Table */}
            {previewData.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Preview (showing first 10 of {totalRecords} records)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {selectedColumns.map((col) => (
                                        <th
                                            key={col.key}
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {previewData.map((item, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {selectedColumns.map((col) => {
                                            let value: string | number | boolean | null | undefined;
                                            if (col.getValue) {
                                                value = col.getValue(item);
                                            } else {
                                                value = getNestedValue(item, col.key);
                                            }

                                            return (
                                                <td
                                                    key={col.key}
                                                    className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                                                >
                                                    {value !== null && value !== undefined
                                                        ? String(value)
                                                        : "-"}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
