import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, extname, normalize, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const port = Number(process.env['PORT'] ?? '3100');
const host = process.env['HOST'] ?? '127.0.0.1';

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

const methaneWorkspacePlugin = {
  name: 'methane-workspace-resolve',
  setup(build) {
    build.onResolve({ filter: /^@methane\// }, (args) => {
      const parts = args.path.replace(/^@methane\//, '').split('/');
      const pkgName = parts[0];
      const subpath = parts.slice(1).join('/');
      const target = subpath
        ? resolve(repoRoot, `packages/${pkgName}/dist/${subpath}.js`)
        : resolve(repoRoot, `packages/${pkgName}/dist/index.js`);
      return { path: target };
    });
  },
};

const buildResult = await esbuild.build({
  entryPoints: [resolve(__dirname, 'fixtures/entry.ts')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  sourcemap: 'inline',
  write: false,
  plugins: [methaneWorkspacePlugin],
  nodePaths: [
    resolve(repoRoot, 'node_modules'),
    resolve(repoRoot, 'packages/core/node_modules'),
    resolve(repoRoot, 'packages/primitives/node_modules'),
    resolve(repoRoot, 'packages/ui/node_modules'),
    resolve(repoRoot, 'packages/sanitize/node_modules'),
  ],
});

const bundleJs = buildResult.outputFiles[0]?.text ?? '';
const tokensCssPath = resolve(repoRoot, 'packages/tokens/dist/tokens.css');
const indexCssPath = resolve(repoRoot, 'packages/css/dist/index.css');

const HARNESS_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Methane UI Browser E2E Harness</title>
    <link rel="stylesheet" href="/tokens.css" />
    <link rel="stylesheet" href="/css.css" />
    <style>
      body {
        margin: 0;
        padding: 32px;
        font-family: var(--mth-font-sans, system-ui, sans-serif);
        background: var(--mth-color-bg, Canvas);
        color: var(--mth-color-fg, CanvasText);
      }
      #harness-root {
        display: grid;
        gap: 24px;
        max-inline-size: 960px;
      }
    </style>
    <script type="module" src="/bundle.js"></script>
  </head>
  <body>
    <main id="harness-root"></main>
  </body>
</html>
`;

const server = createServer((req, res) => {
  const reqUrl = new URL(req.url ?? '/', `http://${host}:${port}`);
  const pathname = reqUrl.pathname;

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(HARNESS_HTML);
    return;
  }

  if (pathname === '/bundle.js') {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' });
    res.end(bundleJs);
    return;
  }

  if (pathname === '/tokens.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' });
    res.end(readFileSync(tokensCssPath, 'utf8'));
    return;
  }

  if (pathname === '/css.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' });
    res.end(readFileSync(indexCssPath, 'utf8'));
    return;
  }

  // Optional safe static fallback for dist/node_modules assets
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const fullPath = resolve(repoRoot, `.${safePath}`);
  if (fullPath.startsWith(repoRoot)) {
    try {
      const content = readFileSync(fullPath);
      const mime = MIME_TYPES.get(extname(fullPath)) ?? 'application/octet-stream';
      res.writeHead(200, { 'content-type': mime });
      res.end(content);
      return;
    } catch {
      // Fall through to 404
    }
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(port, host, () => {
  process.stdout.write(`Methane E2E server listening at http://${host}:${port}\n`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
