import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient guardado en globalThis. Dos motivos:
// 1) dev (tsx watch): evita abrir un pool nuevo en cada recarga.
// 2) prod serverless (Vercel): reutiliza el cliente entre invocaciones "warm"
//    de la misma función → no agota las conexiones de Neon. Por eso lo guardamos
//    SIEMPRE (no solo en dev): crear un cliente por invocación es el fallo clásico
//    de conexiones en FaaS.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = db;
