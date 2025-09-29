import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SimpleColumn<T extends Record<string, any>> = {
  header: React.ReactNode;
  accessorKey?: keyof T | string;
  accessorFn?: (row: T) => unknown;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  hidden?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
};

export type DataTableProps<T extends Record<string, any>> = {
  data?: T[];
  columns?: SimpleColumn<T>[];
  defaultData?: T[];
  caption?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  emptyValue?: React.ReactNode;
  rowActions?: (row: T, rowIndex: number) => React.ReactNode;
};

/** Safely resolve a dotted or bracket path like "user.name" or "phones[0]" */
function getByPath(obj: any, path?: unknown) {
  if (path == null || path === "") return undefined;
  if (typeof path !== "string") return obj?.[path as any];
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  return parts.reduce((acc: any, seg: string) => {
    if (acc == null) return undefined;
    const k: any = /^\d+$/.test(seg) ? Number(seg) : seg;
    return acc?.[k];
  }, obj);
}

/** Turn camelCase_or_snake-case into a nicer label like "Camel case or snake case" */
function prettify(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** If no columns are provided, infer them automatically from the first row */
function inferColumns<T extends Record<string, any>>(sample: T): SimpleColumn<T>[] {
  return Object.keys(sample).map((k) => ({
    header: prettify(k),
    accessorKey: k,
    sortable: true,
  })) as SimpleColumn<T>[];
}

type Sort = { index: number; dir: "asc" | "desc" } | null;

/** Main DataTable component — renders rows/columns, supports simple click-to-sort */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  defaultData,
  caption,
  className,
  ariaLabel = "Data table",
  emptyValue = <span className="text-muted-foreground">—</span>,
  rowActions,
}: DataTableProps<T>) {
  // Pick data to render: prefer `data`, else fallback to `defaultData`, else []
  const rows = React.useMemo<T[]>(() => {
    if (data && data.length) return data;
    if (defaultData && defaultData.length) return defaultData as T[];
    return [] as T[];
  }, [data, defaultData]);

  // Either use given columns or infer them from the first row
  const visibleCols = React.useMemo<SimpleColumn<T>[]>(() => {
    const provided = (columns ?? []).filter((c) => !c.hidden);
    if (provided.length) return provided;
    if (rows.length) return inferColumns(rows[0] as T);
    return [];
  }, [columns, rows]);

  const [sort, setSort] = React.useState<Sort>(null);

  // Apply sorting when a header is clicked
  const sortedRows = React.useMemo(() => {
    if (!rows.length || !visibleCols.length || !sort) return rows;
    const col = visibleCols[sort.index];
    const getter = (r: T) =>
      col.accessorFn ? col.accessorFn(r) : getByPath(r, col.accessorKey as any);

    const copy = [...rows];
    copy.sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);

      const na = va instanceof Date ? va.getTime() : (va as any);
      const nb = vb instanceof Date ? vb.getTime() : (vb as any);

      if (na == null && nb == null) return 0;
      if (na == null) return 1;
      if (nb == null) return -1;

      if (typeof na === "number" && typeof nb === "number") {
        return sort.dir === "asc" ? na - nb : nb - na;
      }

      const sa = String(na).toLowerCase();
      const sb = String(nb).toLowerCase();
      if (sa < sb) return sort.dir === "asc" ? -1 : 1;
      if (sa > sb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });

    return copy;
  }, [rows, visibleCols, sort]);

  /** Flip sorting state for a column (asc → desc → off) */
  function toggleSort(i: number, enable: boolean) {
    if (!enable) return;
    setSort((prev) => {
      if (!prev || prev.index !== i) return { index: i, dir: "asc" };
      if (prev.dir === "asc") return { index: i, dir: "desc" };
      return null; // off
    });
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {caption ? <div className="px-4 py-3 text-sm text-muted-foreground">{caption}</div> : null}

        <Table aria-label={ariaLabel} role="table">
          <TableHeader>
            <TableRow>
              {visibleCols.map((col, i) => {
                const isActive = sort?.index === i;
                const align =
                  col.align === "right" ? "text-right" :
                    col.align === "center" ? "text-center" : "";
                const keyId = String(col.accessorKey ?? i);

                const ariaSort: React.AriaAttributes["aria-sort"] =
                  !col.sortable || !isActive ? "none" :
                    sort!.dir === "asc" ? "ascending" : "descending";

                return (
                  <TableHead
                    key={`${keyId}-${i}`}
                    className={`font-semibold ${align} ${col.sortable ? "cursor-pointer select-none" : ""}`}
                    onClick={() => toggleSort(i, !!col.sortable)}
                    onKeyDown={(e) => {
                      if (!col.sortable) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSort(i, true);
                      }
                    }}
                    role="columnheader"
                    aria-sort={ariaSort}
                    tabIndex={col.sortable ? 0 : -1}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        isActive ? (
                          sort!.dir === "asc" ? (
                            <ArrowUp className="h-4 w-4 opacity-70" />
                          ) : (
                            <ArrowDown className="h-4 w-4 opacity-70" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )
                      )}
                    </div>
                  </TableHead>
                );
              })}
              {rowActions ? <TableHead className="w-0" /> : null}
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleCols.length + (rowActions ? 1 : 0)} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row, rIdx) => (
                <TableRow key={rIdx} role="row">
                  {visibleCols.map((col, cIdx) => {
                    const raw = col.accessorFn ? col.accessorFn(row) : getByPath(row, col.accessorKey as any);
                    const value = raw ?? emptyValue;
                    const align =
                      col.align === "right" ? "text-right" :
                        col.align === "center" ? "text-center" : "";
                    const keyId = String(col.accessorKey ?? cIdx);

                    return (
                      <TableCell key={`${keyId}-${cIdx}`} className={`${col.className ?? ""} ${align}`} role="cell">
                        {col.render ? col.render(value, row) : (value as any)}
                      </TableCell>
                    );
                  })}
                  {rowActions ? (
                    <TableCell className="text-right">{rowActions(row, rIdx)}</TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}