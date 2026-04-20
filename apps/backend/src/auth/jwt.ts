import jwt, { SignOptions } from "jsonwebtoken";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
    path: path.resolve(__dirname, "../../../../.env"),
});

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"];

export function signJWT(user: {
    id: string;
    customer_id: string;
    email: string;
    email_verified: boolean;
}) {
    return jwt.sign(
        {
        user_id: user.id,
        customer_id: user.customer_id,
        email: user.email,
        email_verified: user.email_verified,
        },
        JWT_SECRET,
        {
        expiresIn: JWT_EXPIRES_IN,
        }
    );
}
