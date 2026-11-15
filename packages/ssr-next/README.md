# `@methane/ssr-next`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Next.js App Router, React Server Components (RSC), and Route/Middleware Declarative Shadow DOM (DSD) streaming SSR adapter for **Methane UI** — built on `@methane/ssr`.

## Installation

```bash
pnpm add @methane/ssr-next @methane/ssr @methane/core
# or
npm install @methane/ssr-next @methane/ssr @methane/core
```

## Package Exports

| Entrypoint | Environment | Exports |
| --- | --- | --- |
| `@methane/ssr-next` | Server (Node / Edge) | `withMethaneNextConfig`, `renderNextHtml`, `transformNextResponse`, `createNextSsrTransformStream`, `formatPreloadLinkHeader` |
| `@methane/ssr-next/client` | Client (`"use client"`) | `initNextHydration`, `hydrateNextContainer`, `isNextHydrationReady` |

## Usage Examples

### 1. Configure `next.config.ts`

```ts
import type { NextConfig } from 'next';
import { withMethaneNextConfig } from '@methane/ssr-next';

const nextConfig: NextConfig = {
  // your Next.js options
};

export default withMethaneNextConfig(nextConfig);
```

### 2. Hydrate Client Boundary (`"use client"`)

```tsx
'use client';

import { useEffect } from 'react';
import { initNextHydration } from '@methane/ssr-next/client';

initNextHydration();

export function MethaneProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Declarative Shadow DOM elements upgrade in place once registered
    void import('@methane/ui/button');
  }, []);

  return <>{children}</>;
}
```

### 3. Transform HTML / Streaming Response in Middleware or Route Handler

```ts
import { renderNextHtml, formatPreloadLinkHeader } from '@methane/ssr-next';

const { html, links } = await renderNextHtml(rawHtml, { styles: 'linked' });
const linkHeader = formatPreloadLinkHeader(links);
```

## Notes

- **Theming & FOUC**: Pair with `@methane/tokens/tokens.css` and `@methane/css/defined-guard.css` in your root `layout.tsx`.
- **Edge & Streaming**: `createNextSsrTransformStream()` processes chunked Next.js SSR HTML streams while hoisting deduplicated component stylesheets and `Link` preload headers.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
