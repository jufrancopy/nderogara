import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbo: false, // Deshabilitar Turbopack para mejor rendimiento
  experimental: {
    turbo: false
  }
};

export default nextConfig;
