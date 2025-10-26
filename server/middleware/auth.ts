// import { NextFunction, Response } from "express";
// import { AuthRequest } from "../types/auth.types.js";
// import { verifyAccessToken } from "../utils/jwt.js";

// export const authenticateToken = (
//     req: AuthRequest,
//     res: Response,
//     next: NextFunction
// ): Response | void => {
//     const authHeader = req.headers["authorization"];
//     const token = authHeader && authHeader.split(" ")[1];

//     if (!token) {
//         return res.status(401).json({ error: "Access token required" });
//     }

//     try {
//         const decoded = verifyAccessToken(token);
//         req.user = decoded;
//         next();
//     } catch (_error) {
//         return res.status(403).json({ error: "Invalid or expired token" });
//     }
// };
