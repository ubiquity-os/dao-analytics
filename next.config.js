const { execSync } = require("child_process");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_KEY,
    SALT: process.env.SALT,
    commitHash: execSync(`git rev-parse --short HEAD`).toString().trim(),
    VANITY_ETH_PRIVATE_KEY: process.env.VANITY_ETH_PRIVATE_KEY,
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatars.githubusercontent.com",
        protocol: "https",
      },
    ],
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

module.exports = nextConfig;
