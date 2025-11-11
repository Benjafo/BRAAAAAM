import { RequestHandler, Request, Response, NextFunction } from "express";
import orgAuthRouter from "../routes/api.org.auth.js";
import sysAuthRouter from "../routes/api.sys.auth.js";

export const withAuthRouting: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {

    const orgHeader = req.header("x-org-subdomain");

    if (orgHeader) {
        return orgAuthRouter(req, res, next);
    }

    return sysAuthRouter(req, res, next);
}