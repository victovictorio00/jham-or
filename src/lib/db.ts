import { PrismaClient } from "@prisma/client";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const db =
  globalDb.prisma ??
  new PrismaClient({
    log:
      process.env.QUERY_LOG === "1" ? [{ emit: "stdout", level: "query" }] : [],
  });
globalDb.prisma = db;
