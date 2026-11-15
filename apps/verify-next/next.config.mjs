import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withMethaneNextConfig } from '@methane/ssr-next';

const g = globalThis;
if (typeof g.window === 'object' && g.window !== null && !g.window.location) {
  Object.defineProperty(g.window, 'location', {
    value: new URL('http://127.0.0.1:3101/'),
    configurable: true,
    writable: true,
  });
}

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = withMethaneNextConfig({
  reactStrictMode: true,
  outputFileTracingRoot: resolve(__dirname, '../..'),
});

export default nextConfig;
