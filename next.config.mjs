/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  // Spotify ya no acepta "localhost" como redirect URI de OAuth, así que el
  // flujo de desarrollo entra por 127.0.0.1 — hay que permitirlo explícitamente.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.scdn.co" }],
  },
};

export default nextConfig;
