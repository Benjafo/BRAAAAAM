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

export type SimpleColumn<T extends Record<string, unknown>> = {
  header: React.ReactNode;
  accessorKey?: keyof T | string;
  accessorFn?: (row: T) => unknown;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  hidden?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
};

export type DataTableProps<T extends Record<string, unknown>> = {
  data?: T[];
  columns?: SimpleColumn<T>[];
  defaultData?: T[];
  caption?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  emptyValue?: React.ReactNode;
  rowActions?: (row: T, rowIndex: number) => React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  filterKeys?: (keyof T | string)[];
  onRowClick?: (row: T, index: number) => void;
  initialPageSize?: number;
  pageSizes?: number[];
  selectable?: boolean;
};

function isRecord(v: unknown): v is Record<string | number, unknown> {
  return typeof v === "object" && v !== null;
}

function getByPath(obj: unknown, path?: unknown): unknown {
  if (path == null || path === "") return undefined;
  if (typeof path !== "string") {
    if (!isRecord(obj)) return undefined
    const key = String(path);
    return obj[key];
  }

  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);

  let acc: unknown = obj
  for (const seg of parts) {
    if (acc == null) return undefined

    const numeric = /^\d+$/.test(seg)
    const key = numeric ? Number(seg) : seg

    if (Array.isArray(acc)) {
      acc = acc[key as number]
    } else if (isRecord(acc)) {
      acc = acc[key as keyof typeof acc]
    } else {
      return undefined
    }
  }
  return acc
}

