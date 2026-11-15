import { isSafeUrl } from '@methane/sanitize';

export interface TrustedHTMLValue {
  toString(): string;
}

export interface TrustedTypePolicyRules {
  createHTML?: (input: string, ...args: unknown[]) => string;
  createScript?: (input: string, ...args: unknown[]) => string;
  createScriptURL?: (input: string, ...args: unknown[]) => string;
}

export interface EnforcingTrustedTypePolicy {
  readonly name: string;
  createHTML(input: string, ...args: unknown[]): TrustedHTMLValue;
  createScript(input: string, ...args: unknown[]): unknown;
  createScriptURL(input: string, ...args: unknown[]): unknown;
}

export interface CspViolationRecord {
  readonly directive:
    | 'trusted-types'
    | 'require-trusted-types-for'
    | 'script-src'
    | 'style-src-attr'
    | 'script-elem';
  readonly sink: string;
  readonly detail: string;
}

export interface CspHarnessOptions {
  readonly targetWindow?: typeof globalThis;
  readonly allowedPolicies?: ReadonlyArray<string>;
}

export interface InstalledCspHarness {
  readonly allowedPolicies: ReadonlyArray<string>;
  getCreatedPolicies(): ReadonlyArray<string>;
  getViolations(): ReadonlyArray<CspViolationRecord>;
  clearViolations(): void;
  getPolicy(name: string): EnforcingTrustedTypePolicy | undefined;
  uninstall(): void;
}

export interface DsdCspAuditResult {
  readonly passed: boolean;
  readonly violations: ReadonlyArray<CspViolationRecord>;
  readonly templateCount: number;
  readonly linkCount: number;
  readonly styleTagCount: number;
}

export interface StrictCspSuiteResult {
  readonly passed: boolean;
  readonly createdPolicies: ReadonlyArray<string>;
  readonly negativeControlsVerified: ReadonlyArray<string>;
  readonly linkedSsrAudit: DsdCspAuditResult;
  readonly inlineSsrAudit: DsdCspAuditResult;
  readonly unexpectedViolations: ReadonlyArray<CspViolationRecord>;
}

/**
 * Installs an enforcing Trusted Types + strict CSP DOM/eval sink guard harness
 * (`require-trusted-types-for 'script'`, `trusted-types methane-sanitize lit-html`).
 */
