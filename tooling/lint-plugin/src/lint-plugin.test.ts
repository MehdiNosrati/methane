import { Linter } from 'eslint';
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';
import {
  LOGICAL_PROPERTIES_ONLY_RULE,
  NO_HOST_CONTEXT_RULE,
  NO_HOST_PUBLIC_TOKEN_SEED_RULE,
  detectImportCycles,
  isAllowedPackageEdge,
  methaneEslintPlugin,
  recommendedEslintRules,
  recommendedStylelintRules,
  stylelintPlugins,
} from './index.js';

const linter = new Linter();

function lintJs(code: string, filename = 'packages/ui/src/components/button/button.js') {
  return linter.verify(
    code,
    [
      {
        files: ['**/*.js', '**/*.mjs', '**/*.ts'],
        languageOptions: { ecmaVersion: 2024, sourceType: 'module' },
        plugins: { '@methane': methaneEslintPlugin },
        rules: recommendedEslintRules,
      },
    ],
    filename,
  );
}

async function lintCss(code: string) {
  const result = await stylelint.lint({
    code,
    config: {
      plugins: stylelintPlugins,
      rules: recommendedStylelintRules,
    },
  });
  return result.results[0]?.warnings ?? [];
}

describe('@methane/lint-plugin Stylelint rules (ADR-014)', () => {
  it('bans :host-context() while allowing :host(...) and logical selectors', async () => {
    const bad = await lintCss(`
      :host-context(.dark) .control {
        color: red;
      }
    `);
    expect(bad.some((w) => w.rule === NO_HOST_CONTEXT_RULE)).toBe(true);

    const good = await lintCss(`
      :host([open]) .control {
        color: var(--_fg);
      }
    `);
    expect(good).toHaveLength(0);
  });

  it('bans physical CSS properties and directional values while allowing logical properties', async () => {
    const bad = await lintCss(`
      .box {
        margin-top: 8px;
        padding-left: 12px;
        width: 100px;
        text-align: left;
      }
    `);
    const logicalWarnings = bad.filter((w) => w.rule === LOGICAL_PROPERTIES_ONLY_RULE);
    expect(logicalWarnings).toHaveLength(4);

    const good = await lintCss(`
      .box {
        margin-block-start: 8px;
        padding-inline-start: 12px;
        inline-size: 100px;
        text-align: start;
      }
    `);
    expect(good).toHaveLength(0);
  });

  it('bans seeding public --mth-* tokens on :host while allowing private --_* aliases', async () => {
    const bad = await lintCss(`
      :host {
        --mth-color-accent: blue;
      }
    `);
    expect(bad.some((w) => w.rule === NO_HOST_PUBLIC_TOKEN_SEED_RULE)).toBe(true);

    const good = await lintCss(`
      :host {
        --_bg: var(--mth-color-accent);
      }
    `);
    expect(good).toHaveLength(0);
  });
});

