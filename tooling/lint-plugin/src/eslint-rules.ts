import { posix } from 'node:path';
import type { ESLint, Rule } from 'eslint';
import { analyzeCssText } from './css-checks.js';

type EstreeNode = Rule.Node;

function getStaticPropertyName(node: EstreeNode | null | undefined): string | null {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  return null;
}

function getMemberPropertyName(
  member: Extract<EstreeNode, { type: 'MemberExpression' }>,
): string | null {
  if (!member.computed && member.property.type === 'Identifier') {
    return member.property.name;
  }
  if (member.computed) {
    return getStaticPropertyName(member.property as EstreeNode);
  }
  return null;
}

function isThisExpression(node: EstreeNode | null | undefined): boolean {
  return node?.type === 'ThisExpression';
}

function getStringLiteralValue(node: EstreeNode | null | undefined): string | null {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? null;
  }
  return null;
}

function hasBooleanTrueProperty(
  obj: Extract<EstreeNode, { type: 'ObjectExpression' }>,
  propName: string,
): boolean {
  for (const prop of obj.properties) {
    if (prop.type !== 'Property') continue;
    const key = prop.computed ? getStaticPropertyName(prop.key as EstreeNode) : getStaticPropertyName(prop.key as EstreeNode);
    if (key === propName && prop.value.type === 'Literal' && prop.value.value === true) {
      return true;
    }
  }
  return false;
}

export const noHostDisabledInFormDisabledCallback: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow mutating host `disabled` property or attribute inside `formDisabledCallback` (ADR-014).',
    },
    schema: [],
    messages: {
      noHostDisabledMutation:
        'Do not mutate host `disabled` inside `formDisabledCallback`; update internal shadow control state instead.',
    },
  },
  create(context) {
    let formDisabledDepth = 0;

    return {
      MethodDefinition(node) {
        if (getStaticPropertyName(node.key as EstreeNode) === 'formDisabledCallback') {
          formDisabledDepth += 1;
        }
      },
      'MethodDefinition:exit'(node) {
        if (getStaticPropertyName(node.key as EstreeNode) === 'formDisabledCallback') {
          formDisabledDepth = Math.max(0, formDisabledDepth - 1);
        }
      },
      AssignmentExpression(node) {
        if (formDisabledDepth === 0) return;
        if (node.left.type !== 'MemberExpression') return;
        if (
          isThisExpression(node.left.object as EstreeNode) &&
          getMemberPropertyName(node.left as Extract<EstreeNode, { type: 'MemberExpression' }>) ===
            'disabled'
        ) {
          context.report({ node, messageId: 'noHostDisabledMutation' });
        }
      },
      CallExpression(node) {
        if (formDisabledDepth === 0) return;
        if (node.callee.type !== 'MemberExpression') return;
        const callee = node.callee as Extract<EstreeNode, { type: 'MemberExpression' }>;
        if (!isThisExpression(callee.object as EstreeNode)) return;
        const method = getMemberPropertyName(callee);
        if (method === 'setAttribute' || method === 'removeAttribute' || method === 'toggleAttribute') {
          const firstArg = getStringLiteralValue(node.arguments[0] as EstreeNode | undefined);
          if (firstArg?.toLowerCase() === 'disabled') {
            context.report({ node, messageId: 'noHostDisabledMutation' });
          }
        }
      },
    };
  },
};

