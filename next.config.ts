import type { NextConfig } from "next";

const nextConfig: NextConfig = {
allowedDevOrigins: ["206.189.129.78"],
typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
};

export default nextConfig;
