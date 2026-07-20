/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // self-contained server bundle for small Docker images
  output: "standalone",
  // keep Prisma out of the bundle; it runs only in server route handlers
  serverExternalPackages: ["@prisma/client", "prisma"],
  // pin the workspace root (several lockfiles exist above this dir)
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
