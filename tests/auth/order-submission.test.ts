import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareOrderWithUploads } from "@/app/order/helpers";
import { getErrorDiagnostics } from "@/lib/error-diagnostics";
import { PaperSize, Urgency } from "@/types";

const file = new File(["image"], "photo.png", { type: "image/png" });
const data = {
  urgency: Urgency.ASAP,
  comment: "Сохранить поля",
  printJobs: [
    {
      copies: 2,
      paperSize: PaperSize.A4Basic,
      isColor: true,
      duplex: false,
      files: [file],
    },
  ],
};
const uploaded = {
  ufsUrl: "https://example.test/photo.png",
  name: file.name,
  size: file.size,
  type: file.type,
};

test("failed, empty and partial uploads reject and preserve form data", async () => {
  for (const result of [undefined, [], [uploaded, uploaded]]) {
    await assert.rejects(
      prepareOrderWithUploads(data, async () => result),
      /Не удалось загрузить все файлы/
    );
    assert.equal(data.printJobs[0].files[0], file);
    assert.equal(data.comment, "Сохранить поля");
  }
});

test("upload error propagates unchanged for logging", async () => {
  const sdkError = Object.assign(new Error("Callback failed"), {
    code: "UPLOAD_FAILED",
  });
  await assert.rejects(
    prepareOrderWithUploads(data, async () => {
      throw sdkError;
    }),
    (error) => error === sdkError
  );
});

test("missing file URL is reported instead of preparing an incomplete order", async () => {
  await assert.rejects(
    prepareOrderWithUploads(data, async () => [{ ...uploaded, ufsUrl: "" }]),
    /Не удалось получить ссылку на файл/
  );
});

test("confirmed file URL and print settings are preserved", async () => {
  const payload = await prepareOrderWithUploads(data, async () => [uploaded]);
  assert.equal(payload.printJobs[0].files[0].fileUrl, uploaded.ufsUrl);
  assert.equal(payload.printJobs[0].files[0].mimeType, file.type);
  assert.equal(payload.printJobs[0].copies, 2);
});

test("already uploaded files do not cause an empty upload request", async () => {
  const existing = {
    fileUrl: uploaded.ufsUrl,
    fileName: uploaded.name,
    fileSize: uploaded.size,
    mimeType: uploaded.type,
  };
  const payload = await prepareOrderWithUploads(
    { ...data, printJobs: [{ ...data.printJobs[0], files: [existing] }] },
    async () => {
      throw new Error("Must not re-upload stored files");
    }
  );
  assert.equal(payload.printJobs[0].files[0], existing);
});

test("diagnostics retain HTTP errors without credentials or signed URLs", () => {
  const error = Object.assign(
    new Error(
      'Failed https://example.test/file?signature=secret-sign Bearer secret-bearer token=secret-token telegram_secret-session postgresql://user:secret-pass@db/test {"token":"secret-json-token"}'
    ),
    {
      code: "ERR_BAD_RESPONSE",
      response: {
        status: 500,
        data: {
          error: "Внутренняя ошибка сервера",
          fileName: "private-photo.png",
        },
      },
      config: { headers: { Authorization: "secret-header" } },
      cause: new Error(
        "Failed https://example.test/upload?secret=secret-cause"
      ),
    }
  );
  const details = getErrorDiagnostics(error);
  assert.equal(details.code, "ERR_BAD_RESPONSE");
  assert.equal(details.status, 500);
  assert.equal(details.serverMessage, "Внутренняя ошибка сервера");
  const serialized = JSON.stringify(details);
  for (const secret of [
    "secret-sign",
    "secret-bearer",
    "secret-token",
    "secret-session",
    "secret-pass",
    "secret-header",
    "private-photo.png",
    "secret-cause",
    "secret-json-token",
  ])
    assert.equal(serialized.includes(secret), false, secret);
});
