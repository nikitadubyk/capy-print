// Only known transport codes are logged; raw errors can expose tokens and message data.
export const notificationTransportCodes = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNABORTED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  "ERR_NETWORK",
  "ERR_BAD_REQUEST",
  "ERR_BAD_RESPONSE",
  "ERR_CANCELED",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "CERT_HAS_EXPIRED",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
]);

export const telegramFailureReasons = [
  { pattern: /message is too long/i, reason: "message_too_long" },
  { pattern: /parse entities/i, reason: "invalid_markup" },
  { pattern: /chat not found/i, reason: "chat_not_found" },
  { pattern: /bot was blocked/i, reason: "bot_blocked" },
  {
    pattern: /not enough rights|administrator/i,
    reason: "insufficient_rights",
  },
  { pattern: /migrat|upgraded/i, reason: "chat_migrated" },
];
