/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Reduces vendor-chunks instability with Radix UI during dev
    optimizePackageImports: [
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
    ],
  },
};

export default nextConfig;
