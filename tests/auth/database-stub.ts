import type { TestContext } from "node:test";

/** Install before importing routes. No connection string or real database is used. */
export function installDatabaseStub(t: TestContext) {
  const root = global as unknown as { prisma?: unknown };
  const previous = root.prisma;
  const unused = async (): Promise<any> => {
    throw new Error("Unexpected database call in test");
  };
  root.prisma = {
    user: { upsert: unused },
    userIdentity: { upsert: unused, findUniqueOrThrow: unused },
    session: { create: unused, findFirst: unused, deleteMany: unused },
    order: {
      create: unused,
      findFirst: unused,
      findUnique: unused,
      findMany: unused,
      count: unused,
      update: unused,
      delete: unused,
    },
  };
  t.after(() => {
    if (previous === undefined) delete root.prisma;
    else root.prisma = previous;
  });
}
