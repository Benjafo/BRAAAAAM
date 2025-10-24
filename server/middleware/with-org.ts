import { NextFunction, Request, RequestHandler, Response } from 'express';
import { getOrCreateOrgDb } from '../drizzle/pool-manager.js';

export const withOrg: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
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
        const db = getOrCreateOrgDb(subdomain);
        req.org = { subdomain, db }
        next();
    } catch (error: any) {
        next(error);
    }
}