import assert from "node:assert/strict";
import { test } from "node:test";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { installDatabaseStub } from "./database-stub";
import { MAX_UPLOAD_FILE_SIZE } from "@/config/upload";
import { validateUploadFiles } from "@/lib/upload-validation";
import { getS3Config } from "@/config/s3";

test("S3 upload route: session ownership, limits, URLs and safe failures without network", async (t) => {
  installDatabaseStub(t);
  const env = {
    S3_ENDPOINT: "https://s3.twcstorage.ru",
    S3_REGION: "ru-1",
    S3_BUCKET: "capy-print",
    S3_ACCESS_KEY_ID: "test-access-key",
    S3_SECRET_ACCESS_KEY: "test-secret-key",
    S3_PUBLIC_BASE_URL: "",
  };
  const previous = Object.fromEntries(
    Object.keys(env).map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const { prisma } = await import("@/lib/prisma");
  const session = t.mock.method(
    prisma.session,
    "findFirst",
    async (): Promise<any> => ({
      identity: { user: { id: 7, role: "USER" } },
    })
  );
  const send = t.mock.method(S3Client.prototype, "send", async () => ({}));
  const destroy = t.mock.method(S3Client.prototype, "destroy", () => {});
  const log = t.mock.method(console, "error", () => {});
  const { POST } = await import("@/app/api/uploads/route");
  const file = new File(["%PDF-test"], "Документ (1).pdf", {
    type: "application/pdf",
  });
  const token = "telegram_" + "a".repeat(43);
  const request = (files: File[], authenticated = true) => {
    const body = new FormData();
    files.forEach((value) => body.append("file", value));
    body.append("userId", "999");
    return new Request("https://app.test/api/uploads", {
      method: "POST",
      body,
      headers: authenticated ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  await t.test(
    "authentication is checked before file parsing or S3",
    async () => {
      assert.equal((await POST(request([file], false))).status, 401);
      assert.equal(send.mock.callCount(), 0);
      assert.equal(session.mock.callCount(), 0);
      session.mock.mockImplementationOnce(async () => null);
      assert.equal((await POST(request([file]))).status, 401);
      assert.equal(send.mock.callCount(), 0);
    }
  );

  await t.test(
    "successful PUT returns a permanent URL and records server identity",
    async () => {
      const response = await POST(request([file]));
      assert.equal(response.status, 201);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const result = await response.json();
      assert.match(
        result.url,
        /^https:\/\/s3\.twcstorage\.ru\/capy-print\/uploads\/7\/[a-f0-9-]+\.pdf$/
      );
      assert.deepEqual(
        { ...result, url: undefined },
        { url: undefined, name: file.name, size: file.size, type: file.type }
      );
      const call = send.mock.calls.at(-1)!;
      const command = call.arguments[0] as unknown as PutObjectCommand;
      assert.ok(command instanceof PutObjectCommand);
      assert.equal(command.input.Bucket, "capy-print");
      assert.equal(command.input.Metadata?.uploadedBy, "7");
      assert.equal(command.input.ContentType, file.type);
      assert.equal(command.input.ContentLength, file.size);
      assert.deepEqual(
        command.input.Body,
        new Uint8Array(await file.arrayBuffer())
      );
      assert.ok(
        command.input.ContentDisposition?.includes(
          encodeURIComponent("Документ")
        )
      );
      const client = call.this as S3Client;
      assert.equal(await client.config.region(), "ru-1");
      assert.equal(client.config.forcePathStyle, true);
      assert.equal(
        (await client.config.credentials()).accessKeyId,
        env.S3_ACCESS_KEY_ID
      );
      const again = await (await POST(request([file]))).json();
      assert.notEqual(again.url, result.url);
      assert.equal(destroy.mock.callCount(), 2);
    }
  );

  await t.test(
    "invalid MIME, empty, oversized and multiple files never reach S3",
    async () => {
      const before = send.mock.callCount();
      for (const files of [
        [],
        [file, file],
        [new File(["binary"], "bad.exe", { type: "application/x-executable" })],
        [new File([], "empty.pdf", { type: "application/pdf" })],
        [
          new File([new Uint8Array(MAX_UPLOAD_FILE_SIZE + 1)], "large.pdf", {
            type: "application/pdf",
          }),
        ],
      ])
        assert.equal((await POST(request(files))).status, 400);
      assert.equal(send.mock.callCount(), before);
      const oversizedHeader = request([file]);
      oversizedHeader.headers.set(
        "content-length",
        String(MAX_UPLOAD_FILE_SIZE + 100_000)
      );
      assert.equal((await POST(oversizedHeader)).status, 400);
      const tooLargeBody = request([file]);
      const response = new Response(
        new Uint8Array(MAX_UPLOAD_FILE_SIZE + 100_000)
      );
      const streamed = new Request(tooLargeBody.url, {
        method: "POST",
        headers: tooLargeBody.headers,
        body: response.body,
        // Node requires duplex for streamed requests.
        duplex: "half",
      } as RequestInit);
      assert.equal((await POST(streamed)).status, 400);
      assert.equal(send.mock.callCount(), before);
    }
  );

  await t.test("malformed multipart is a client error", async () => {
    const before = send.mock.callCount();
    const malformed = request([file]);
    malformed.headers.set("content-type", "multipart/form-data;");
    assert.equal((await POST(malformed)).status, 400);
    const body = new FormData();
    body.append("file", "not a file");
    const response = await POST(
      new Request("https://app.test/api/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
    );
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "Загрузите один файл за запрос",
    });
    assert.equal(send.mock.callCount(), before);
  });

  await t.test(
    "SDK failure gives no success URL and leaks no credentials",
    async () => {
      send.mock.mockImplementationOnce(async () => {
        throw new Error(env.S3_SECRET_ACCESS_KEY);
      });
      const response = await POST(request([file]));
      assert.equal(response.status, 502);
      const text = await response.text();
      assert.ok(!text.includes(env.S3_SECRET_ACCESS_KEY));
      assert.ok(
        !JSON.stringify(log.mock.calls).includes(env.S3_SECRET_ACCESS_KEY)
      );
      assert.equal(destroy.mock.callCount(), 3);
    }
  );

  await t.test(
    "public URL override is supported; missing keys fail without S3 calls",
    async () => {
      process.env.S3_PUBLIC_BASE_URL = "https://cdn.test/files";
      const result = await (await POST(request([file]))).json();
      assert.ok(result.url.startsWith("https://cdn.test/files/uploads/7/"));
      const before = send.mock.callCount();
      delete process.env.S3_SECRET_ACCESS_KEY;
      assert.equal((await POST(request([file]))).status, 502);
      assert.equal(send.mock.callCount(), before);
      process.env.S3_SECRET_ACCESS_KEY = env.S3_SECRET_ACCESS_KEY;
      process.env.S3_PUBLIC_BASE_URL = "https://cdn.test/?secret=bad";
      assert.throws(getS3Config, /S3_INVALID_URL/);
    }
  );
});

test("file validation permits exact size boundary and rejects more than 20 files", () => {
  const metadata = {
    name: "test.pdf",
    size: MAX_UPLOAD_FILE_SIZE,
    type: "application/pdf",
  };
  assert.doesNotThrow(() => validateUploadFiles(Array(20).fill(metadata)));
  assert.throws(() => validateUploadFiles(Array(21).fill(metadata)), /20/);
  assert.throws(() => validateUploadFiles([{ ...metadata, name: " " }]), /имя/);
  for (const size of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => validateUploadFiles([{ ...metadata, size }]));
});
