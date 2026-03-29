import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for simple hosting
  // output: 'export',
  // distDir: 'dist',
  
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  
  // Required for Monaco Editor
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  
  // Experimental features
  experimental: {
    // Dynamic params handling
  },
};

export default nextConfig;
