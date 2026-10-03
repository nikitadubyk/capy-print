import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareOrderWithUploads } from "@/app/order/helpers";
import { createOrderSchema } from "@/lib/order-validation";
import { Urgency, PaperSize } from "@/types";

test("uploaded order payload omits ASAP deadline and preserves scheduled date", async () => {
  const file = new File(["document"], "document.pdf", {
    type: "application/pdf",
  });
  const data = {
    comment: "",
    urgency: Urgency.ASAP,
    deadlineAt: "",
    printJobs: [
      {
        duplex: false,
        isColor: false,
        copies: 1,
        paperSize: PaperSize.A4Basic,
        files: [file],
      },
    ],
  };
  const upload = async (files: File[]) => {
    assert.deepEqual(files, [file]);
    return [
      {
        url: "https://utfs.io/f/test-document",
        name: file.name,
        size: file.size,
        type: file.type,
      },
    ];
  };
  for (const deadlineAt of ["", "2026-10-04T08:00:00.000Z"]) {
    const result = await prepareOrderWithUploads(
      { ...data, deadlineAt },
      upload
    );
    assert.equal(result.success, true);
    assert.equal(result.data.urgency, "ASAP");
    assert.equal(Object.hasOwn(result.data, "deadlineAt"), false);
    assert.equal(createOrderSchema.safeParse(result.data).success, true);
  }
  const deadlineAt = "2026-10-04T08:00:00.000Z";
  const scheduled = await prepareOrderWithUploads(
    { ...data, urgency: Urgency.SCHEDULED, deadlineAt },
    upload
  );
  assert.equal(scheduled.success, true);
  assert.equal(scheduled.data.deadlineAt, deadlineAt);
  assert.equal(createOrderSchema.safeParse(scheduled.data).success, true);
});
