import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 상위 폴더의 lockfile을 워크스페이스 루트로 오인하지 않도록 고정
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
