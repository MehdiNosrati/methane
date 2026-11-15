import '@angular/compiler';
import 'zone.js/node';
import { renderApplication } from '@angular/platform-server';
import { registerUtilityElements } from '@methane-ui/primitives';
import { serializeAngularSsrHtml, type AngularSsrOptions, type AngularSsrResult } from '@methane-ui/ssr-angular';
import { registerAllComponents } from '@methane-ui/ui';
import { bootstrap } from './main.server.js';

const BASE_DOCUMENT = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Methane Angular 19 SSR Verification</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>`;

export interface RenderVerifyAngularOptions extends AngularSsrOptions {
  readonly url?: string;
  readonly document?: string;
}

export async function renderVerifyAngularSsr(
  options: RenderVerifyAngularOptions = {},
): Promise<AngularSsrResult> {
  registerUtilityElements();
  registerAllComponents();

  const { url = 'http://localhost/', document = BASE_DOCUMENT, ...ssrOptions } = options;
  const rawAngularHtml = await renderApplication(bootstrap, {
    document,
    url,
    allowedHosts: ['localhost', '127.0.0.1'],
  });

  return serializeAngularSsrHtml(rawAngularHtml, {
    assetBase: '/methane/styles',
    hydrationModuleUrl: '/assets/methane-angular-hydrate.js',
    ...ssrOptions,
  });
}
