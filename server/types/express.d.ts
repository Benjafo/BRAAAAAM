// src/types/express.d.ts
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as orgSchema from "../../drizzle/org/schema";

declare global {
  namespace Express {
    interface Request {
      org?: {
        subdomain: string;
        db: NodePgDatabase<typeof orgSchema>;
      };
    }
  }
}

export {};