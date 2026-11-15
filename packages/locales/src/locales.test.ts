import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_LOCALES,
  clearLocalePackCache,
  flattenMessages,
  formatMessage,
  getLocaleDirection,
  isPluralForms,
  loadLocalePack,
  resolveSupportedLocale,
  type MethaneLocaleCode,
  type MethaneLocalePack,
} from './index.js';
import arPack from './packs/ar.js';
import dePack from './packs/de.js';
import enPack from './packs/en.js';
import esPack from './packs/es.js';
import frPack from './packs/fr.js';
import hePack from './packs/he.js';
import jaPack from './packs/ja.js';
import zhCNPack from './packs/zh-CN.js';

const ALL_PACKS: ReadonlyArray<MethaneLocalePack> = [
  enPack,
  esPack,
  frPack,
  dePack,
  jaPack,
  zhCNPack,
  arPack,
  hePack,
];

function extractPlaceholders(template: string): string[] {
  const found = new Set<string>();
  const re = /\{([a-zA-Z0-9_]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    if (match[1]) found.add(match[1]);
  }
  return [...found].sort();
}

describe('@methane/locales', () => {
  it('exports all 8 required locale packs with matching locale codes and RTL metadata', () => {
    expect(ALL_PACKS.map((p) => p.locale)).toEqual([...SUPPORTED_LOCALES]);

    const expectedDir: Record<MethaneLocaleCode, 'ltr' | 'rtl'> = {
      en: 'ltr',
      es: 'ltr',
      fr: 'ltr',
      de: 'ltr',
      ja: 'ltr',
      'zh-CN': 'ltr',
      ar: 'rtl',
      he: 'rtl',
    };

    for (const pack of ALL_PACKS) {
      expect(pack.dir).toBe(expectedDir[pack.locale]);
      expect(getLocaleDirection(pack.locale)).toBe(expectedDir[pack.locale]);
    }
  });

  it('maintains 100% message key, value-shape, and placeholder parity across all 8 locales', () => {
    const enFlat = flattenMessages(enPack.messages);
    const enKeys = Object.keys(enFlat).sort();
    expect(enKeys.length).toBeGreaterThan(80);

    for (const pack of ALL_PACKS) {
      const flat = flattenMessages(pack.messages);
      const keys = Object.keys(flat).sort();
      expect(keys, `Key mismatch in locale ${pack.locale}`).toEqual(enKeys);

      for (const key of enKeys) {
        const typedKey = key as keyof typeof enFlat;
        const enVal = enFlat[typedKey];
        const locVal = flat[typedKey];
        expect(locVal, `Missing ${key} in ${pack.locale}`).toBeDefined();

        if (isPluralForms(enVal)) {
          expect(isPluralForms(locVal), `Expected PluralForms for ${key} in ${pack.locale}`).toBe(
            true,
          );
          if (isPluralForms(locVal)) {
            const expectedPlaceholders = extractPlaceholders(enVal.other);
            expect(locVal.other.trim().length).toBeGreaterThan(0);

            const requiredCategories = new Intl.PluralRules(pack.locale).resolvedOptions()
              .pluralCategories;
            for (const cat of requiredCategories) {
              const form = locVal[cat];
              expect(
                typeof form === 'string' && form.trim().length > 0,
                `Missing plural category "${cat}" for "${key}" in "${pack.locale}"`,
              ).toBe(true);
              if (typeof form === 'string') {
                const formPlaceholders = extractPlaceholders(form);
                if (cat === 'other') {
                  expect(
                    formPlaceholders,
                    `Placeholder mismatch for "${key}.${cat}" in "${pack.locale}"`,
                  ).toEqual(expectedPlaceholders);
                } else {
                  for (const placeholder of formPlaceholders) {
                    expect(
                      expectedPlaceholders,
                      `Unexpected placeholder "{${placeholder}}" in "${key}.${cat}" (${pack.locale})`,
                    ).toContain(placeholder);
                  }
                }
              }
            }
          }
        } else {
          expect(typeof locVal, `Expected string for ${key} in ${pack.locale}`).toBe('string');
          if (typeof locVal === 'string') {
            expect(locVal.trim().length).toBeGreaterThan(0);
            expect(
              extractPlaceholders(locVal),
              `Placeholder mismatch for "${key}" in "${pack.locale}"`,
            ).toEqual(extractPlaceholders(enVal));
          }
        }
      }
    }
  });

  it('resolves BCP-47 tags and lazy-loads all 8 locale packs via loadLocalePack', async () => {
    clearLocalePackCache();

    expect(resolveSupportedLocale('en-US')).toBe('en');
    expect(resolveSupportedLocale('zh_Hans_CN')).toBe('zh-CN');
    expect(resolveSupportedLocale('iw-IL')).toBe('he');
    expect(resolveSupportedLocale('ar-EG')).toBe('ar');
    expect(resolveSupportedLocale('xx-UNKNOWN')).toBeNull();

    for (const locale of SUPPORTED_LOCALES) {
      const loaded = await loadLocalePack(locale);
      expect(loaded.locale).toBe(locale);
      expect(loaded.dir).toBe(locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr');
    }

    const fallbackPack = await loadLocalePack('pt-BR');
    expect(fallbackPack.locale).toBe('en');

    await expect(loadLocalePack('pt-BR', { fallback: false })).rejects.toThrow(RangeError);
  });

  it('formats plural categories via Intl.PluralRules across LTR and RTL locales', () => {
    expect(formatMessage(enPack, 'common.selectedCount', { count: 1 })).toBe('1 item selected');
    expect(formatMessage(enPack, 'common.selectedCount', { count: 5 })).toBe('5 items selected');

    expect(formatMessage(arPack, 'common.selectedCount', { count: 0 })).toBe(
      'لم يتم تحديد أي عنصر',
    );
    expect(formatMessage(arPack, 'common.selectedCount', { count: 1 })).toContain('\u20681\u2069');
    expect(formatMessage(arPack, 'common.selectedCount', { count: 2 })).toContain('\u20682\u2069');
    expect(formatMessage(arPack, 'common.selectedCount', { count: 5 })).toContain('\u20685\u2069');
    expect(formatMessage(arPack, 'common.selectedCount', { count: 15 })).toContain('\u206815\u2069');

    expect(formatMessage(hePack, 'table.selectedRows', { count: 2 })).toBe(
      'שתי שורות (\u20682\u2069) נבחרו',
    );
  });

  it('wraps interpolated values with Unicode FSI/PDI bidi isolation in RTL locales', () => {
    const arMsg = formatMessage(arPack, 'combobox.removeTag', { label: 'TypeScript' });
    expect(arMsg).toBe('إزالة \u2068TypeScript\u2069');

    const heMsg = formatMessage(hePack, 'upload.removeFile', { filename: 'report.pdf' });
    expect(heMsg).toBe('הסרת \u2068report.pdf\u2069');

    const enMsg = formatMessage(enPack, 'combobox.removeTag', { label: 'TypeScript' });
    expect(enMsg).toBe('Remove TypeScript');
  });
});
