import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL обязателен");
  const target = new URL(connectionString);
  if (
    !["localhost", "127.0.0.1", "db"].includes(target.hostname) ||
    target.pathname !== "/capy_print_dev"
  ) {
    throw new Error(
      "Этот seed предназначен только для локальной базы capy_print_dev"
    );
  }
  const vkId = process.env.SEED_VK_USER_ID?.trim();
  if (vkId && !/^[1-9]\d*$/.test(vkId))
    throw new Error("SEED_VK_USER_ID должен быть числовым VK ID");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    for (const account of [
      {
        externalUserId: vkId || "seed-admin",
        firstName: "Тестовый сотрудник",
        role: "ADMIN" as const,
      },
      {
        externalUserId: "seed-customer",
        firstName: "Тестовый клиент",
        role: "USER" as const,
      },
    ]) {
      const identity = await prisma.userIdentity.upsert({
        where: {
          provider_externalUserId: {
            provider: "VK",
            externalUserId: account.externalUserId,
          },
        },
        create: {
          provider: "VK",
          externalUserId: account.externalUserId,
          user: {
            create: { firstName: account.firstName, role: account.role },
          },
        },
        update: { user: { update: { role: account.role } } },
      });
      const comment = `Seed: ${account.role}`;
      const existing = await prisma.order.findFirst({
        where: { userId: identity.userId, comment },
      });
      if (!existing)
        await prisma.order.create({
          data: {
            userId: identity.userId,
            comment,
            status: "PENDING",
            urgency: "ASAP",
            printJobs: { create: { copies: 2, paperSize: "A4Basic" } },
          },
        });
    }
    console.log(
      "Seed готов: два тестовых VK-пользователя и их заказы. Сообщения не отправлялись."
    );
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(() => {
  console.error(
    "Seed не выполнен. Проверьте локальную базу, миграции и SEED_VK_USER_ID."
  );
  process.exitCode = 1;
});
