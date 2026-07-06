/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse and @react-pdf/renderer are Node-only libraries. Keeping them
  // external prevents Next from trying to bundle their internals (which breaks
  // pdf-parse's dynamic test-file require and @react-pdf's font handling).
  serverExternalPackages: ["pdf-parse", "@react-pdf/renderer"],
  experimental: {
    // Allow larger request bodies for PDF uploads through Server Actions.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
