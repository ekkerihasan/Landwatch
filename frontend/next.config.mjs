/** @type {import('next').NextConfig} */
const nextConfig = {
  // Frontend will call FastAPI at NEXT_PUBLIC_API_URL
  // For local dev, set NEXT_PUBLIC_API_URL=http://localhost:8000
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};
export default nextConfig;
