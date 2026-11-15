import {
  SUPPORTED_LOCALES,
  type FormatMessageOptions,
  type MessageKey,
  type MessageParams,
  type MethaneLocaleCode,
  type MethaneLocalePack,
  type MethaneMessages,
  type MethaneMessageValue,
  type PluralForms,
  type TextDirection,
} from './types.js';

const RTL_LANGUAGE_SUBTAGS = new Set([
  'ar',
  'arc',
  'dv',
  'fa',
  'ha',
  'he',
  'iw',
  'khw',
  'ks',
  'ku',
  'ps',
  'sd',
  'ur',
  'yi',
]);

const BIDI_FSI = '\u2068';
const BIDI_PDI = '\u2069';

const pluralRulesCache = new Map<string, Intl.PluralRules>();

function getPluralRules(locale: string): Intl.PluralRules {
  let cached = pluralRulesCache.get(locale);
  if (!cached) {
    cached = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, cached);
  }
  return cached;
}

/**
 * Determine text direction (`ltr` or `rtl`) for a BCP-47 locale tag.
 */
export function getLocaleDirection(locale: string): TextDirection {
  const normalized = locale.trim().toLowerCase().replace(/_/g, '-');
  const [base] = normalized.split('-');
  if (base && RTL_LANGUAGE_SUBTAGS.has(base)) {
    return 'rtl';
  }
  return 'ltr';
}

/**
 * Resolve an arbitrary BCP-47 locale tag (e.g. `en-US`, `zh-Hans-CN`, `iw`)
 * to a supported `MethaneLocaleCode`, or `null` if no match exists.
 */
export function resolveSupportedLocale(locale: string): MethaneLocaleCode | null {
  const cleaned = locale.trim().replace(/_/g, '-');
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();

  if (lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh-hans-cn' || lower === 'zh-sg') {
    return 'zh-CN';
  }

  for (const supported of SUPPORTED_LOCALES) {
    if (supported.toLowerCase() === lower) {
      return supported;
    }
  }

  const base = lower.split('-')[0];
  if (!base) return null;

  if (base === 'iw') return 'he';
  if (base === 'zh') return 'zh-CN';

  for (const supported of SUPPORTED_LOCALES) {
    if (supported.toLowerCase() === base) {
      return supported;
    }
  }

  return null;
}

export function isPluralForms(value: MethaneMessageValue): value is PluralForms {
  return typeof value === 'object' && value !== null && 'other' in value;
}

function lookupMessage(messages: MethaneMessages, key: MessageKey): MethaneMessageValue {
  const dotIndex = key.indexOf('.');
  const ns = key.slice(0, dotIndex) as keyof MethaneMessages;
  const member = key.slice(dotIndex + 1);
  const group = messages[ns] as unknown as Readonly<Record<string, MethaneMessageValue>>;
  const value = group[member];
  if (value === undefined) {
    throw new RangeError(`Unknown Methane message key: "${key}"`);
  }
  return value;
}

function selectPluralTemplate(forms: PluralForms, locale: string, count: number): string {
  const category = getPluralRules(locale).select(count);
  return forms[category] ?? forms.other;
}

function detectPluralCount(params: MessageParams | undefined, pluralParam?: string): number {
  if (!params) return 0;
  if (pluralParam !== undefined) {
    const val = params[pluralParam];
    if (typeof val === 'number') return val;
  }
  if (typeof params.count === 'number') return params.count;
  for (const candidate of ['max', 'minLength', 'maxLength', 'total']) {
    const val = params[candidate];
    if (typeof val === 'number') return val;
  }
  for (const val of Object.values(params)) {
    if (typeof val === 'number') return val;
  }
  return 0;
}

/**
 * Format a Methane catalog message with `Intl.PluralRules` selection and
 * ADR-011 RTL Unicode bidi isolation (`\u2068…\u2069`) around interpolated values.
 */
export function formatMessage(
  packOrMessages: MethaneLocalePack | MethaneMessages,
  key: MessageKey,
  params?: MessageParams,
  options?: FormatMessageOptions,
): string {
  const isPack = 'messages' in packOrMessages && 'locale' in packOrMessages;
  const messages = isPack ? packOrMessages.messages : packOrMessages;
  const locale = options?.locale ?? (isPack ? packOrMessages.locale : 'en');
  const dir = options?.dir ?? (isPack ? packOrMessages.dir : getLocaleDirection(locale));
  const isolateBidi = options?.isolateBidi ?? dir === 'rtl';

  const entry = lookupMessage(messages, key);
  const template = isPluralForms(entry)
    ? selectPluralTemplate(entry, locale, detectPluralCount(params, options?.pluralParam))
    : entry;

  if (!params) return template;

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    if (!(name in params)) return match;
    const raw = params[name];
    if (raw === undefined) return match;
    const str = String(raw);
    return isolateBidi ? `${BIDI_FSI}${str}${BIDI_PDI}` : str;
  });
}

/**
 * Flatten a structured `MethaneMessages` tree into dot-separated `MessageKey` entries.
 */
export function flattenMessages(messages: MethaneMessages): Record<MessageKey, MethaneMessageValue> {
  const flat: Record<string, MethaneMessageValue> = {};
  const namespaces = Object.keys(messages) as Array<keyof MethaneMessages>;
  for (const ns of namespaces) {
    const group = messages[ns] as unknown as Readonly<Record<string, MethaneMessageValue>>;
    for (const member of Object.keys(group)) {
      const value = group[member];
      if (value !== undefined) {
        flat[`${ns}.${member}`] = value;
      }
    }
  }
  return flat as Record<MessageKey, MethaneMessageValue>;
}
