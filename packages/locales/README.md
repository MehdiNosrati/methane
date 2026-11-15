# `@methane/locales`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Code-split, lazy-loaded internationalization (i18n) locale packs with `Intl.PluralRules` pluralization and automatic RTL direction helpers for **Methane UI**.

## Installation

```bash
pnpm add @methane/locales
# or
npm install @methane/locales
```

## Supported Locales & Subpath Exports

| Subpath | Locale | Script Direction |
| --- | --- | --- |
| `@methane/locales/en` | English (`en`) | `ltr` |
| `@methane/locales/es` | Spanish (`es`) | `ltr` |
| `@methane/locales/fr` | French (`fr`) | `ltr` |
| `@methane/locales/de` | German (`de`) | `ltr` |
| `@methane/locales/ja` | Japanese (`ja`) | `ltr` |
| `@methane/locales/zh-CN` | Simplified Chinese (`zh-CN`) | `ltr` |
| `@methane/locales/ar` | Arabic (`ar`) | `rtl` |
| `@methane/locales/he` | Hebrew (`he`) | `rtl` |

> Each subpath accepts both `@methane/locales/<code>` and `@methane/locales/<code>.js`.

## Exported API

| Symbol | Description |
| --- | --- |
| `SUPPORTED_LOCALES` | Tuple of supported locale codes (`['en', 'es', 'fr', 'de', 'ja', 'zh-CN', 'ar', 'he']`) |
| `loadLocalePack(locale, options?)` | Dynamically imports and caches a locale pack with BCP-47 alias resolution (`en-US` → `en`, `zh-Hans` → `zh-CN`, `iw` → `he`) |
| `resolveSupportedLocale(locale)` | Resolves arbitrary BCP-47 locale tags to a supported `MethaneLocaleCode \| null` |
| `formatMessage(value, locale, params?)` | Formats plain strings or `PluralForms` using `Intl.PluralRules` and `{placeholder}` interpolation |
| `flattenMessages(pack)` | Flattens nested namespaced messages (`common`, `validation`, `pagination`, `table`, `calendar`, `combobox`, `upload`, `overlay`, `announcer`) into dot-delimited keys |
| `getLocaleDirection(locale)` | Returns `'rtl'` for RTL locales (`ar`, `he`, etc.) and `'ltr'` otherwise |
| `isPluralForms(value)` | Type guard for `PluralForms` message entries |
| `clearLocalePackCache()` | Clears the in-memory pack cache (useful in tests) |

## Usage Examples

### Lazy Loading & Registering with `@methane/core`

```ts
import { loadLocalePack, flattenMessages, getLocaleDirection } from '@methane/locales';
import { registerLocalePack } from '@methane/core/i18n';

const pack = await loadLocalePack(navigator.language);
registerLocalePack(pack.locale, flattenMessages(pack));
document.documentElement.dir = getLocaleDirection(pack.locale);
```

### Static Bundle Import & `Intl.PluralRules` Formatting

```ts
import arPack from '@methane/locales/ar';
import { formatMessage } from '@methane/locales';

const label = formatMessage(arPack.common.selectedCount, 'ar', { count: 3 });
```

## RTL, Accessibility & SSR Notes

- **RTL & Bidi**: `getLocaleDirection()` automatically maps Arabic/Hebrew language subtags (`ar`, `he`, `iw`, etc.) to `'rtl'`.
- **Screen-Reader Labels**: Includes dedicated `announcer`, `overlay`, `pagination`, `table`, `calendar`, `combobox`, and `upload` namespaces used by `@methane/ui` ARIA live regions and controls.
- **SSR Compatibility**: All exports rely solely on standard ECMAScript `Intl.PluralRules` and dynamic ESM `import()`, working identically in Node/Edge SSR and browsers.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