// Convert camelCase variables into nice format - firstName -> First Name
function prettify(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function inferColumns<T extends Record<string, unknown>>(sample: T): SimpleColumn<T>[] {
  return Object.keys(sample).map((k) => ({
    header: prettify(k),
    accessorKey: k as keyof T,
    sortable: true,
  })) as SimpleColumn<T>[];
}

type Sort = { index: number; dir: "asc" | "desc" } | null;

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  defaultData,
  caption,
  className,
  ariaLabel = "Data table",
  emptyValue = <span className="text-muted-foreground">—</span>,
  rowActions,
  showSearch = true,
  searchPlaceholder = "Search…",
  filterKeys,
  onRowClick,
  initialPageSize = 10,
  pageSizes = [5, 10, 25, 50],
  selectable = true,
}: DataTableProps<T>) {
  // Pick data to render: prefer `data`, else fallback to `defaultData`, else []
  const rows = React.useMemo<T[]>(() => {
    if (data && data.length) return data;
    if (defaultData && defaultData.length) return defaultData as T[];
    return [] as T[];
  }, [data, defaultData]);

  // columns
  const baseCols = React.useMemo<SimpleColumn<T>[]>(() => {
    const provided = (columns ?? []).slice();
    if (provided.length) return provided;
    if (rows.length) return inferColumns(rows[0] as T)
    return [];
  }, [columns, rows]);

  const visibleCols = React.useMemo(
    () => baseCols.filter((c) => !c.hidden),
    [baseCols]
  )

  // Sorting
  const [sort, setSort] = React.useState<Sort>(null);

  // Apply sorting when a header is clicked
  const sortedRows = React.useMemo(() => {
    if (!rows.length || !visibleCols.length || !sort) return rows;
    const col = visibleCols[sort.index];
    const getter = (r: T): unknown =>
      col.accessorFn ? col.accessorFn(r) : getByPath(r, col.accessorKey as string);

    const copy = [...rows];
    copy.sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      const na = va instanceof Date ? va.getTime() : (va as unknown);
      const nb = vb instanceof Date ? vb.getTime() : (vb as unknown);
      if (na == null && nb == null) return 0;
      if (na == null) return 1;
      if (nb == null) return -1;
      if (typeof na === "number" && typeof nb === "number")
        return sort.dir === "asc" ? na - nb : nb - na;
      const sa = String(na).toLowerCase();
      const sb = String(nb).toLowerCase();
      if (sa < sb) return sort.dir === "asc" ? -1 : 1;
      if (sa > sb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });

    return copy;
  }, [rows, visibleCols, sort]);

  const [filterCol, setFilterCol] = React.useState<string>("");
  const [filterVal, setFilterVal] = React.useState<string>("");

  const primarySearchKey = React.useMemo<string | undefined>(() => {
    if (filterKeys && filterKeys.length) return String(filterKeys[0]);
    const first = visibleCols[0]?.accessorKey;
    return first ? String(first) : undefined;
  }, [filterKeys, visibleCols]);

  const [query, setQuery] = React.useState("");

  const filteredRows = React.useMemo(() => {
    let out = sortedRows;

    if (filterCol && filterVal) {
      out = out.filter((row) =>
        String(getByPath(row, filterCol) ?? "")
          .toLowerCase()
          .startsWith(filterVal.toLowerCase())
      );
    }

    const q = query.trim().toLowerCase();
    if (q && primarySearchKey) {
      out = out.filter((row) =>
        String(getByPath(row, primarySearchKey) ?? "")
          .toLowerCase()
          .includes(q)
      );
    }

    return out;
  }, [sortedRows, filterCol, filterVal, query, primarySearchKey]);

  // Pagination
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [pageIndex, setPageIndex] = React.useState(0);
  React.useEffect(
    () => setPageIndex(0),
    [filteredRows.length, pageSize, visibleCols.length]
  );

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pagedRows = filteredRows.slice(start, end);

  function toggleSort(i: number, enable: boolean) {
    if (!enable) return;
    setSort((prev) => {
      if (!prev || prev.index !== i) return { index: i, dir: "asc" };
      if (prev.dir === "asc") return { index: i, dir: "desc" };
      return null;
    });
  }

  // Selection
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const allOnPageSelected = pagedRows.every((_, idx) => selected.has(start + idx));
  const someOnPageSelected =
    !allOnPageSelected && pagedRows.some((_, idx) => selected.has(start + idx));
  function toggleSelectAllOnPage(checked: boolean) {
    const next = new Set(selected);
    pagedRows.forEach((_, idx) => {
      const abs = start + idx;
      if (checked) next.add(abs)
      else next.delete(abs);
    })
    setSelected(next);
  }
  function toggleRow(absIndex: number, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(absIndex);
    else next.delete(absIndex);
    setSelected(next);
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 px-4 py-3 items-center">
          {caption ? <div className="text-sm text-muted-foreground">{caption}</div> : null}

          {/* Column filter */}
          {visibleCols.length > 0 && (
            <>
              <Select value={filterCol} onValueChange={setFilterCol}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter column…" />
                </SelectTrigger>
                <SelectContent>
                  {visibleCols.map((c, i) => {
                    const key = String(c.accessorKey ?? i)
                    return (
                      <SelectItem key={key} value={key}>
                        {String(c.header)}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {filterCol && (
                <Input
                  className="h-9 w-56"
                  placeholder="Type to filter…"
                  value={filterVal}
                  onChange={(e) => setFilterVal(e.target.value)}
                />
              )}

              {filterCol && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterCol("")
                    setFilterVal("")
                  }}
                >
                  Clear
                </Button>
              )}
            </>
          )}

          {/* Search */}
          <div className="ml-auto">
            {showSearch && primarySearchKey && (
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
              <TableRow>
                {selectable && (
                  <TableHead className="w-8">
                    <Checkbox
                      checked={allOnPageSelected || (someOnPageSelected && "indeterminate")}
                      onCheckedChange={(v) => toggleSelectAllOnPage(!!v)}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {visibleCols.map((col, i) => {
                  const isActive = sort?.index === i;
                  const align =
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "";
                  const keyId = String(col.accessorKey ?? i);
                  const ariaSort: React.AriaAttributes["aria-sort"] =
                    !col.sortable || !isActive
                      ? "none"
                      : sort!.dir === "asc"
                        ? "ascending"
                        : "descending";
                  return (
                    <TableHead
                      key={`${keyId}-${i}`}
                      className={`font-semibold ${align} ${col.sortable ? "cursor-pointer select-none" : ""
                        }`}
                      onClick={() => toggleSort(i, !!col.sortable)}
                      role="columnheader"
                      aria-sort={ariaSort}
                    >
                      <div className="flex items-center gap-1">
                        {col.header}
                        {col.sortable &&
                          (isActive ? (
                            sort!.dir === "asc" ? (
                              <ArrowUp className="h-4 w-4 opacity-70" />
                            ) : (
                              <ArrowDown className="h-4 w-4 opacity-70" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          ))}
                      </div>
                    </TableHead>
                  );
                })}
                {rowActions ? <TableHead className="w-0" /> : null}
              </TableRow>
            </TableHeader>

            <TableBody>
              {pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleCols.length + (rowActions ? 1 : 0) + (selectable ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row, rIdx) => {
                  const abs = start + rIdx
                  const clickable = !!onRowClick
                  const isSelected = selected.has(abs)

                  return (
                    <TableRow
                      key={abs}
                      role="row"
                      onClick={onRowClick ? () => onRowClick(row, abs) : undefined}
                      className={clickable ? "cursor-pointer hover:bg-muted/40" : undefined}
                      data-state={isSelected && "selected"}
                    >
                      {selectable && (
                        <TableCell className="w-8">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(v) => toggleRow(abs, !!v)}
                            aria-label="Select row"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      {visibleCols.map((col, cIdx) => {
                        const raw = col.accessorFn
                          ? col.accessorFn(row)
                          : getByPath(row, col.accessorKey as string);
                        const value = raw ?? emptyValue;
                        const align =
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                              ? "text-center"
                              : "";
                        const keyId = String(col.accessorKey ?? cIdx);
                        return (
                          <TableCell
                            key={`${keyId}-${cIdx}`}
                            className={`${col.className ?? ""} ${align}`}
                            role="cell"
                          >
                            {col.render ? col.render(value, row) : (value as React.ReactNode)}
                          </TableCell>
                        );
                      })}
                      {rowActions ? (
                        <TableCell className="text-right">{rowActions(row, abs)}</TableCell>
                      ) : null}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-4 py-3">
          <div className="text-muted-foreground flex-1 text-sm">
            {selected.size} of {filteredRows.length} row(s) selected.
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border px-2 text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
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
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}