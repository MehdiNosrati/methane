import { createContext } from '@lit/context';
import type { MessageCatalog } from './i18n.js';

export type ThemeMode = 'light' | 'dark' | 'system';
export type DensityMode = 'compact' | 'default' | 'comfortable';
export type DirectionMode = 'ltr' | 'rtl' | 'auto';

export interface ThemeContextValue {
  readonly version: number;
  readonly theme: ThemeMode;
  readonly density: DensityMode;
  readonly dir: DirectionMode;
}

export interface LocaleContextValue {
  readonly version: number;
  readonly locale: string;
  readonly dir: 'ltr' | 'rtl';
  readonly messages?: Readonly<Record<string, MessageCatalog>>;
}

export interface FieldContextValue {
  readonly version: number;
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly controlId?: string;
}

export interface FormContextValue {
  readonly version: number;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly density?: DensityMode;
  readonly submitAttempted?: boolean;
}

/**
 * Versioned Community Context Protocol tokens (ADR-006).
 * Symbol.for keys ensure interoperability across duplicate module loads.
 */
export const THEME_CONTEXT = createContext<ThemeContextValue>(
  Symbol.for('@methane-ui/context/theme'),
);

export const LOCALE_CONTEXT = createContext<LocaleContextValue>(
  Symbol.for('@methane-ui/context/locale'),
);

export const FIELD_CONTEXT = createContext<FieldContextValue>(
  Symbol.for('@methane-ui/context/field'),
);

export const FORM_CONTEXT = createContext<FormContextValue>(
  Symbol.for('@methane-ui/context/form'),
);

export const DEFAULT_THEME_CONTEXT: ThemeContextValue = {
  version: 1,
  theme: 'system',
  density: 'default',
  dir: 'auto',
};

export const DEFAULT_LOCALE_CONTEXT: LocaleContextValue = {
  version: 1,
  locale: 'en',
  dir: 'ltr',
};