export const noTabindexInConstructor: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow setting `tabIndex` or `tabindex` attribute inside custom element `constructor()` (ADR-014).',
    },
    schema: [],
    messages: {
      noTabindexInConstructor:
        'Do not set `tabIndex` or `tabindex` inside `constructor()`; configure focusability in `connectedCallback()` or on shadow controls.',
    },
  },
  create(context) {
    let constructorDepth = 0;

    return {
      MethodDefinition(node) {
        if (node.kind === 'constructor') {
          constructorDepth += 1;
        }
      },
      'MethodDefinition:exit'(node) {
        if (node.kind === 'constructor') {
          constructorDepth = Math.max(0, constructorDepth - 1);
        }
      },
      AssignmentExpression(node) {
        if (constructorDepth === 0) return;
        if (node.left.type !== 'MemberExpression') return;
        const left = node.left as Extract<EstreeNode, { type: 'MemberExpression' }>;
        if (isThisExpression(left.object as EstreeNode) && getMemberPropertyName(left) === 'tabIndex') {
          context.report({ node, messageId: 'noTabindexInConstructor' });
        }
      },
      CallExpression(node) {
        if (constructorDepth === 0) return;
        if (node.callee.type !== 'MemberExpression') return;
        const callee = node.callee as Extract<EstreeNode, { type: 'MemberExpression' }>;
        if (!isThisExpression(callee.object as EstreeNode)) return;
        const method = getMemberPropertyName(callee);
        if (method === 'setAttribute') {
          const firstArg = getStringLiteralValue(node.arguments[0] as EstreeNode | undefined);
          if (firstArg?.toLowerCase() === 'tabindex') {
            context.report({ node, messageId: 'noTabindexInConstructor' });
          }
        }
      },
    };
  },
};

interface ClassFocusState {
  hasDelegatesFocus: boolean;
  hostRoleNodes: EstreeNode[];
}

function isInternalsObject(node: EstreeNode): boolean {
  if (node.type === 'Identifier') {
    return node.name === 'internals' || node.name === '_internals';
  }
  if (node.type === 'MemberExpression' && isThisExpression(node.object as EstreeNode)) {
    const prop = getMemberPropertyName(node as Extract<EstreeNode, { type: 'MemberExpression' }>);
    return prop === 'internals' || prop === '_internals';
  }
  return false;
}

export const noDelegatesFocusWithHostRole: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow pairing `delegatesFocus: true` with host `internals.role` in the same custom element class (ADR-014).',
    },
    schema: [],
    messages: {
      delegatesFocusWithHostRole:
        'Do not combine `delegatesFocus: true` with host `internals.role`; place the ARIA role on the internal focus target or set `focusModel: "host"` without `delegatesFocus`.',
    },
  },
  create(context) {
    const classStack: ClassFocusState[] = [];

    function enterClass(): void {
      classStack.push({ hasDelegatesFocus: false, hostRoleNodes: [] });
    }

    function exitClass(): void {
      const state = classStack.pop();
      if (!state) return;
      if (state.hasDelegatesFocus && state.hostRoleNodes.length > 0) {
        for (const node of state.hostRoleNodes) {
          context.report({ node, messageId: 'delegatesFocusWithHostRole' });
        }
      }
    }

    return {
      ClassDeclaration: enterClass,
      'ClassDeclaration:exit': exitClass,
      ClassExpression: enterClass,
      'ClassExpression:exit': exitClass,
      PropertyDefinition(node) {
        const current = classStack.at(-1);
        if (!current) return;
        const keyName = getStaticPropertyName(node.key as EstreeNode);
        if (keyName === 'shadowRootOptions' && node.value?.type === 'ObjectExpression') {
          if (hasBooleanTrueProperty(node.value as Extract<EstreeNode, { type: 'ObjectExpression' }>, 'delegatesFocus')) {
            current.hasDelegatesFocus = true;
          }
        }
      },
      CallExpression(node) {
        const current = classStack.at(-1);
        if (!current) return;
        if (node.callee.type !== 'MemberExpression') return;
        const callee = node.callee as Extract<EstreeNode, { type: 'MemberExpression' }>;
        if (
          isThisExpression(callee.object as EstreeNode) &&
          getMemberPropertyName(callee) === 'attachShadow' &&
          node.arguments[0]?.type === 'ObjectExpression'
        ) {
          if (
            hasBooleanTrueProperty(
              node.arguments[0] as Extract<EstreeNode, { type: 'ObjectExpression' }>,
              'delegatesFocus',
            )
          ) {
            current.hasDelegatesFocus = true;
          }
        }
      },
      AssignmentExpression(node) {
        const current = classStack.at(-1);
        if (!current) return;
        if (node.left.type !== 'MemberExpression') return;
        const left = node.left as Extract<EstreeNode, { type: 'MemberExpression' }>;
        if (
          getMemberPropertyName(left) === 'role' &&
          isInternalsObject(left.object as EstreeNode)
        ) {
          current.hostRoleNodes.push(node);
        }
      },
    };
  },
};

