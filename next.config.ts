import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.trycloudflare.com",
    "*.ru.tuna.am",
  ],
};

export default nextConfig;
