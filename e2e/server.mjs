import { createServer } from 'node:http';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

function findWorkspacePackageDir(pkgName) {
  const candidates = [
    resolve(repoRoot, `packages/${pkgName}`),
    resolve(repoRoot, `packages/kits/${pkgName}`),
    resolve(repoRoot, `packages/satellites/${pkgName}`),
  ];
  for (const dir of candidates) {
    if (existsSync(resolve(dir, 'package.json'))) {
      return dir;
    }
  }
  return resolve(repoRoot, `packages/${pkgName}`);
}

function collectNodePaths() {
  const paths = [resolve(repoRoot, 'node_modules')];
  for (const base of ['packages', 'packages/kits', 'packages/satellites']) {
    const baseDir = resolve(repoRoot, base);
    if (!existsSync(baseDir)) continue;
    for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const nm = resolve(baseDir, entry.name, 'node_modules');
      if (existsSync(nm)) {
        paths.push(nm);
      }
    }
  }
  return paths;
}

function resolveExportTarget(pkgDir, subpath) {
  const pkgJsonPath = resolve(pkgDir, 'package.json');
  const exportKey = subpath ? `./${subpath}` : '.';
  if (existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    const exportsMap = pkgJson.exports ?? {};
    const extractDefault = (entry) =>
      typeof entry === 'string' ? entry : (entry?.default ?? entry?.import ?? null);

    if (Object.prototype.hasOwnProperty.call(exportsMap, exportKey)) {
      const target = extractDefault(exportsMap[exportKey]);
      if (target) return resolve(pkgDir, target);
    }

    for (const [pattern, value] of Object.entries(exportsMap)) {
      const starIdx = pattern.indexOf('*');
      if (starIdx === -1) continue;
      const prefix = pattern.slice(0, starIdx);
      const suffix = pattern.slice(starIdx + 1);
      if (exportKey.startsWith(prefix) && exportKey.endsWith(suffix)) {
        const matched = exportKey.slice(prefix.length, exportKey.length - suffix.length);
        const template = extractDefault(value);
        if (template) {
          return resolve(pkgDir, template.replaceAll('*', matched));
        }
      }
    }
  }

  return subpath
    ? resolve(pkgDir, `dist/${subpath.replace(/\.js$/, '')}.js`)
    : resolve(pkgDir, 'dist/index.js');
}

const methaneWorkspacePlugin = {
  name: 'methane-workspace-resolve',
  setup(build) {
    build.onResolve({ filter: /^@methane-ui\// }, (args) => {
      const parts = args.path.replace(/^@methane-ui\//, '').split('/');
      const pkgName = parts[0];
      const subpath = parts.slice(1).join('/');
      const pkgDir = findWorkspacePackageDir(pkgName);
      return { path: resolveExportTarget(pkgDir, subpath) };
    });
  },
};

const nodePaths = collectNodePaths();

async function buildBundle(entryRelPath) {
  const result = await esbuild.build({
    entryPoints: [resolve(__dirname, entryRelPath)],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    sourcemap: 'inline',
    write: false,
    plugins: [methaneWorkspacePlugin],
    nodePaths,
  });
  return result.outputFiles[0]?.text ?? '';
}

const [bundleJs, bundleKitsJs, bundleSatellitesJs] = await Promise.all([
  buildBundle('fixtures/entry.ts'),
  buildBundle('fixtures/kits-entry.ts'),
  buildBundle('fixtures/satellites-entry.ts'),
]);

const tokensCssPath = resolve(repoRoot, 'packages/tokens/dist/tokens.css');
const indexCssPath = resolve(repoRoot, 'packages/css/dist/index.css');

function renderHarnessHtml({ kits = false, satellites = false } = {}) {
  const extraScripts = [
    kits ? '<script type="module" src="/bundle-kits.js"></script>' : '',
    satellites ? '<script type="module" src="/bundle-satellites.js"></script>' : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  return `<!doctype html>
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
    ${extraScripts}
  </head>
  <body>
    <main id="harness-root"></main>
  </body>
</html>
`;
}

const server = createServer((req, res) => {
  const reqUrl = new URL(req.url ?? '/', `http://${host}:${port}`);
  const pathname = reqUrl.pathname;

  if (pathname === '/' || pathname === '/index.html' || pathname === '/all' || pathname === '/kits' || pathname === '/satellites') {
    const all = pathname === '/all' || reqUrl.searchParams.get('all') === '1';
    const kits = all || pathname === '/kits' || reqUrl.searchParams.get('kits') === '1';
    const satellites = all || pathname === '/satellites' || reqUrl.searchParams.get('satellites') === '1';
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(renderHarnessHtml({ kits, satellites }));
    return;
  }

  if (pathname === '/bundle.js') {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' });
    res.end(bundleJs);
    return;
  }

  if (pathname === '/bundle-kits.js') {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' });
    res.end(bundleKitsJs);
    return;
  }

  if (pathname === '/bundle-satellites.js') {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' });
    res.end(bundleSatellitesJs);
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
