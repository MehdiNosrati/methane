import postcss, { type Declaration, type Node, type Root, type Rule } from 'postcss';

export interface CssViolation {
  readonly ruleId: 'no-host-context' | 'logical-properties-only' | 'no-host-public-token-seed';
  readonly message: string;
  readonly node: Node;
  readonly line: number;
  readonly column: number;
}

const PHYSICAL_PROPERTY_ALTERNATIVES: Readonly<Record<string, string>> = {
  top: 'inset-block-start',
  right: 'inset-inline-end',
  bottom: 'inset-block-end',
  left: 'inset-inline-start',
  width: 'inline-size',
  height: 'block-size',
  'min-width': 'min-inline-size',
  'max-width': 'max-inline-size',
  'min-height': 'min-block-size',
  'max-height': 'max-block-size',
  'margin-top': 'margin-block-start',
  'margin-right': 'margin-inline-end',
  'margin-bottom': 'margin-block-end',
  'margin-left': 'margin-inline-start',
  'padding-top': 'padding-block-start',
  'padding-right': 'padding-inline-end',
  'padding-bottom': 'padding-block-end',
  'padding-left': 'padding-inline-start',
  'border-top': 'border-block-start',
  'border-right': 'border-inline-end',
  'border-bottom': 'border-block-end',
  'border-left': 'border-inline-start',
  'border-top-width': 'border-block-start-width',
  'border-right-width': 'border-inline-end-width',
  'border-bottom-width': 'border-block-end-width',
  'border-left-width': 'border-inline-start-width',
  'border-top-style': 'border-block-start-style',
  'border-right-style': 'border-inline-end-style',
  'border-bottom-style': 'border-block-end-style',
  'border-left-style': 'border-inline-start-style',
  'border-top-color': 'border-block-start-color',
  'border-right-color': 'border-inline-end-color',
  'border-bottom-color': 'border-block-end-color',
  'border-left-color': 'border-inline-start-color',
  'border-top-left-radius': 'border-start-start-radius',
  'border-top-right-radius': 'border-start-end-radius',
  'border-bottom-left-radius': 'border-end-start-radius',
  'border-bottom-right-radius': 'border-end-end-radius',
  'scroll-margin-top': 'scroll-margin-block-start',
  'scroll-margin-right': 'scroll-margin-inline-end',
  'scroll-margin-bottom': 'scroll-margin-block-end',
  'scroll-margin-left': 'scroll-margin-inline-start',
  'scroll-padding-top': 'scroll-padding-block-start',
  'scroll-padding-right': 'scroll-padding-inline-end',
  'scroll-padding-bottom': 'scroll-padding-block-end',
  'scroll-padding-left': 'scroll-padding-inline-start',
  'overflow-x': 'overflow-inline',
  'overflow-y': 'overflow-block',
  'overscroll-behavior-x': 'overscroll-behavior-inline',
  'overscroll-behavior-y': 'overscroll-behavior-block',
};

const PHYSICAL_DIRECTIONAL_PROPS: ReadonlySet<string> = new Set(['text-align', 'float', 'clear']);

const HOST_SELECTOR_PATTERN = /(?:^|[\s,>~+]):host(?:\(|$|[\s,:.[#])/;

export function isHostSelector(selector: string): boolean {
  return selector
    .split(',')
    .some((part) => HOST_SELECTOR_PATTERN.test(part.trim()));
}

export function hasHostContextSelector(selector: string): boolean {
  return /:host-context\s*\(/i.test(selector);
}

export function checkLogicalDeclaration(decl: Declaration): CssViolation | null {
  const prop = decl.prop.toLowerCase();
  if (prop.startsWith('--')) return null;

  const logicalAlt = PHYSICAL_PROPERTY_ALTERNATIVES[prop];
  if (logicalAlt) {
    return {
      ruleId: 'logical-properties-only',
      message: `Physical CSS property "${decl.prop}" is banned; use logical property "${logicalAlt}" instead.`,
      node: decl,
      line: decl.source?.start?.line ?? 1,
      column: decl.source?.start?.column ?? 1,
    };
  }

  if (PHYSICAL_DIRECTIONAL_PROPS.has(prop)) {
    const val = decl.value.trim().toLowerCase();
    if (val === 'left' || val === 'right') {
      const logicalVal =
        prop === 'text-align'
          ? val === 'left'
            ? 'start'
            : 'end'
          : val === 'left'
            ? 'inline-start'
            : 'inline-end';
      return {
        ruleId: 'logical-properties-only',
        message: `Physical CSS value "${decl.prop}: ${decl.value}" is banned; use "${logicalVal}" instead.`,
        node: decl,
        line: decl.source?.start?.line ?? 1,
        column: decl.source?.start?.column ?? 1,
      };
    }
  }

  return null;
}

export function isInsideHostRule(decl: Declaration): boolean {
  let parent: Node | undefined = decl.parent;
  while (parent) {
    if (parent.type === 'rule' && isHostSelector((parent as Rule).selector)) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

export function analyzeCssRoot(root: Root): CssViolation[] {
  const violations: CssViolation[] = [];

  root.walkRules((rule) => {
    if (hasHostContextSelector(rule.selector)) {
      violations.push({
        ruleId: 'no-host-context',
        message: `":host-context()" is banned by Methane ADR-014 (found in "${rule.selector}"). Use CSS custom properties or ContextProtocol instead.`,
        node: rule,
        line: rule.source?.start?.line ?? 1,
        column: rule.source?.start?.column ?? 1,
      });
    }
  });

  root.walkDecls((decl) => {
    const logical = checkLogicalDeclaration(decl);
    if (logical) {
      violations.push(logical);
    }

    if (decl.prop.startsWith('--mth-') && isInsideHostRule(decl)) {
      violations.push({
        ruleId: 'no-host-public-token-seed',
        message: `Public token "${decl.prop}" must not be seeded on :host; alias it into a private "--_*" variable instead.`,
        node: decl,
        line: decl.source?.start?.line ?? 1,
        column: decl.source?.start?.column ?? 1,
      });
    }
  });

  return violations;
}

export function analyzeCssText(cssSource: string): CssViolation[] {
  const root = postcss.parse(cssSource);
  return analyzeCssRoot(root);
}
