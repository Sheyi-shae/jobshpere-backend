import { PrismaClient } from "../generated/prisma/index.js"; // Adjust the import path as necessary


const db = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

export default db;