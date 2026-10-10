import assert from "node:assert/strict";
import { test } from "node:test";
import dayjs from "dayjs";
import {
  getDeadlineCalendarBounds,
  orderSchema,
  defaultPrintJob,
} from "@/app/order/config";
import { Urgency } from "@/types";

test("calendar limits whole days and does not clamp late times on the last day", () => {
  const now = dayjs("2026-10-10T12:00:00");
  const bounds = getDeadlineCalendarBounds(now);
  assert.equal(
    dayjs(bounds.minDate).format("YYYY-MM-DD HH:mm:ss"),
    "2026-10-10 00:00:00"
  );
  assert.equal(
    dayjs(bounds.maxDate).format("YYYY-MM-DD HH:mm:ss"),
    "2026-10-13 23:59:59"
  );
  assert.ok(now.add(3, "day").hour(18).isBefore(bounds.maxDate));
});

test("form rejects out-of-hours time without changing the selected deadline", () => {
  const deadline = [1, 2, 3]
    .map((offset) =>
      dayjs().add(offset, "day").hour(18).minute(30).second(0).millisecond(0)
    )
    .find((date) => date.day() !== 1)!;
  const deadlineAt = deadline.toISOString();
  const values = {
    urgency: Urgency.SCHEDULED,
    deadlineAt,
    printJobs: [
      {
        ...defaultPrintJob,
        files: [
          new File(["document"], "document.pdf", { type: "application/pdf" }),
        ],
      },
    ],
  };
  const result = orderSchema.safeParse(values);
  assert.equal(result.success, false);
  if (!result.success)
    assert.ok(
      result.error.issues.some(
        (issue) =>
          issue.path.join(".") === "deadlineAt" &&
          issue.message.includes("вне графика работы")
      )
    );
  assert.equal(values.deadlineAt, deadlineAt);
  assert.equal(dayjs(values.deadlineAt).format("HH:mm"), "18:30");
});
