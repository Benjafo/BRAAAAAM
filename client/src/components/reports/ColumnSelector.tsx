import { CheckSquare, ChevronDown, ChevronRight, Square } from "lucide-react";
import { useState } from "react";
import { type ColumnDefinition, getGroupedColumns } from "@/lib/reportColumns";
import { Button } from "../ui/button";

interface ColumnSelectorProps {
    availableColumns: ColumnDefinition[];
    selectedColumns: ColumnDefinition[];
    onSelectionChange: (selectedColumns: ColumnDefinition[]) => void;
}

export function ColumnSelector({
    availableColumns,
    selectedColumns,
    onSelectionChange,
}: ColumnSelectorProps) {
    const groupedColumns = getGroupedColumns(availableColumns);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    /**
     * Toggle group expansion
     */
    const toggleGroup = (groupName: string) => {
        const newExpandedGroups = new Set(expandedGroups);
        if (newExpandedGroups.has(groupName)) {
            newExpandedGroups.delete(groupName);
        } else {
            newExpandedGroups.add(groupName);
        }
        setExpandedGroups(newExpandedGroups);
    };

    /**
     * Check if a column is selected
     */
    const isColumnSelected = (column: ColumnDefinition): boolean => {
        return selectedColumns.some((col) => col.key === column.key);
    };

    /**
     * Toggle individual column selection
     */
    const toggleColumn = (column: ColumnDefinition) => {
        if (isColumnSelected(column)) {
            // Remove column
            onSelectionChange(selectedColumns.filter((col) => col.key !== column.key));
        } else {
            // Add column
            onSelectionChange([...selectedColumns, column]);
        }
    };

    /**
     * Select all columns in a group
     */
    const selectAllInGroup = (groupName: string) => {
        const groupColumns = groupedColumns[groupName];
        const columnsToAdd = groupColumns.filter((col) => !isColumnSelected(col));
        onSelectionChange([...selectedColumns, ...columnsToAdd]);
    };

    /**
     * Deselect all columns in a group
     */
    const deselectAllInGroup = (groupName: string) => {
        const groupColumns = groupedColumns[groupName];
        const groupColumnKeys = new Set(groupColumns.map((col) => col.key));
        onSelectionChange(selectedColumns.filter((col) => !groupColumnKeys.has(col.key)));
    };

    /**
     * Check if all columns in a group are selected
     */
    const isGroupFullySelected = (groupName: string): boolean => {
        const groupColumns = groupedColumns[groupName];
        return groupColumns.every((col) => isColumnSelected(col));
    };

    /**
     * Check if some (but not all) columns in a group are selected
     */
    const isGroupPartiallySelected = (groupName: string): boolean => {
        const groupColumns = groupedColumns[groupName];
        const selectedCount = groupColumns.filter((col) => isColumnSelected(col)).length;
        return selectedCount > 0 && selectedCount < groupColumns.length;
    };

    /**
     * Select all columns
     */
    const selectAll = () => {
        onSelectionChange(availableColumns);
    };

    /**
     * Deselect all columns
     */
    const deselectAll = () => {
        onSelectionChange([]);
    };

    /**
     * Expand all groups
     */
    const expandAll = () => {
        setExpandedGroups(new Set(Object.keys(groupedColumns)));
    };

    /**
     * Collapse all groups
     */
    const collapseAll = () => {
        setExpandedGroups(new Set());
    };

    return (
        <div className="space-y-4">
            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-2">
                <Button onClick={selectAll} size="sm">
                    Select All
                </Button>
                <Button onClick={deselectAll} size="sm">
                    Deselect All
                </Button>
                <Button onClick={expandAll} size="sm">
                    Expand All Groups
                </Button>
                <Button onClick={collapseAll} size="sm">
                    Collapse All Groups
                </Button>
            </div>

            {/* Column Groups */}
            <div className="border rounded-lg divide-y">
                {Object.entries(groupedColumns).map(([groupName, columns]) => {
                    const isExpanded = expandedGroups.has(groupName);
                    const isFullySelected = isGroupFullySelected(groupName);
                    const isPartiallySelected = isGroupPartiallySelected(groupName);
                    const selectedCount = columns.filter((col) => isColumnSelected(col)).length;

                    return (
                        <div key={groupName} className="bg-white">
                            {/* Group Header */}
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => toggleGroup(groupName)}
                                        className="flex items-center space-x-2 flex-1 text-left"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-500" />
                                        )}
                                        <span className="font-semibold text-gray-900">
                                            {groupName}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            ({selectedCount}/{columns.length} selected)
                                        </span>
                                    </button>
                                    <div className="flex gap-2">
                                        {!isFullySelected && (
                                            <Button
                                                onClick={() => selectAllInGroup(groupName)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Select All
                                            </Button>
                                        )}
                                        {(isFullySelected || isPartiallySelected) && (
                                            <Button
                                                onClick={() => deselectAllInGroup(groupName)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Deselect All
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Group Columns */}
                            {isExpanded && (
                                <div className="px-4 pb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {columns.map((column) => {
                                            const selected = isColumnSelected(column);

                                            return (
                                                <button
                                                    key={column.key}
                                                    onClick={() => toggleColumn(column)}
                                                    className={`
                                                        flex items-center space-x-2 p-2 rounded border text-left
                                                        transition-colors
                                                        ${
                                                            selected
                                                                ? "bg-blue-50 border-blue-200 text-blue-900"
                                                                : "bg-white border-gray-200 hover:bg-gray-50"
                                                        }
                                                    `}
                                                >
                                                    {selected ? (
                                                        <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    )}
                                                    <span className="text-sm truncate">
                                                        {column.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            {selectedColumns.length > 0 && (
                <div className="text-sm text-gray-600">
                    <strong>{selectedColumns.length}</strong> column
                    {selectedColumns.length !== 1 ? "s" : ""} selected
                </div>
            )}
        </div>
    );
}