export const noRawHtml: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, and `unsafeHTML` outside `@methane/sanitize` (ADR-012, ADR-014).',
    },
    schema: [],
    messages: {
      noRawHtmlSink:
        'Raw HTML sink "{{name}}" is banned outside `@methane/sanitize`; use `safeSetHTML` or `parseSafeFragment` from `@methane/sanitize`.',
    },
  },
  create(context) {
    const normalizedPath = context.filename.replace(/\\/g, '/');
    if (/(?:^|\/)packages\/sanitize\//.test(normalizedPath)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source === 'string' && /lit\/directives\/unsafe-(?:html|svg)/.test(source)) {
          context.report({
            node,
            messageId: 'noRawHtmlSink',
            data: { name: source },
          });
          return;
        }
        for (const spec of node.specifiers) {
          if (
            spec.type === 'ImportSpecifier' &&
            spec.imported.type === 'Identifier' &&
            (spec.imported.name === 'unsafeHTML' || spec.imported.name === 'unsafeSVG')
          ) {
            context.report({
              node: spec,
              messageId: 'noRawHtmlSink',
              data: { name: spec.imported.name },
            });
          }
        }
      },
      AssignmentExpression(node) {
        if (node.left.type !== 'MemberExpression') return;
        const prop = getMemberPropertyName(
          node.left as Extract<EstreeNode, { type: 'MemberExpression' }>,
        );
        if (prop === 'innerHTML' || prop === 'outerHTML') {
          context.report({
            node,
            messageId: 'noRawHtmlSink',
            data: { name: prop },
          });
        }
      },
      CallExpression(node) {
        if (node.callee.type === 'Identifier') {
          if (node.callee.name === 'unsafeHTML' || node.callee.name === 'unsafeSVG') {
            context.report({
              node,
              messageId: 'noRawHtmlSink',
              data: { name: node.callee.name },
            });
          }
          return;
        }
        if (node.callee.type === 'MemberExpression') {
          const callee = node.callee as Extract<EstreeNode, { type: 'MemberExpression' }>;
          const method = getMemberPropertyName(callee);
          if (method === 'insertAdjacentHTML') {
            context.report({
              node,
              messageId: 'noRawHtmlSink',
              data: { name: 'insertAdjacentHTML' },
            });
          } else if (
            (method === 'write' || method === 'writeln') &&
            callee.object.type === 'Identifier' &&
            callee.object.name === 'document'
          ) {
            context.report({
              node,
              messageId: 'noRawHtmlSink',
              data: { name: `document.${method}` },
            });
          }
        }
      },
    };
  },
};

export const PACKAGE_LAYER_ORDER: Readonly<Record<string, number>> = {
  '@methane/tokens': 0,
  '@methane/css': 0,
  '@methane/sanitize': 0,
  '@methane/locales': 0,
  '@methane/core': 1,
  '@methane/primitives': 2,
  '@methane/ui': 3,
  '@methane/ai': 4,
  '@methane/auth': 4,
  '@methane/admin': 4,
  '@methane/chat': 4,
  '@methane/commerce': 4,
  '@methane/datagrid': 5,
  '@methane/charts': 5,
  '@methane/editor': 5,
  '@methane/code': 5,
  '@methane/spreadsheet': 5,
  '@methane/flow': 5,
  '@methane/maps': 5,
  '@methane/media': 5,
  '@methane/rtc': 5,
  '@methane/pdf': 5,
  '@methane/3d': 5,
  '@methane/ssr': 6,
  '@methane/ssr-next': 7,
  '@methane/ssr-nuxt': 7,
  '@methane/ssr-sveltekit': 7,
  '@methane/ssr-astro': 7,
  '@methane/ssr-angular': 7,
  '@methane/react': 8,
  '@methane/vue': 8,
  '@methane/angular': 8,
  '@methane/svelte': 8,
};

