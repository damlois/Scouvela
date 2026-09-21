import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@scouvela/shared'],
  poweredByHeader: false,
  outputFileTracingRoot: path.join(fileURLToPath(new URL('.', import.meta.url)), '../..'),
};

export default nextConfig;
