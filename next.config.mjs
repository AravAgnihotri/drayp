import nextEnv from '@next/env';

// Load `.env` / `.env.local` / `.env.*` before the rest of the config so `process.env` matches files on disk.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV === 'development');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
