import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"

import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table"

// Component Props
export type DataTableProps<T extends Record<string, unknown>> = {
  data: T[];
  columns?: ColumnDef<T, any>[];
  caption?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  rowActions?: (row: T, index: number) => React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (row: T, index: number) => void;
  initialPageSize?: number;
  pageSizes?: number[];
  selectable?: boolean;
};

// Convert camelCase variables into nice format - firstName -> First Name
function prettify(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Makes columns based on first row
function inferColumns<T extends Record<string, unknown>>(sample: T): ColumnDef<T>[] {
  return Object.keys(sample).map((k) => ({
    header: prettify(k),
    accessorKey: k as keyof T,
    sortable: true,
    filterFn: "textIncludes" as any,
  })) as ColumnDef<T>[];
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  caption,
  className,
  ariaLabel = "Data table",
  rowActions,
  showSearch = true,
  searchPlaceholder = "Search…",
  onRowClick,
  initialPageSize = 10,
  pageSizes = [5, 10, 25, 50],
  selectable = true,
}: DataTableProps<T>) {
  // Infer columns if not provided
  const baseCols = React.useMemo<ColumnDef<T, any>[]>(() => {
    if (columns && columns.length > 0) return columns;
    if (data && data.length > 0) return inferColumns(data[0]);
    return [];
  }, [columns, data]);

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Track which column is selected for filtering
  const [activeFilterCol, setActiveFilterCol] = React.useState<string>("");

  // Create table
  const table = useReactTable({
    data,
    columns: baseCols,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: { pageIndex: 0, pageSize: initialPageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    globalFilterFn: (row, _columnId, filterValue) => {
      // Search across all columns
      const search = String(filterValue).toLowerCase();

      return Object.values(row.original).some((value) => {
        if (value == null) return false;

        // Handle numbers (Id, Amount, etc.)
        if (typeof value === "number") {
          return String(value).includes(filterValue);
        }

        // Handle strings and other types
        return String(value).toLowerCase().includes(search);
      });
    },

    // Per column filters
    filterFns: {
      textIncludes: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        if (value == null) return false;
        if (typeof value === "number") return String(value).includes(filterValue);
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      },
    },

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Columns that can be filtered
  const filterableCols = table
    .getAllColumns()
    .filter((col) => col.getCanFilter());

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 px-4 py-3 items-center">
          {caption ? <div className="text-sm text-muted-foreground">{caption}</div> : null}

          {/* Column filter */}
          {filterableCols.length > 0 && (
            <>
              <Select
                value={activeFilterCol} onValueChange={(val) => {
                  setActiveFilterCol(val);
                  filterableCols.forEach((c) => c.setFilterValue(undefined));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter column…" />
                </SelectTrigger>
                <SelectContent>
                  {filterableCols.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {String(c.columnDef.header ?? c.id)}
                    </SelectItem>
                  )
                  )}
                </SelectContent>
              </Select>

              {/* Input for filtering selected column */}
              {activeFilterCol && (
                <>
                  <Input
                    className="h-9 w-56"
                    placeholder={`Filter by ${activeFilterCol}...`}
                    value={
                      (table.getColumn(activeFilterCol)?.getFilterValue() as string) ?? ""
                    }
                    onChange={(e) =>
                      table.getColumn(activeFilterCol)?.setFilterValue(e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      table.getColumn(activeFilterCol)?.setFilterValue(undefined);
                      setActiveFilterCol(""); // Clear selection
                    }}
                  >
                    Clear
                  </Button>
                </>
              )}
            </>
          )}

          {/* Search */}
          <div className="ml-auto">
            {showSearch && (
              <Input
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)} // Update global search
                placeholder={searchPlaceholder}
                className="w-64"
              />
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border">
          <Table aria-label={ariaLabel} role="table">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {selectable && (
                    <TableHead className="w-8">
                      <Checkbox
                        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        // Enable sorting on header click
                        onClick={() =>
                          header.column.getCanSort() &&
                          header.column.toggleSorting(
                            sorted === "asc"
                          )
                        }
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none font-semibold"
                            : "font-semibold"
                        }
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {/* Sorting Icons */}
                          {header.column.getCanSort() &&
                            (sorted === "asc" ? (
                              <ArrowUp className="h-4 w-4 opacity-70" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="h-4 w-4 opacity-70" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            ))}
                        </div>
                      </TableHead>
                    );
                  })}
                  {rowActions ? <TableHead className="w-0" /> : null}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick?.(row.original, Number(row.id))}
                    className="cursor-pointer hover:bg-muted/40"
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {selectable && (
                      <TableCell className="w-8">
                        <Checkbox
                          checked={row.getIsSelected()}
                          onCheckedChange={(v) => row.toggleSelected(!!v)}
                          aria-label="Select row"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                    {rowActions ? (
                      <TableCell className="text-right">
                        {rowActions(row.original, Number(row.id))}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                // No Data
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length + (selectable ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-4 py-3">
          <div className="text-muted-foreground flex-1 text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border px-2 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))} // Update page size
            >
              {pageSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}