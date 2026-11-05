import { PrismaClient } from "@prisma/client";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const db =
  globalDb.prisma ??
  new PrismaClient({
    log:
      process.env.QUERY_LOG === "1" ? [{ emit: "stdout", level: "query" }] : [],
  });
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
