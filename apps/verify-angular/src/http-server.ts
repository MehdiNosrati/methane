import { existsSync, readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderVerifyAngularSsr } from './server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const browserDistDir = resolve(__dirname, '../verify-angular/browser');
const indexTemplatePath = resolve(browserDistDir, 'index.csr.html');
const cachedIndexTemplate = existsSync(indexTemplatePath)
  ? readFileSync(indexTemplatePath, 'utf8')
  : undefined;

const MIME_TYPES: Readonly<Record<string, string>> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

export function createAngularHttpServer(): Server {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const requestUrl = req.url ?? '/';
      const pathname = new URL(requestUrl, 'http://127.0.0.1').pathname;

      if (pathname !== '/' && !pathname.endsWith('.html')) {
        const assetPath = resolve(browserDistDir, `.${pathname}`);
        if (assetPath.startsWith(browserDistDir) && existsSync(assetPath)) {
          const ext = extname(assetPath);
          res.statusCode = 200;
          res.setHeader('content-type', MIME_TYPES[ext] ?? 'application/octet-stream');
          res.end(readFileSync(assetPath));
          return;
        }
      }

      const rendered = await renderVerifyAngularSsr({
        url: `http://localhost${pathname}`,
        ...(cachedIndexTemplate ? { document: cachedIndexTemplate } : {}),
        styles: 'inline',
        hydrationModuleUrl: '',
      });
      res.statusCode = 200;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(rendered.html);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end(error instanceof Error ? (error.stack ?? error.message) : String(error));
    }
  });
}

const isEntrypoint =
  typeof process.argv[1] === 'string' &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  const port = Number(process.env['PORT'] ?? 3103);
  const host = process.env['HOST'] ?? '127.0.0.1';
  const server = createAngularHttpServer();
  server.listen(port, host, () => {
    process.stdout.write(`Methane Angular SSR server listening on http://${host}:${port}\n`);
  });

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      server.close(() => process.exit(0));
    });
  }
}