describe('@methane/lint-plugin ESLint rules (ADR-002, ADR-012, ADR-014)', () => {
  it('bans mutating host disabled inside formDisabledCallback', () => {
    const bad = lintJs(`
      class MthInput extends HTMLElement {
        formDisabledCallback(disabled) {
          this.disabled = disabled;
          this.setAttribute('disabled', '');
        }
      }
    `);
    expect(
      bad.filter((m) => m.ruleId === '@methane/no-host-disabled-in-form-disabled-callback'),
    ).toHaveLength(2);

    const good = lintJs(`
      class MthInput extends HTMLElement {
        formDisabledCallback(disabled) {
          this.control.disabled = disabled;
        }
      }
    `);
    expect(good).toHaveLength(0);
  });

  it('bans setting tabIndex or tabindex attribute inside constructor', () => {
    const bad = lintJs(`
      class MthButton extends HTMLElement {
        constructor() {
          super();
          this.tabIndex = 0;
          this.setAttribute('tabindex', '0');
        }
      }
    `);
    expect(bad.filter((m) => m.ruleId === '@methane/no-tabindex-in-constructor')).toHaveLength(2);

    const good = lintJs(`
      class MthButton extends HTMLElement {
        connectedCallback() {
          if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
        }
      }
    `);
    expect(good).toHaveLength(0);
  });

  it('bans combining delegatesFocus: true with host internals.role', () => {
    const bad = lintJs(`
      class MthCombobox extends HTMLElement {
        static shadowRootOptions = { mode: 'open', delegatesFocus: true };
        constructor() {
          super();
          this.internals = this.attachInternals();
          this.internals.role = 'combobox';
        }
      }
    `);
    expect(
      bad.filter((m) => m.ruleId === '@methane/no-delegates-focus-with-host-role'),
    ).toHaveLength(1);

    const good = lintJs(`
      class MthCombobox extends HTMLElement {
        static shadowRootOptions = { mode: 'open', delegatesFocus: true };
        constructor() {
          super();
          this.internals = this.attachInternals();
        }
      }
    `);
    expect(good).toHaveLength(0);
  });

  it('bans raw innerHTML/outerHTML/insertAdjacentHTML/unsafeHTML outside @methane/sanitize', () => {
    const bad = lintJs(`
      import { unsafeHTML } from 'lit/directives/unsafe-html.js';
      export function render(el, html) {
        el.innerHTML = html;
        el.insertAdjacentHTML('beforeend', html);
        return unsafeHTML(html);
      }
    `);
    expect(bad.filter((m) => m.ruleId === '@methane/no-raw-html').length).toBeGreaterThanOrEqual(4);

    const allowedInSanitize = lintJs(
      `
      export function clear(el) { el.innerHTML = ''; }
      `,
      'packages/sanitize/src/index.js',
    );
    expect(allowedInSanitize).toHaveLength(0);
  });

  it('bans cross-component internal imports and enforces acyclic package DAG', () => {
    const crossComp = lintJs(
      `import { helper } from '../dialog/internal.js';`,
      'packages/ui/src/components/combobox/combobox.js',
    );
    expect(
      crossComp.some((m) => m.ruleId === '@methane/no-cross-component-internal-imports'),
    ).toBe(true);

    const deepCrossComp = lintJs(
      `import { state } from '../../button/state.js';`,
      'packages/ui/src/components/combobox/sub/list.js',
    );
    expect(
      deepCrossComp.some((m) => m.ruleId === '@methane/no-cross-component-internal-imports'),
    ).toBe(true);

    const kitCrossComp = lintJs(
      `import { helper } from '../prompt-input/internal.js';`,
      'packages/kits/ai/src/ai-message/message.js',
    );
    expect(
      kitCrossComp.some((m) => m.ruleId === '@methane/no-cross-component-internal-imports'),
    ).toBe(true);

    const satCrossComp = lintJs(
      `import { helper } from '../../datagrid/internal.js';`,
      'packages/satellites/datagrid/src/tree-table/sub/cell.js',
    );
    expect(
      satCrossComp.some((m) => m.ruleId === '@methane/no-cross-component-internal-imports'),
    ).toBe(true);

    const sameComp = lintJs(
      `import { utils } from '../utils.js';`,
      'packages/ui/src/components/combobox/sub/list.js',
    );
    expect(sameComp).toHaveLength(0);

    const internalSubpath = lintJs(
      `import { internal } from '@methane/ui/src/button/state.js';`,
      'packages/kits/ai/src/prompt.js',
    );
    expect(
      internalSubpath.some((m) => m.ruleId === '@methane/no-cross-component-internal-imports'),
    ).toBe(true);

    const upwardDag = lintJs(
      `import { MthButton } from '@methane/ui';`,
      'packages/core/src/ui-element.js',
    );
    expect(
      upwardDag.some((m) => m.ruleId === '@methane/no-cross-component-internal-imports'),
    ).toBe(true);

    const validDownward = lintJs(
      `import { UIElement } from '@methane/core';`,
      'packages/ui/src/components/button/button.js',
    );
    expect(validDownward).toHaveLength(0);

    expect(isAllowedPackageEdge('@methane/ui', '@methane/primitives')).toBe(true);
    expect(isAllowedPackageEdge('@methane/primitives', '@methane/ui')).toBe(false);
    expect(isAllowedPackageEdge('@methane/ai', '@methane/chat')).toBe(false);
    expect(isAllowedPackageEdge('@methane/datagrid', '@methane/ui')).toBe(true);
    expect(isAllowedPackageEdge('@methane/ui', '@methane/ssr')).toBe(false);
    expect(isAllowedPackageEdge('@methane/core', '@methane/react')).toBe(false);
    expect(isAllowedPackageEdge('@methane/ssr-next', '@methane/ssr')).toBe(true);
    expect(isAllowedPackageEdge('@methane/ssr-next', '@methane/ssr-nuxt')).toBe(false);
    expect(isAllowedPackageEdge('@methane/react', '@methane/ui')).toBe(true);
    expect(isAllowedPackageEdge('@methane/react', '@methane/vue')).toBe(false);

    const cycles = detectImportCycles(
      new Map([
        ['@methane/a', ['@methane/b']],
        ['@methane/b', ['@methane/c']],
        ['@methane/c', ['@methane/a']],
      ]),
    );
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(['@methane/a', '@methane/b', '@methane/c', '@methane/a']);
  });

  it('flags CSS-in-JS violations inside Lit css tagged templates', () => {
    const bad = lintJs(`
      import { css } from 'lit';
      export const styles = css\`
        :host {
          --mth-color-accent: red;
          margin-left: 4px;
        }
        :host-context(.rtl) .icon {
          width: 16px;
        }
      \`;
    `);
    expect(bad.filter((m) => m.ruleId === '@methane/no-css-violations-in-lit')).toHaveLength(4);

    const good = lintJs(`
      import { css } from 'lit';
      export const styles = css\`
        :host {
          --_accent: var(--mth-color-accent);
          margin-inline-start: 4px;
        }
        .icon {
          inline-size: 16px;
        }
      \`;
    `);
    expect(good).toHaveLength(0);
  });
});