export function installTrustedTypesAndCspGuards(
  options: CspHarnessOptions = {},
): InstalledCspHarness {
  const win = (options.targetWindow ?? globalThis) as typeof globalThis & Record<string, unknown>;
  const allowedPolicies = options.allowedPolicies ?? ['methane-sanitize', 'lit-html'];
  const allowedSet = new Set(allowedPolicies);
  const violations: CspViolationRecord[] = [];
  const createdPolicies = new Map<string, EnforcingTrustedTypePolicy>();

  class EnforcedTrustedHTML implements TrustedHTMLValue {
    readonly #value: string;
    constructor(value: string) {
      this.#value = value;
    }
    toString(): string {
      return this.#value;
    }
  }

  class EnforcedTrustedScript {
    readonly #value: string;
    constructor(value: string) {
      this.#value = value;
    }
    toString(): string {
      return this.#value;
    }
  }

  class EnforcedTrustedScriptURL {
    readonly #value: string;
    constructor(value: string) {
      this.#value = value;
    }
    toString(): string {
      return this.#value;
    }
  }

  const prevTrustedTypes = Object.getOwnPropertyDescriptor(win, 'trustedTypes');
  const prevTrustedHTML = Object.getOwnPropertyDescriptor(win, 'TrustedHTML');
  const prevTrustedScript = Object.getOwnPropertyDescriptor(win, 'TrustedScript');
  const prevTrustedScriptURL = Object.getOwnPropertyDescriptor(win, 'TrustedScriptURL');
  const prevEval = Object.getOwnPropertyDescriptor(win, 'eval');
  const prevFunction = Object.getOwnPropertyDescriptor(win, 'Function');

  const ElementCtor = win.Element as typeof Element | undefined;
  const ShadowRootCtor = win.ShadowRoot as typeof ShadowRoot | undefined;

  const prevElInnerHtml = ElementCtor
    ? Object.getOwnPropertyDescriptor(ElementCtor.prototype, 'innerHTML')
    : undefined;
  const prevElOuterHtml = ElementCtor
    ? Object.getOwnPropertyDescriptor(ElementCtor.prototype, 'outerHTML')
    : undefined;
  const prevElInsertAdj = ElementCtor
    ? Object.getOwnPropertyDescriptor(ElementCtor.prototype, 'insertAdjacentHTML')
    : undefined;
  const prevShadowInnerHtml = ShadowRootCtor
    ? Object.getOwnPropertyDescriptor(ShadowRootCtor.prototype, 'innerHTML')
    : undefined;

  const emptyHTML = new EnforcedTrustedHTML('');
  const emptyScript = new EnforcedTrustedScript('');

  const factory = {
    emptyHTML,
    emptyScript,
    isHTML(value: unknown): value is TrustedHTMLValue {
      return value instanceof EnforcedTrustedHTML;
    },
    isScript(value: unknown): boolean {
      return value instanceof EnforcedTrustedScript;
    },
    isScriptURL(value: unknown): boolean {
      return value instanceof EnforcedTrustedScriptURL;
    },
    createPolicy(name: string, rules: TrustedTypePolicyRules = {}): EnforcingTrustedTypePolicy {
      if (!allowedSet.has(name)) {
        const msg = `Refused to create a TrustedTypePolicy named '${name}' (allowed: ${allowedPolicies.join(' ')})`;
        violations.push({ directive: 'trusted-types', sink: 'trustedTypes.createPolicy', detail: msg });
        throw new TypeError(msg);
      }
      if (createdPolicies.has(name)) {
        const msg = `Policy with name '${name}' already exists.`;
        violations.push({ directive: 'trusted-types', sink: 'trustedTypes.createPolicy', detail: msg });
        throw new TypeError(msg);
      }
      const policy: EnforcingTrustedTypePolicy = {
        name,
        createHTML(input: string, ...args: unknown[]): TrustedHTMLValue {
          const out = rules.createHTML ? rules.createHTML(input, ...args) : input;
          return new EnforcedTrustedHTML(String(out));
        },
        createScript(input: string, ...args: unknown[]): unknown {
          const out = rules.createScript ? rules.createScript(input, ...args) : input;
          return new EnforcedTrustedScript(String(out));
        },
        createScriptURL(input: string, ...args: unknown[]): unknown {
          const out = rules.createScriptURL ? rules.createScriptURL(input, ...args) : input;
          return new EnforcedTrustedScriptURL(String(out));
        },
      };
      createdPolicies.set(name, policy);
      return policy;
    },
  };

  Object.defineProperty(win, 'TrustedHTML', {
    value: EnforcedTrustedHTML,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(win, 'TrustedScript', {
    value: EnforcedTrustedScript,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(win, 'TrustedScriptURL', {
    value: EnforcedTrustedScriptURL,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(win, 'trustedTypes', {
    value: factory,
    configurable: true,
    writable: true,
  });

  function requireTrustedHTML(sink: string, value: unknown): string {
    if (factory.isHTML(value)) {
      return value.toString();
    }
    const msg = `This document requires 'TrustedHTML' assignment at ${sink}.`;
    violations.push({
      directive: 'require-trusted-types-for',
      sink,
      detail: msg,
    });
    throw new TypeError(msg);
  }

  if (ElementCtor && prevElInnerHtml) {
    Object.defineProperty(ElementCtor.prototype, 'innerHTML', {
      configurable: true,
      enumerable: prevElInnerHtml.enumerable ?? false,
      get() {
        return prevElInnerHtml.get ? prevElInnerHtml.get.call(this) : '';
      },
      set(value: unknown) {
        const htmlText = requireTrustedHTML('Element.innerHTML', value);
        prevElInnerHtml.set?.call(this, htmlText);
      },
    });
  }

  if (ElementCtor && prevElOuterHtml) {
    Object.defineProperty(ElementCtor.prototype, 'outerHTML', {
      configurable: true,
      enumerable: prevElOuterHtml.enumerable ?? false,
      get() {
        return prevElOuterHtml.get ? prevElOuterHtml.get.call(this) : '';
      },
      set(value: unknown) {
        const htmlText = requireTrustedHTML('Element.outerHTML', value);
        prevElOuterHtml.set?.call(this, htmlText);
      },
    });
  }

  if (ElementCtor && prevElInsertAdj) {
    const origInsertAdj = prevElInsertAdj.value as (
      position: InsertPosition,
      text: string,
    ) => void;
    Object.defineProperty(ElementCtor.prototype, 'insertAdjacentHTML', {
      configurable: true,
      writable: true,
      value(this: Element, position: InsertPosition, value: unknown) {
        const htmlText = requireTrustedHTML('Element.insertAdjacentHTML', value);
        return origInsertAdj.call(this, position, htmlText);
      },
    });
  }

  if (ShadowRootCtor && prevShadowInnerHtml) {
    Object.defineProperty(ShadowRootCtor.prototype, 'innerHTML', {
      configurable: true,
      enumerable: prevShadowInnerHtml.enumerable ?? false,
      get() {
        return prevShadowInnerHtml.get ? prevShadowInnerHtml.get.call(this) : '';
      },
      set(value: unknown) {
        const htmlText = requireTrustedHTML('ShadowRoot.innerHTML', value);
        prevShadowInnerHtml.set?.call(this, htmlText);
      },
    });
  }

  Object.defineProperty(win, 'eval', {
    configurable: true,
    writable: true,
    value() {
      const msg = "Refused to evaluate a string as JavaScript because 'unsafe-eval' is disallowed.";
      violations.push({ directive: 'script-src', sink: 'eval', detail: msg });
      throw new EvalError(msg);
    },
  });

  const GuardedFunction = function (..._args: unknown[]) {
    const msg =
      "Refused to evaluate a string as JavaScript via Function constructor because 'unsafe-eval' is disallowed.";
    violations.push({ directive: 'script-src', sink: 'Function', detail: msg });
    throw new EvalError(msg);
  };
  Object.defineProperty(win, 'Function', {
    configurable: true,
    writable: true,
    value: GuardedFunction,
  });

  function restoreProp(
    target: object,
    key: string,
    descriptor: PropertyDescriptor | undefined,
  ): void {
    if (descriptor) {
      Object.defineProperty(target, key, descriptor);
    } else {
      delete (target as Record<string, unknown>)[key];
    }
  }

  return {
    allowedPolicies,
    getCreatedPolicies: () => Array.from(createdPolicies.keys()),
    getViolations: () => [...violations],
    clearViolations: () => {
      violations.length = 0;
    },
    getPolicy: (name: string) => createdPolicies.get(name),
    uninstall(): void {
      restoreProp(win, 'trustedTypes', prevTrustedTypes);
      restoreProp(win, 'TrustedHTML', prevTrustedHTML);
      restoreProp(win, 'TrustedScript', prevTrustedScript);
      restoreProp(win, 'TrustedScriptURL', prevTrustedScriptURL);
      restoreProp(win, 'eval', prevEval);
      restoreProp(win, 'Function', prevFunction);

      if (ElementCtor) {
        restoreProp(ElementCtor.prototype, 'innerHTML', prevElInnerHtml);
        restoreProp(ElementCtor.prototype, 'outerHTML', prevElOuterHtml);
        restoreProp(ElementCtor.prototype, 'insertAdjacentHTML', prevElInsertAdj);
      }
      if (ShadowRootCtor) {
        restoreProp(ShadowRootCtor.prototype, 'innerHTML', prevShadowInnerHtml);
      }
    },
  };
}

/**
 * Audits server-rendered Declarative Shadow DOM (DSD) HTML under strict CSP:
 * - Zero inline `style="..."` element attributes (`style-src-attr 'none'`)
 * - Zero inline `on*` event handler attributes
 * - Zero `<script>` elements
 * - Zero unsafe `href`/`src` URLs
 */
export function auditDsdHtmlForCsp(
  htmlString: string,
  ownerDocument?: Document,
): DsdCspAuditResult {
  const doc = ownerDocument ?? document;
  const parser = new (doc.defaultView ?? globalThis).DOMParser();
  const parsed = parser.parseFromString(`<!doctype html><html><body>${htmlString}</body></html>`, 'text/html');
  const violations: CspViolationRecord[] = [];
  let templateCount = 0;
  let linkCount = 0;
  let styleTagCount = 0;

  function scanRoot(root: ParentNode): void {
    for (const el of root.querySelectorAll('*')) {
      const tag = el.localName.toLowerCase();
      if (tag === 'script') {
        violations.push({
          directive: 'script-elem',
          sink: '<script>',
          detail: 'Unexpected <script> element in server-rendered DSD output.',
        });
      }
      if (tag === 'link') linkCount += 1;
      if (tag === 'style') styleTagCount += 1;

      for (const attr of Array.from(el.attributes)) {
        const attrName = attr.name.toLowerCase();
        if (attrName === 'style') {
          violations.push({
            directive: 'style-src-attr',
            sink: `${tag}[style]`,
            detail: `Disallowed inline style="..." attribute on <${tag}> in DSD output.`,
          });
        }
        if (attrName.startsWith('on')) {
          violations.push({
            directive: 'script-src',
            sink: `${tag}[${attrName}]`,
            detail: `Disallowed inline event handler "${attrName}" on <${tag}>.`,
          });
        }
        if ((attrName === 'href' || attrName === 'src') && !isSafeUrl(attr.value)) {
          violations.push({
            directive: 'script-src',
            sink: `${tag}[${attrName}]`,
            detail: `Unsafe URL "${attr.value}" on <${tag}>.`,
          });
        }
      }

      if (tag === 'template') {
        templateCount += 1;
        const tpl = el as HTMLTemplateElement;
        if (tpl.content) {
          scanRoot(tpl.content);
        }
      }
    }
  }

  scanRoot(parsed.body);

  return {
    passed: violations.length === 0,
    violations,
    templateCount,
    linkCount,
    styleTagCount,
  };
}

/**
 * Executes the end-to-end strict CSP & Trusted Types compliance suite across
 * `@methane/sanitize`, `@methane/core`, `@methane/primitives`, and `@methane/ssr`.
 */
export async function runStrictCspSuite(): Promise<StrictCspSuiteResult> {
  const harness = installTrustedTypesAndCspGuards({
    allowedPolicies: ['methane-sanitize', 'lit-html'],
  });

  const negativeControlsVerified: string[] = [];

  try {
    // 1. Negative controls: raw string sinks, eval, new Function, and unauthorized policy MUST throw
    const probe = document.createElement('div');
    document.body.appendChild(probe);

    const assertRejected = (label: string, fn: () => void): void => {
      let threw = false;
      try {
        fn();
      } catch {
        threw = true;
      }
      if (!threw) {
        throw new Error(`Strict CSP negative control failed to reject: ${label}`);
      }
      negativeControlsVerified.push(label);
    };

    assertRejected('Element.innerHTML(string)', () => {
      Reflect.set(probe, 'innerHTML', '<span>raw</span>');
    });
    assertRejected('Element.outerHTML(string)', () => {
      Reflect.set(probe, 'outerHTML', '<span>raw</span>');
    });
    assertRejected('Element.insertAdjacentHTML(string)', () => {
      const insertAdj = Reflect.get(probe, 'insertAdjacentHTML') as (
        pos: InsertPosition,
        htmlText: string,
      ) => void;
      Reflect.apply(insertAdj, probe, ['beforeend', '<span>raw</span>']);
    });
    const probeShadow = probe.attachShadow({ mode: 'open' });
    assertRejected('ShadowRoot.innerHTML(string)', () => {
      Reflect.set(probeShadow, 'innerHTML', '<span>raw</span>');
    });
    assertRejected('eval(string)', () => {
      (globalThis as unknown as { eval: (s: string) => unknown }).eval('1 + 1');
    });
    assertRejected('new Function(string)', () => {
      const Fn = (globalThis as unknown as { Function: new (s: string) => () => unknown }).Function;
      new Fn('return 1')();
    });
    assertRejected('trustedTypes.createPolicy(unauthorized)', () => {
      const tt = (globalThis as unknown as {
        trustedTypes: { createPolicy: (name: string) => unknown };
      }).trustedTypes;
      tt.createPolicy('unauthorized-policy');
    });

    probe.remove();
    harness.clearViolations();

    // 2. Import Methane packages AFTER Trusted Types harness is active so lit-html creates 'lit-html' policy
    const sanitizeMod = await import('@methane/sanitize');
    const coreMod = await import('@methane/core');
    const primitivesMod = await import('@methane/primitives');
    const ssrMod = await import('@methane/ssr');

    // 3. Exercise @methane/sanitize under strict 'methane-sanitize' policy
    const tt = (globalThis as unknown as {
      trustedTypes: { createPolicy: (n: string, r: TrustedTypePolicyRules) => EnforcingTrustedTypePolicy };
    }).trustedTypes;
    const sanitizePolicy = tt.createPolicy('methane-sanitize', {
      createHTML: (dirty: string) => dirty,
    });

    const sanitizeTarget = document.createElement('div');
    sanitizeMod.safeSetHTML(
      sanitizeTarget,
      '<p>Safe <strong>content</strong><script>alert(1)</script><a href="javascript:alert(1)">bad</a></p>',
      { trustedTypesPolicy: sanitizePolicy },
    );
    if (sanitizeTarget.querySelector('script') !== null) {
      throw new Error('@methane/sanitize failed to strip <script>');
    }
    const trustedHtml = sanitizeMod.sanitizeToTrustedHTML('<em onclick="evil()">Trusted</em>', {
      trustedTypesPolicy: sanitizePolicy,
    });
    if (!(trustedHtml instanceof (globalThis as unknown as { TrustedHTML: new () => unknown }).TrustedHTML)) {
      throw new Error('sanitizeToTrustedHTML did not return a TrustedHTML instance');
    }

    const stream = sanitizeMod.createStreamSanitizer();
    stream.push('Streaming **markdown** <img src=x onerror=alert(1)>');
    stream.flushTo(sanitizeTarget, { trustedTypesPolicy: sanitizePolicy });

    // 4. Exercise @methane/core (UIElement + registerStyles)
    const { UIElement, css, html, registerStyles } = coreMod;
    const customTag = 'mth-csp-canary';
    class CspCanaryElement extends UIElement {
      static override styles = css`
        :host {
          display: block;
          padding-inline: 0.5rem;
        }
      `;
      override render() {
        return html`<span part="label">CSP OK</span>`;
      }
    }
    if (!customElements.get(customTag)) {
      customElements.define(customTag, CspCanaryElement);
    }
    registerStyles(customTag, ':host { border-radius: 4px; }');
    const canaryEl = document.createElement(customTag) as InstanceType<typeof CspCanaryElement>;
    document.body.appendChild(canaryEl);
    await canaryEl.updateComplete;
    canaryEl.remove();

    // 5. Exercise @methane/primitives utility elements
    primitivesMod.registerUtilityElements('mth');
    const vh = document.createElement('mth-visually-hidden');
    vh.textContent = 'Hidden label';
    const skip = document.createElement('mth-skip-link');
    const boundary = document.createElement('mth-error-boundary') as InstanceType<
      typeof primitivesMod.MthErrorBoundaryElement
    >;
    document.body.append(vh, skip, boundary);
    await Promise.all([
      (vh as unknown as { updateComplete: Promise<boolean> }).updateComplete,
      (skip as unknown as { updateComplete: Promise<boolean> }).updateComplete,
      boundary.updateComplete,
    ]);
    boundary.capture(new Error('Handled boundary fault'));
    await boundary.updateComplete;
    boundary.reset();
    await boundary.updateComplete;
    vh.remove();
    skip.remove();
    boundary.remove();

    // 6. Exercise @methane/ssr in both 'linked' and 'inline' modes and audit DSD output
    const ssrHtmlLinked = await ssrMod.renderToString(
      html`<mth-csp-canary></mth-csp-canary><mth-visually-hidden>SR</mth-visually-hidden>`,
      { styles: 'linked' },
    );
    const ssrHtmlInline = await ssrMod.renderToString(
      html`<mth-csp-canary></mth-csp-canary><mth-visually-hidden>SR</mth-visually-hidden>`,
      { styles: 'inline' },
    );

    const linkedSsrAudit = auditDsdHtmlForCsp(ssrHtmlLinked);
    const inlineSsrAudit = auditDsdHtmlForCsp(ssrHtmlInline);

    const unexpectedViolations = [
      ...harness.getViolations(),
      ...linkedSsrAudit.violations,
      ...inlineSsrAudit.violations,
    ];

    return {
      passed: unexpectedViolations.length === 0 && linkedSsrAudit.passed && inlineSsrAudit.passed,
      createdPolicies: harness.getCreatedPolicies(),
      negativeControlsVerified,
      linkedSsrAudit,
      inlineSsrAudit,
      unexpectedViolations,
    };
  } finally {
    harness.uninstall();
  }
}