export function isAllowedPackageEdge(fromPackage: string, toPackage: string): boolean {
  if (fromPackage === toPackage) return true;
  const fromRank = PACKAGE_LAYER_ORDER[fromPackage];
  const toRank = PACKAGE_LAYER_ORDER[toPackage];
  if (fromRank === undefined || toRank === undefined) return true;

  // Kits (4) and satellites (5) may depend only on core stack layers 0..3.
  if (fromRank === 4 || fromRank === 5) return toRank <= 3;

  // Generic SSR (6) may depend only on core stack layers 0..3.
  if (fromRank === 6) return toRank <= 3;

  // Framework SSR adapters (7) may depend on layers 0..3 and @methane/ssr (6).
  if (fromRank === 7) return toRank <= 3 || toRank === 6;

  // Framework wrappers (8) may depend on layers 0..3.
  if (fromRank === 8) return toRank <= 3;

  // Lower layers (0..3) cannot depend on higher layers.
  if (toRank > fromRank) return false;

  // Explicit layer 0 rule: only @methane/css may depend on @methane/tokens.
  if (fromRank === 0 && toRank === 0) {
    return fromPackage === '@methane/css' && toPackage === '@methane/tokens';
  }
  return true;
}

/**
 * Detects directed cycles in a dependency adjacency map.
 * Returns an array of cycles (each represented as the ordered node path closing the cycle).
 */
