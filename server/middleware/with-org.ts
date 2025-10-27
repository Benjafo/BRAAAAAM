import { NextFunction, Request, RequestHandler, Response } from 'express';
import { getOrCreateOrgDb } from '../drizzle/pool-manager.js';
import { getSysDb } from '../drizzle/sys-client.js';
import { organizations } from '../drizzle/sys/schema.js';
import { eq } from 'drizzle-orm';

export const withOrg: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.header('x-org-subdomain');
    let subdomain = header;

    // if not in header, try to extract from url (in host)
    if(!subdomain) {

        const host = req.headers.host || '';
        const parts = host.split(':')[0].split('.');
        if (parts.length > 2) subdomain = parts[0];
        subdomain = req.params.orgId || subdomain;
    }

    if (!subdomain) {
        res.status(400).json({ error: "Missing organization subdomain" });
        return;
    }

    try {
        const sysDb = getSysDb();
        const organization = await sysDb.query.organizations.findFirst({
            where: eq(organizations.subdomain, subdomain)
        });

        if(!organization) {
            res.status(400).json({
                error: "Invalid x-org-subdomain"
            })
            return;
        }

        const db = getOrCreateOrgDb(organization.subdomain);
        req.org = { subdomain: organization.subdomain, db }
        next();
    } catch {
        res.status(500).json({
            error: "Internal server error"
        });
        return;
    }
}