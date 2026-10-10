const safeText = (value: unknown, limit = 500) =>
  typeof value === "string"
    ? value
        .replace(/(?:https?|postgres(?:ql)?):\/\/[^\s"'<>]+/gi, "[URL скрыт]")
        .replace(/Bearer\s+[^\s"',;]+/gi, "Bearer [скрыто]")
        .replace(/(?:vk|telegram)_[A-Za-z0-9_-]+/g, "[сессия скрыта]")
        .replace(
          /((?:authorization|token|signature|password|secret|sign)["']?\s*[=:]\s*)["']?[^\s,"';}]+/gi,
          "$1[скрыто]"
        )
        .slice(0, limit)
    : undefined;

const errorRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

// Log only diagnostic fields: raw SDK/Axios errors can contain tokens and signed URLs.
export const getErrorDiagnostics = (error: unknown) => {
  const record = errorRecord(error);
  const response = errorRecord(record.response);
  const data = errorRecord(response.data);
  const cause = errorRecord(record.cause);
  return {
    name: safeText(record.name, 100),
    code: safeText(record.code, 100),
    message:
      safeText(record.message) ??
      (typeof error === "string" ? safeText(error) : "Неизвестная ошибка"),
    status: typeof response.status === "number" ? response.status : undefined,
    serverMessage: safeText(data.error),
    ...(!!record.cause && {
      cause: {
        name: safeText(cause.name, 100),
        code: safeText(cause.code, 100),
        message: safeText(cause.message) ?? safeText(record.cause),
      },
    }),
  };
};
