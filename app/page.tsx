"use client";

import { useEffect, useState } from "react";
import { retrieveLaunchParams, init as initSDK } from "@telegram-apps/sdk";

export default function MiniPage() {
  const [lp, setLp] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      initSDK();

      const params = retrieveLaunchParams();
      console.log("LAUNCH PARAMS:", params);

      setLp(params);

      if (params?.tgWebAppData) {
        const initData = params.tgWebAppData?.user;
        console.log("INIT DATA:", initData);
        console.log("USER:", initData);
        setUserData(initData);
      }
    } catch (err) {
      console.error("Ошибка:", err);
      setError(err.message);
    }
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Mini App Debug</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <h2>User Data:</h2>
        <pre style={{ background: "#f5f5f5", padding: "10px" }}>
          {userData ? JSON.stringify(userData, null, 2) : "Нет данных"}
        </pre>
      </div>

      <div>
        <h2>Launch Params:</h2>
        <pre style={{ background: "#f5f5f5", padding: "10px" }}>
          {lp ? JSON.stringify(lp, null, 2) : "Нет данных"}
        </pre>
      </div>
    </div>
  );
}
