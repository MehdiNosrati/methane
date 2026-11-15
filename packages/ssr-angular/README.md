# `@methane-ui/ssr-angular`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Angular SSR server Declarative Shadow DOM serialization and non-destructive client hydration initializer (`provideMethaneHydration()`) for **Methane UI** — built on `@methane-ui/ssr`.

## Installation

```bash
pnpm add @methane-ui/ssr-angular @methane-ui/ssr @methane-ui/angular @methane-ui/core
# or
npm install @methane-ui/ssr-angular @methane-ui/ssr @methane-ui/angular @methane-ui/core
```

## Package Exports

| Entrypoint | Environment | Exports |
| --- | --- | --- |
| `@methane-ui/ssr-angular` | Angular SSR Server | `serializeAngularSsrHtml`, `transformAngularSsrResponse`, `createAngularSsrTransformStream` |
| `@methane-ui/ssr-angular/client` | Browser App Bootstrap | `provideMethaneHydration`, `initAngularHydration`, `upgradeMethaneAngularElements`, `hydrateAngularContainer`, `isAngularHydrationReady` |

## Usage Examples

### 1. Client Application Config (`app.config.ts`)

```ts
import { ApplicationConfig, provideAppInitializer } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import {
  provideMethaneHydration,
  upgradeMethaneAngularElements,
} from '@methane-ui/ssr-angular/client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideAppInitializer(() => {
      provideMethaneHydration().initialize();
      upgradeMethaneAngularElements(document);
    }),
  ],
};
```

### 2. Server Response Serialization (`server.ts`)

```ts
import '@methane-ui/ssr/dom-shim';
import '@methane-ui/ui/button';
import { serializeAngularSsrHtml, transformAngularSsrResponse } from '@methane-ui/ssr-angular';

// Transform an HTML string or a Fetch Response
const result = await serializeAngularSsrHtml(renderedAngularHtml, {
  styles: 'linked',
  assetBase: '/_methane/styles',
});
```

## Notes

- Uses non-destructive DSD upgrade sequencing (`upgradeMethaneAngularElements`) so Angular's own hydration markers remain intact alongside Lit Declarative Shadow DOM roots.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
