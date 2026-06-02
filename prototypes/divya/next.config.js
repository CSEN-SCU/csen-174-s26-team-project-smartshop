/** @type {import('next').NextConfig} */

/**
 * Security headers for the demo deployment.
 * We intentionally omit Content-Security-Policy: Next.js App Router relies on
 * inline hydration scripts; a strict script-src 'self' blocks the client bundle
 * and leaves auth stuck on "Checking session...".
 */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/cheaper-alternatives",
        destination: "/similar-alternatives",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
