import dotenv from "dotenv";
dotenv.config();

export const config = {
    port: Number(process.env.PORT || process.env.BACKEND_PORT || 4000),

    db: {
        host: process.env.POSTGRES_HOST || "localhost",
        port: Number(process.env.POSTGRES_PORT || 5432),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    },
};
