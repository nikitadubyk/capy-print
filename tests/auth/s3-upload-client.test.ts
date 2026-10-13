import assert from "node:assert/strict";
import { test } from "node:test";
import { apiInstance } from "@/store/api/instance";
import { uploadFiles } from "@/store/api/uploads";
import { prepareOrderWithUploads } from "@/app/order/helpers";
import { PaperSize, Urgency } from "@/types";

test("client uploads preserve order, await confirmation and report progress", async (t) => {
  const files = [1, 2].map(
    (size) =>
      new File(["x".repeat(size)], `${size}.pdf`, { type: "application/pdf" })
  );
  const progress: number[] = [];
  const post = t.mock.method(
    apiInstance,
    "post",
    async (url: string, body: FormData, config: any) => {
      assert.equal(url, "uploads");
      assert.equal(config.timeout, 120_000);
      const file = body.get("file") as File;
      config.onUploadProgress({ loaded: 100, total: 100 });
      assert.ok(progress.at(-1)! < 100);
      return {
        data: {
          url: `https://storage.test/${file.name}`,
          name: file.name,
          size: file.size,
          type: file.type,
        },
      };
    }
  );
  const uploaded = await uploadFiles(files, (value) => progress.push(value));
  assert.deepEqual(
    uploaded.map((file) => file.name),
    files.map((file) => file.name)
  );
  assert.equal(post.mock.callCount(), 2);
  assert.equal(progress.at(-1), 100);
  assert.deepEqual(
    [...progress].sort((a, b) => a - b),
    progress
  );
});

test("client rejects partial confirmation and upload errors before creating an order", async (t) => {
  const file = new File(["pdf"], "test.pdf", { type: "application/pdf" });
  const post = t.mock.method(apiInstance, "post", async () => ({ data: {} }));
  await assert.rejects(
    uploadFiles([file], () => {}),
    /подтверждение/
  );
  post.mock.mockImplementationOnce(async () => {
    throw new Error("S3 unavailable");
  });
  await assert.rejects(
    uploadFiles([file], () => {}),
    /S3 unavailable/
  );
  let called = false;
  await assert.rejects(
    prepareOrderWithUploads(
      {
        urgency: Urgency.ASAP,
        printJobs: [
          {
            copies: 1,
            duplex: false,
            isColor: false,
            paperSize: PaperSize.A4Basic,
            files: Array(21).fill(file),
          },
        ],
      },
      async () => {
        called = true;
        return [];
      }
    ),
    /20/
  );
  assert.equal(called, false);
});
