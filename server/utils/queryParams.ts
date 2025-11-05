/* eslint-disable @typescript-eslint/no-explicit-any */

import { asc, desc, ilike, or, sql } from "drizzle-orm";
import { Request } from "express";

export interface QueryModifiers {
    where: any;
    orderBy: any[];
    limit: number;
    offset: number;
    page: number;
    pageSize: number;
}

export function applyQueryFilters(req: Request, searchableColumns: any[]): QueryModifiers {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 100);
    const search = (req.query.search as string)?.trim() || "";
    const sortParam = (req.query.sort as string)?.trim() || "";
    const offset = (page - 1) * pageSize;

    // Search
    const where =
        search && searchableColumns.length > 0
            ? or(...searchableColumns.map((col) => ilike(col, `%${search}%`)))
            : sql`TRUE`;

    // Sort
    const orderBy: any[] = []; // Always initialized as array
    if (sortParam) {
        const [field, direction] = sortParam.split(":");
        const col = searchableColumns.find((c: any) => c.name === field);
        if (col) {
            orderBy.push(direction === "desc" ? desc(col) : asc(col));
        }
    }

    return { where, orderBy, limit: pageSize, offset, page, pageSize };
}
