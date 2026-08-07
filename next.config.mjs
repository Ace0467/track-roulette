/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.scdn.co" }],
  },
};

export default nextConfig;
