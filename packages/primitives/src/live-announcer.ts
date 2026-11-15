import {
  formatI18nMessage,
  getRuntime,
  translateMessage,
  type MessageCatalog,
} from '@methane-ui/core';

/**
 * Announces localized or literal status messages to assistive technology via
 * `getRuntime().announcer` (single shared `aria-live` polite/assertive DOM manager).
 */
export const LiveAnnouncer = {
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    getRuntime().announcer.announce(message, politeness);
  },

  announceI18n(
    key: string,
    options: {
      namespace?: string;
      locale?: string;
      params?: Record<string, string | number>;
      catalog?: MessageCatalog;
      politeness?: 'polite' | 'assertive';
    } = {},
  ): string {
    const locale = options.locale ?? 'en';
    const message =
      options.namespace || options.catalog
        ? translateMessage(options.namespace ?? 'common', key, {
            locale,
            ...(options.params ? { params: options.params } : {}),
            ...(options.catalog ? { defaults: options.catalog } : {}),
          })
        : formatI18nMessage(key, options.params ?? {}, locale);
    this.announce(message, options.politeness ?? 'polite');
    return message;
  },

  getLastAnnouncement(): {
    readonly message: string;
    readonly politeness: 'polite' | 'assertive';
  } | null {
    return getRuntime().announcer.getLastAnnouncement();
  },

  clear(): void {
    getRuntime().announcer.clear();
  },
};
