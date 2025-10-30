// src/types/express.d.ts
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
// import * as orgSchema from "../../drizzle/org/schema";

type OrgSchema = typeof import("../drizzle/org/schema.js");

declare global {
  namespace Express {
    interface Request {
      org?: {
        subdomain: string;
        db: NodePgDatabase<OrgSchema>;
      };
      user?: {
        id: string;
        email: string;
        db: string;
      }
    }
  }
}

export {};