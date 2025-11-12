/* eslint-disable @typescript-eslint/no-explicit-any */

import { and, asc, desc, ilike, or, sql } from "drizzle-orm";
import { Request } from "express";

export interface QueryModifiers {
    where: any;
    orderBy: any[];
    limit: number;
    offset: number;
    page: number;
    pageSize: number;
}

export function applyQueryFilters(
    req: Request,
    searchableColumns: any[],
    sortableColumns?: Record<string, any>,
    filterableColumns?: Record<string, any>
): QueryModifiers {
    const page = Math.max(parseInt(req.query.page as string) || 0, 0);
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 100);
    const search = (req.query.search as string)?.trim() || "";
    // DataTable sends sortBy and sortDir as separate params
    const sortBy = (req.query.sortBy as string)?.trim() || "";
    const sortDir = (req.query.sortDir as string)?.trim() || "asc";
    const offset = page * pageSize;

    const reservedParams = new Set(["page", "pageSize", "search", "sort", "sortBy", "sortDir"]);
    const whereConditions: any[] = [];

    // Global search
    if (search && searchableColumns.length > 0) {
        whereConditions.push(or(...searchableColumns.map((col) => ilike(col, `%${search}%`))));
    }

    // Column filters
    if (filterableColumns) {
        for (const [paramName, paramValue] of Object.entries(req.query)) {
            // Skip reserved params and empty values
            if (reservedParams.has(paramName) || !paramValue || typeof paramValue !== "string") {
                continue;
            }

            const trimmedValue = paramValue.trim();
            if (!trimmedValue) continue;

            const column = filterableColumns[paramName];
            if (column) {
                if (typeof column === "function") {
                    // For custom filter logic, pass a custom function
                    const condition = column(trimmedValue);
                    if (condition) {
                        whereConditions.push(condition);
                    }
                } else if (Array.isArray(column)) {
                    // For multiple columns, use OR logic
                    whereConditions.push(
                        or(...column.map((col) => ilike(col, `%${trimmedValue}%`)))
                    );
                } else {
                    // Single column
                    whereConditions.push(ilike(column, `%${trimmedValue}%`));
                }
            }
        }
    }

    // Combine all WHERE conditions with AND, or default to TRUE if none
    const where = whereConditions.length > 0 ? and(...whereConditions) : sql`TRUE`;

    // Sort
    const orderBy: any[] = [];
    let sortField = "";
    let sortDirection = "asc";
    if (sortBy) {
        sortField = sortBy;
        sortDirection = sortDir;
    }

    // Ensure the sort field is valid
    if (sortField) {
        let col = sortableColumns?.[sortField];
        if (col) {
            orderBy.push(sortDirection === "desc" ? desc(col) : asc(col));
        }
    }

    return { where, orderBy, limit: pageSize, offset, page, pageSize };
}
