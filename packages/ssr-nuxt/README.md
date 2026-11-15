# `@methane/ssr-nuxt`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Nuxt 3 / Nitro server plugin and Vue 3 custom-element SSR adapter for **Methane UI** — built on `@methane/ssr`.

## Installation

```bash
pnpm add @methane/ssr-nuxt @methane/ssr @methane/vue @methane/core
# or
npm install @methane/ssr-nuxt @methane/ssr @methane/vue @methane/core
```

## Package Exports

| Entrypoint | Environment | Exports |
| --- | --- | --- |
| `@methane/ssr-nuxt` | Nuxt / Nitro Server | `createMethaneNuxtConfig`, `createMethaneNitroPlugin`, `transformNitroHtml`, `METHANE_VUE_COMPILER_OPTIONS`, `isMethaneCustomElement` |
| `@methane/ssr-nuxt/client` | Browser Plugin | `createMethaneNuxtPlugin`, `initNuxtHydration`, `hydrateNuxtRoot` |

## Usage Examples

### 1. `nuxt.config.ts`

```ts
import { defineNuxtConfig } from 'nuxt/config';
import { createMethaneNuxtConfig } from '@methane/ssr-nuxt';

const methaneConfig = createMethaneNuxtConfig();

export default defineNuxtConfig({
  vue: {
    compilerOptions: methaneConfig.vue.compilerOptions,
  },
  css: ['@methane/tokens/tokens.css', '@methane/css/index.css'],
});
```

### 2. Nitro Server Plugin (`server/plugins/methane-ssr.ts`)

```ts
import { createMethaneNitroPlugin } from '@methane/ssr-nuxt';

export default defineNitroPlugin((nitroApp) => {
  const plugin = createMethaneNitroPlugin({ styles: 'linked' });
  plugin(nitroApp);
});
```

### 3. Nuxt Client Plugin (`plugins/methane.client.ts`)

```ts
import { defineNuxtPlugin } from '#app';
import { createMethaneNuxtPlugin } from '@methane/ssr-nuxt/client';

export default defineNuxtPlugin(createMethaneNuxtPlugin());
```

## Notes

- Automatically marks `mth-*` custom elements via `isMethaneCustomElement` so Vue compiles them cleanly without unresolved-component warnings.
- Supports both `linked` (`/_methane/styles`) and `inline` shadow stylesheet modes through `NuxtSsrOptions`.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
