
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'www.virtuscarrentalsrl.com',
      },
       {
        protocol: 'https',
        hostname: 'virtus-version-ok.appspot.com',
      },
      {
        protocol: 'https',
        hostname: 'virtus-version-ok.firebasestorage.app',
      }
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  devIndicators: {
    allowedDevOrigins: [
      "*.cloudworkstations.dev",
      "*.firebase.dev"
    ],
  },
};

export default nextConfig;
