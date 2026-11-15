import { ContextConsumer, ContextProvider } from '@lit/context';
import {
  FIELD_CONTEXT,
  FORM_CONTEXT,
  LOCALE_CONTEXT,
  THEME_CONTEXT,
  type DensityMode,
  type DirectionMode,
  type FieldContextValue,
  type FormContextValue,
  type LocaleContextValue,
  type ThemeContextValue,
  type ThemeMode,
} from '@methane/core';
import type { ReactiveControllerHost } from 'lit';

export {
  FIELD_CONTEXT,
  FORM_CONTEXT,
  LOCALE_CONTEXT,
  THEME_CONTEXT,
  type DensityMode,
  type DirectionMode,
  type FieldContextValue,
  type FormContextValue,
  type LocaleContextValue,
  type ThemeContextValue,
  type ThemeMode,
};

/**
 * Provides `THEME_CONTEXT` to descendants and mirrors `theme` / `density` / `dir`
 * onto host attributes for CSS token selectors (`data-theme`, `data-density`, `dir`).
 */
export class ThemeContextProviderController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly provider: ContextProvider<typeof THEME_CONTEXT, ReactiveControllerHost & HTMLElement>;
  private value: ThemeContextValue;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    initial: Partial<Omit<ThemeContextValue, 'version'>> = {},
  ) {
    this.host = host;
    this.value = {
      version: 1,
      theme: initial.theme ?? 'system',
      density: initial.density ?? 'default',
      dir: initial.dir ?? 'auto',
    };
    this.provider = new ContextProvider(host, {
      context: THEME_CONTEXT,
      initialValue: this.value,
    });
    this.syncHostAttributes();
  }

  get current(): ThemeContextValue {
    return this.value;
  }

  update(next: Partial<Omit<ThemeContextValue, 'version'>>): void {
    this.value = {
      ...this.value,
      ...next,
      version: 1,
    };
    this.provider.setValue(this.value);
    this.syncHostAttributes();
    this.host.requestUpdate();
  }

  private syncHostAttributes(): void {
    this.host.setAttribute('data-theme', this.value.theme);
    this.host.setAttribute('data-density', this.value.density);
    if (this.value.dir !== 'auto') {
      this.host.setAttribute('dir', this.value.dir);
    } else {
      this.host.removeAttribute('dir');
    }
  }
}

export class LocaleContextProviderController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly provider: ContextProvider<typeof LOCALE_CONTEXT, ReactiveControllerHost & HTMLElement>;
  private value: LocaleContextValue;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    initial: Partial<Omit<LocaleContextValue, 'version'>> = {},
  ) {
    this.host = host;
    this.value = {
      version: 1,
      locale: initial.locale ?? 'en',
      dir: initial.dir ?? 'ltr',
      ...(initial.messages ? { messages: initial.messages } : {}),
    };
    this.provider = new ContextProvider(host, {
      context: LOCALE_CONTEXT,
      initialValue: this.value,
    });
    this.syncAttributes();
  }

  get current(): LocaleContextValue {
    return this.value;
  }

  update(next: Partial<Omit<LocaleContextValue, 'version'>>): void {
    this.value = {
      ...this.value,
      ...next,
      version: 1,
    };
    this.provider.setValue(this.value);
    this.syncAttributes();
    this.host.requestUpdate();
  }

  private syncAttributes(): void {
    this.host.setAttribute('lang', this.value.locale);
    this.host.setAttribute('dir', this.value.dir);
  }
}

export class FieldContextProviderController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly provider: ContextProvider<typeof FIELD_CONTEXT, ReactiveControllerHost & HTMLElement>;
  private value: FieldContextValue;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    initial: Partial<Omit<FieldContextValue, 'version'>> = {},
  ) {
    this.host = host;
    this.value = { version: 1, ...initial };
    this.provider = new ContextProvider(host, {
      context: FIELD_CONTEXT,
      initialValue: this.value,
    });
  }

  get current(): FieldContextValue {
    return this.value;
  }

  update(next: Partial<Omit<FieldContextValue, 'version'>>): void {
    this.value = { ...this.value, ...next, version: 1 };
    this.provider.setValue(this.value);
    this.host.requestUpdate();
  }
}

export class FormContextProviderController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly provider: ContextProvider<typeof FORM_CONTEXT, ReactiveControllerHost & HTMLElement>;
  private value: FormContextValue;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    initial: Partial<Omit<FormContextValue, 'version'>> = {},
  ) {
    this.host = host;
    this.value = { version: 1, ...initial };
    this.provider = new ContextProvider(host, {
      context: FORM_CONTEXT,
      initialValue: this.value,
    });
  }

  get current(): FormContextValue {
    return this.value;
  }

  update(next: Partial<Omit<FormContextValue, 'version'>>): void {
    this.value = { ...this.value, ...next, version: 1 };
    this.provider.setValue(this.value);
    this.host.requestUpdate();
  }
}

export function consumeThemeContext(
  host: ReactiveControllerHost & HTMLElement,
  callback?: (value: ThemeContextValue) => void,
): ContextConsumer<typeof THEME_CONTEXT, ReactiveControllerHost & HTMLElement> {
  return new ContextConsumer(host, {
    context: THEME_CONTEXT,
    subscribe: true,
    ...(callback ? { callback } : {}),
  });
}

export function consumeLocaleContext(
  host: ReactiveControllerHost & HTMLElement,
  callback?: (value: LocaleContextValue) => void,
): ContextConsumer<typeof LOCALE_CONTEXT, ReactiveControllerHost & HTMLElement> {
  return new ContextConsumer(host, {
    context: LOCALE_CONTEXT,
    subscribe: true,
    ...(callback ? { callback } : {}),
  });
}

export const ContextProtocol = {
  THEME_CONTEXT,
  LOCALE_CONTEXT,
  FIELD_CONTEXT,
  FORM_CONTEXT,
  ThemeContextProviderController,
  LocaleContextProviderController,
  FieldContextProviderController,
  FormContextProviderController,
  consumeThemeContext,
  consumeLocaleContext,
} as const;
