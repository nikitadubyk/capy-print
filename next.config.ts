import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.app", "*.trycloudflare.com"],
};

export default nextConfig;
