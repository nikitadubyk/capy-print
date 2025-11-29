"use client";

import { useTelegram } from "@/context";

export default function Home() {
  const { user } = useTelegram();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Mini App Debug</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>User Data:</h2>
        <pre style={{ background: "#f5f5f5", padding: "10px" }}>
          {user ? JSON.stringify(user, null, 2) : "Нет данных"}
        </pre>
      </div>
    </div>
  );
}
