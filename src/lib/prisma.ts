import { PrismaClient } from "@prisma/client";

/** Bump when Prisma schema changes so dev hot-reload picks up new models/fields. */
const PRISMA_CLIENT_VERSION = 11;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion?: number;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function resetPrismaClient() {
  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  }
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaClientVersion = undefined;
}

export function isStalePrismaClientError(error: unknown) {
  return (
    error instanceof Error &&
    (/Unknown argument `/.test(error.message) ||
      /Invalid `prisma\..*` invocation/.test(error.message))
  );
}

function getPrisma() {
  const cached = globalForPrisma.prisma;
  const versionMatches = globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION;

  if (cached && versionMatches && "advertiserAutoresponder" in cached) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
