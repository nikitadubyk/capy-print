import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "@/app/theme-provider";
import { OrderDetails } from "@/components/order-details";
import { OrderStatus } from "@/app/generated/prisma/enums";
import { type Order, Urgency } from "@/types";

const order: Order = {
  id: 41,
  isFirstOrder: false,
  discountPercent: 0,
  createdAt: new Date("2026-10-10T08:00:00Z"),
  status: OrderStatus.PENDING,
  urgency: Urgency.ASAP,
  printJobs: [],
  user: {
    id: 7,
    completedOrdersCount: 0,
    firstName: "Тестовый",
    lastName: "Клиент",
    username: null,
    telegramId: null,
    identities: [{ provider: "VK", externalUserId: "123" }],
  },
};

test("customer order details omit customer identity and contact actions by default", () => {
  const html = renderToStaticMarkup(
    createElement(
      ThemeProvider,
      null,
      createElement(OrderDetails, { data: order })
    )
  );
  assert.ok(html.includes("Детали заказа"));
  assert.ok(html.includes("Срочность"));
  assert.ok(!html.includes("Открыть профиль"));
  assert.ok(!html.includes("Написать клиенту"));
  assert.ok(!html.includes("Тестовый"));
  assert.ok(!html.includes("vk.com"));
});

test("administrator order details retain customer identity and contact actions", () => {
  const html = renderToStaticMarkup(
    createElement(
      ThemeProvider,
      null,
      createElement(OrderDetails, { data: order, isAdmin: true })
    )
  );
  assert.ok(html.includes("Тестовый"));
  assert.ok(html.includes("Открыть профиль"));
  assert.ok(html.includes("Написать клиенту"));
  assert.ok(html.includes('href="https://vk.com/id123"'));
  assert.ok(html.includes('href="https://vk.com/im?sel=123"'));
});

test("saved first order displays the discount and mandatory staff reminder only in admin view", () => {
  for (const isAdmin of [false, true]) {
    const html = renderToStaticMarkup(
      createElement(
        ThemeProvider,
        null,
        createElement(OrderDetails, {
          data: { ...order, isFirstOrder: true, discountPercent: 15 },
          isAdmin,
        })
      )
    );
    assert.ok(html.includes("15%"));
    assert.equal(html.includes("Обязательно примените скидку"), isAdmin);
  }
  const html = renderToStaticMarkup(
    createElement(
      ThemeProvider,
      null,
      createElement(OrderDetails, { data: order, isAdmin: true })
    )
  );
  assert.ok(!html.includes("15%"));
});