export function detectImportCycles(
  graph: ReadonlyMap<string, ReadonlyArray<string>>,
): string[][] {
  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];
  const cycles: string[][] = [];

  function dfs(node: string): void {
    state.set(node, 'visiting');
    stack.push(node);

    const neighbors = graph.get(node) ?? [];
    for (const next of neighbors) {
      const nextState = state.get(next);
      if (nextState === 'visiting') {
        const cycleStart = stack.indexOf(next);
        cycles.push([...stack.slice(cycleStart), next]);
      } else if (nextState === undefined) {
        dfs(next);
      }
    }

    stack.pop();
    state.set(node, 'visited');
  }

  for (const node of graph.keys()) {
    if (!state.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

function inferPackageFromFilename(filename: string): string | null {
  const normalized = filename.replace(/\\/g, '/');
  const kitMatch = /(?:^|\/)packages\/kits\/([^/]+)\//.exec(normalized);
  if (kitMatch?.[1]) return `@methane/${kitMatch[1]}`;
  const satMatch = /(?:^|\/)packages\/satellites\/([^/]+)\//.exec(normalized);
  if (satMatch?.[1]) return `@methane/${satMatch[1]}`;
  const pkgMatch = /(?:^|\/)packages\/([^/]+)\//.exec(normalized);
  if (pkgMatch?.[1]) return `@methane/${pkgMatch[1]}`;
  return null;
}

function extractMethanePackageName(specifier: string): string | null {
  if (!specifier.startsWith('@methane/')) return null;
  const parts = specifier.split('/');
  if (parts.length < 2) return null;
  return `${parts[0]}/${parts[1]}`;
}

function extractComponentLocation(
  normalizedPath: string,
): { readonly packageRoot: string; readonly component: string } | null {
  const match =
    /^(.*\/?packages\/(?:kits\/[^/]+|satellites\/[^/]+|ui)\/src\/(?:components\/)?)([^/]+)\//.exec(
      normalizedPath,
    );
  if (!match?.[1] || !match[2]) return null;
  if (match[2] === 'components') return null;
  return { packageRoot: match[1], component: match[2] };
}

function isCrossComponentInternalRelativeImport(filename: string, specifier: string): boolean {
  if (!specifier.startsWith('.')) return false;
  const normalized = filename.replace(/\\/g, '/');
  const sourceLoc = extractComponentLocation(normalized);
  if (!sourceLoc || sourceLoc.component === 'shared') return false;

  const resolved = posix.normalize(posix.join(posix.dirname(normalized), specifier));
  const targetLoc = extractComponentLocation(resolved);
  if (targetLoc) {
    return (
      targetLoc.packageRoot === sourceLoc.packageRoot &&
      targetLoc.component !== sourceLoc.component &&
      targetLoc.component !== 'shared'
    );
  }

  // Also flag climbs out of `.../src/components/<comp>/...` into `.../src/<other>/...`
  const packageSrcPrefix = sourceLoc.packageRoot.replace(/components\/$/, '');
  if (resolved.startsWith(packageSrcPrefix)) {
    const rest = resolved.slice(packageSrcPrefix.length);
    const firstSeg = rest.split('/')[0];
    if (
      firstSeg &&
      rest.includes('/') &&
      firstSeg !== 'components' &&
      firstSeg !== 'shared' &&
      firstSeg !== sourceLoc.component
    ) {
      return true;
    }
  }

  return false;
}

export const noCrossComponentInternalImports: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce acyclic package DAG and ban cross-component internal imports (ADR-002, ADR-014).',
    },
    schema: [],
    messages: {
      internalImport:
        'Cross-component internal import "{{specifier}}" is banned by ADR-002; compose @methane/primitives controllers or public <mth-*> exports only.',
      dagViolation:
        'Package DAG violation: "{{from}}" cannot depend on "{{to}}" (ADR-002: tokens/sanitize -> core -> primitives -> ui -> kits -> satellites).',
    },
  },
  create(context) {
    const fromPackage = inferPackageFromFilename(context.filename);

    function checkSpecifier(node: EstreeNode, specifier: string): void {
      if (/^@methane\/[^/]+\/(?:src|internal|dist)\//.test(specifier)) {
        context.report({
          node,
          messageId: 'internalImport',
          data: { specifier },
        });
        return;
      }

      if (isCrossComponentInternalRelativeImport(context.filename, specifier)) {
        context.report({
          node,
          messageId: 'internalImport',
          data: { specifier },
        });
        return;
      }

      const toPackage = extractMethanePackageName(specifier);
      if (fromPackage && toPackage && !isAllowedPackageEdge(fromPackage, toPackage)) {
        context.report({
          node,
          messageId: 'dagViolation',
          data: { from: fromPackage, to: toPackage },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value === 'string') {
          checkSpecifier(node.source as EstreeNode, node.source.value);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source && typeof node.source.value === 'string') {
          checkSpecifier(node.source as EstreeNode, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        if (typeof node.source.value === 'string') {
          checkSpecifier(node.source as EstreeNode, node.source.value);
        }
      },
      ImportExpression(node) {
        const val = getStringLiteralValue(node.source as EstreeNode);
        if (val) {
          checkSpecifier(node.source as EstreeNode, val);
        }
      },
    };
  },
};

export const noCssViolationsInLit: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Validate `css` tagged template literals against Methane CSS invariants (:host-context, physical properties, :host --mth-* seeding).',
    },
    schema: [],
    messages: {
      cssViolation: '{{message}}',
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node) {
        if (node.tag.type !== 'Identifier' || node.tag.name !== 'css') return;
        const cssSource = node.quasi.quasis
          .map((q, idx) =>
            idx < node.quasi.expressions.length
              ? `${q.value.raw}var(--_mth-expr-${idx})`
              : q.value.raw,
          )
          .join('');
        try {
          const violations = analyzeCssText(cssSource);
          for (const v of violations) {
            context.report({
              node: node.quasi,
              messageId: 'cssViolation',
              data: { message: v.message },
            });
          }
        } catch {
          // Ignore incomplete/dynamic CSS expressions that PostCSS cannot parse statically.
        }
      },
    };
  },
};

export const eslintRules = {
  'no-host-disabled-in-form-disabled-callback': noHostDisabledInFormDisabledCallback,
  'no-tabindex-in-constructor': noTabindexInConstructor,
  'no-delegates-focus-with-host-role': noDelegatesFocusWithHostRole,
  'no-raw-html': noRawHtml,
  'no-cross-component-internal-imports': noCrossComponentInternalImports,
  'no-css-violations-in-lit': noCssViolationsInLit,
} as const;

export const methaneEslintPlugin: ESLint.Plugin = {
  meta: {
    name: '@methane/lint-plugin',
    version: '0.1.0',
  },
  rules: eslintRules,
};

export const recommendedEslintRules: Readonly<Record<string, 'error'>> = {
  '@methane/no-host-disabled-in-form-disabled-callback': 'error',
  '@methane/no-tabindex-in-constructor': 'error',
  '@methane/no-delegates-focus-with-host-role': 'error',
  '@methane/no-raw-html': 'error',
  '@methane/no-cross-component-internal-imports': 'error',
  '@methane/no-css-violations-in-lit': 'error',
};
