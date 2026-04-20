import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
    path: path.resolve(__dirname, "../../../../.env"),
});

export interface JwtUser {
    user_id: string;
    customer_id: string;
    email: string;
    email_verified: boolean;
}

export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const token = req.cookies?.auth_token;
    if (!token) {
        console.log("middleware error")
        return res.status(401).json({ error: "unauthenticated" });
    }

    try {
        const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
        ) as Express.User;

        if (!decoded.email_verified) {
            return res.status(403).json({ error: "email_not_verified", code: "email_not_verified" });
        }

        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: "invalid_token" });
    }
}
