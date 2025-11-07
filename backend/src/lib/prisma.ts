// backend/src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? [] : ["query", "error", "warn"],
});

// OPTIONAL: contoh helper sederhana
export async function now() {
  return new Date();
}
