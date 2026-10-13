import type { NextConfig } from "next";

const miniAppHostname = process.env.NEXT_PUBLIC_MINI_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_MINI_APP_URL.trim()).hostname
  : undefined;

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...(miniAppHostname ? [miniAppHostname] : []),
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.trycloudflare.com",
    "*.ru.tuna.am",
  ],
};

export default nextConfig;
