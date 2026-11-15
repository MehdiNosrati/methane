import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import type {
  BindableControlProp,
  ExtendedCemDeclaration,
  ExtendedCustomElementsManifest,
  NormalizedComponentModel,
  NormalizedCssProperty,
  NormalizedEvent,
  NormalizedPart,
  NormalizedProp,
  NormalizedSlot,
} from './types.js';

export function toPascalCase(input: string): string {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function toCamelCase(input: string): string {
  const pascal = toPascalCase(input);
  return pascal.length > 0 ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : '';
}

const KNOWN_TYPE_IDENTIFIERS = new Set<string>([
  // Primitives & TS keywords
  'string',
  'number',
  'boolean',
  'bigint',
  'symbol',
  'void',
  'undefined',
  'null',
  'never',
  'unknown',
  'object',
  'true',
  'false',
  'readonly',
  'keyof',
  'typeof',
  'infer',
  'extends',
  'is',
  'asserts',
  'new',
  // ES utility & built-in types
  'Array',
  'ReadonlyArray',
  'Record',
  'Readonly',
  'Partial',
  'Required',
  'Pick',
  'Omit',
  'Exclude',
  'Extract',
  'NonNullable',
  'ReturnType',
  'Parameters',
  'Promise',
  'Set',
  'Map',
  'ReadonlySet',
  'ReadonlyMap',
  'WeakSet',
  'WeakMap',
  'Date',
  'RegExp',
  'Error',
  'Uint8Array',
  'Int8Array',
  'Uint16Array',
  'Int16Array',
  'Uint32Array',
  'Int32Array',
  'Float32Array',
  'Float64Array',
  'ArrayBuffer',
  'ArrayBufferView',
  'DataView',
  'Function',
  // DOM types (ES2023 + DOM + DOM.Iterable)
  'HTMLElement',
  'Element',
  'Node',
  'Document',
  'Window',
  'Event',
  'CustomEvent',
  'FocusEvent',
  'KeyboardEvent',
  'MouseEvent',
  'PointerEvent',
  'InputEvent',
  'SubmitEvent',
  'UIEvent',
  'ErrorEvent',
  'File',
  'FileList',
  'Blob',
  'DOMRect',
  'DOMRectReadOnly',
  'ValidityState',
  'AbortSignal',
  'AbortController',
  'CSSStyleSheet',
  'FormData',
  'URL',
  'URLSearchParams',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'HTMLSelectElement',
  'HTMLButtonElement',
  'HTMLFormElement',
  'SVGElement',
]);

function skipWhitespace(src: string, idx: number): number {
  let i = idx;
  while (i < src.length && /\s/.test(src[i]!)) {
    i += 1;
  }
  return i;
}

function consumeStringLiteral(src: string, start: number): number {
  const quote = src[start];
  let i = start + 1;
  while (i < src.length) {
    const ch = src[i]!;
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return i + 1;
    }
    i += 1;
  }
  return src.length;
}

function consumeBalanced(
  src: string,
  start: number,
  openCh: string,
  closeCh: string,
): number {
  let depth = 0;
  let i = start;
  while (i < src.length) {
    const ch = src[i]!;
    if (ch === "'" || ch === '"') {
      i = consumeStringLiteral(src, i);
      continue;
    }
    if (openCh === '<' && ch === '=' && src[i + 1] === '>') {
      i += 2;
      continue;
    }
    if (ch === openCh) {
      depth += 1;
    } else if (ch === closeCh) {
      depth -= 1;
      if (depth === 0) {
        return i + 1;
      }
    }
    i += 1;
  }
  return src.length;
}

function isEmptyArrayBrackets(src: string, openBracketIdx: number): boolean {
  const after = skipWhitespace(src, openBracketIdx + 1);
  return src[after] === ']';
}

function isPropertyOrParamName(src: string, afterIdentIdx: number): boolean {
  let i = skipWhitespace(src, afterIdentIdx);
  if (src[i] === '?') {
    i = skipWhitespace(src, i + 1);
  }
  return src[i] === ':' || src[i] === '(';
}

/**
 * Sanitizes TypeScript type expressions extracted from CEM / BehaviorSpecs so
 * generated wrapper files compile standalone without unimported nominal type references
 * or `any`.
 */
export function sanitizeTypeText(raw: string | undefined): string {
  const text = raw?.trim();
  if (!text) return 'unknown';

  let out = '';
  let i = 0;

  while (i < text.length) {
    const ch = text[i]!;

    if (ch === "'" || ch === '"') {
      const end = consumeStringLiteral(text, i);
      out += text.slice(i, end);
      i = end;
      continue;
    }

    if (ch === '{') {
      const afterWs = skipWhitespace(text, i + 1);
      if (text[afterWs] === '}') {
        out += 'Record<string, never>';
        i = afterWs + 1;
        continue;
      }
    }

    if (/[A-Za-z_$]/.test(ch)) {
      let end = i + 1;
      while (end < text.length && /[A-Za-z0-9_$]/.test(text[end]!)) {
        end += 1;
      }
      const ident = text.slice(i, end);

      if (ident === 'any') {
        out += isPropertyOrParamName(text, end) ? ident : 'unknown';
        i = end;
        continue;
      }

      if (KNOWN_TYPE_IDENTIFIERS.has(ident) || isPropertyOrParamName(text, end)) {
        out += ident;
        i = end;
        continue;
      }

      // Preserve lowercase tokens unless they look like an unimported type; keep single-letter generics (e.g. T) sanitized.
      if (/^[a-z]/.test(ident)) {
        out += ident;
        i = end;
        continue;
      }

      // Unimported nominal type identifier: consume optional `.Member`, `<...>`, and indexed access `[...]`,
      // while preserving trailing array suffix `[]`.
      let cursor = end;
      let advanced = true;
      while (advanced) {
        advanced = false;
        const afterWs = skipWhitespace(text, cursor);
        if (text[afterWs] === '.') {
          let memberEnd = skipWhitespace(text, afterWs + 1);
          while (memberEnd < text.length && /[A-Za-z0-9_$]/.test(text[memberEnd]!)) {
            memberEnd += 1;
          }
          cursor = memberEnd;
          advanced = true;
        } else if (text[afterWs] === '<') {
          cursor = consumeBalanced(text, afterWs, '<', '>');
          advanced = true;
        } else if (text[afterWs] === '[' && !isEmptyArrayBrackets(text, afterWs)) {
          cursor = consumeBalanced(text, afterWs, '[', ']');
          advanced = true;
        }
      }

      out += 'unknown';
      i = cursor;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

function sanitizeDefaultExpression(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === 'true' ||
    trimmed === 'false' ||
    /^-?\d+(\.\d+)?$/.test(trimmed)
  ) {
    return trimmed;
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    trimmed.startsWith('[') ||
    trimmed.startsWith('{')
  ) {
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      return JSON.stringify(trimmed);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    return trimmed;
  }
  return JSON.stringify(trimmed);
}

function formatDefaultLiteral(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function extractDetailType(rawEventType: string | undefined): string {
  if (!rawEventType) return 'Record<string, unknown>';
  const customMatch = /^CustomEvent<(.+)>$/.exec(rawEventType.trim());
  if (customMatch?.[1]) {
    return sanitizeTypeText(customMatch[1].trim());
  }
  return sanitizeTypeText(rawEventType.trim());
}

function normalizeProps(
  decl: ExtendedCemDeclaration,
  spec: ComponentBehaviorSpec | undefined,
): NormalizedProp[] {
  const byName = new Map<string, NormalizedProp>();

  for (const member of decl.members ?? []) {
    if (member.kind !== 'field') continue;
    if (member.name.startsWith('_') || member.name.startsWith('#')) continue;
    byName.set(member.name, {
      name: member.name,
      attr: member.attribute ?? member.name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
      type: sanitizeTypeText(member.type?.text),
      defaultValue: sanitizeDefaultExpression(member.default),
      description: member.description ?? '',
      reflect: Boolean(member.reflect),
    });
  }

  for (const attr of decl.attributes ?? []) {
    const fieldName = attr.fieldName ?? toCamelCase(attr.name);
    if (!byName.has(fieldName)) {
      byName.set(fieldName, {
        name: fieldName,
        attr: attr.name,
        type: sanitizeTypeText(attr.type?.text),
        defaultValue: sanitizeDefaultExpression(attr.default),
        description: attr.description ?? '',
        reflect: false,
      });
    }
  }

  for (const specProp of spec?.props ?? []) {
    const existing = byName.get(specProp.name);
    const attrName =
      specProp.attr === false
        ? null
        : typeof specProp.attr === 'string'
          ? specProp.attr
          : specProp.name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

    byName.set(specProp.name, {
      name: specProp.name,
      attr: attrName,
      type: sanitizeTypeText(specProp.type || existing?.type),
      defaultValue: formatDefaultLiteral(specProp.default) ?? existing?.defaultValue,
      description: existing?.description ?? '',
      reflect: existing?.reflect ?? false,
    });
  }

  return [...byName.values()];
}

function normalizeEvents(
  decl: ExtendedCemDeclaration,
  spec: ComponentBehaviorSpec | undefined,
): NormalizedEvent[] {
  const byName = new Map<string, NormalizedEvent>();

  for (const ev of decl.events ?? []) {
    const pascal = toPascalCase(ev.name);
    const camel = toCamelCase(ev.name);
    byName.set(ev.name, {
      name: ev.name,
      reactPropName: `on${ev.name}`,
      legacyReactPropName: `on${pascal}`,
      angularOutputName: camel,
      vueEmitName: ev.name,
      sveltePropName: `on${ev.name}`,
      detailType: extractDetailType(ev.type?.text),
      cancelable: false,
      description: ev.description ?? '',
    });
  }

  for (const specEvent of spec?.events ?? []) {
    const existing = byName.get(specEvent.name);
    const pascal = toPascalCase(specEvent.name);
    const camel = toCamelCase(specEvent.name);
    byName.set(specEvent.name, {
      name: specEvent.name,
      reactPropName: `on${specEvent.name}`,
      legacyReactPropName: `on${pascal}`,
      angularOutputName: camel,
      vueEmitName: specEvent.name,
      sveltePropName: `on${specEvent.name}`,
      detailType: sanitizeTypeText(specEvent.detailType || existing?.detailType || 'void'),
      cancelable: specEvent.cancelable,
      description: existing?.description ?? '',
    });
  }

  return [...byName.values()];
}

function normalizeSlots(
  decl: ExtendedCemDeclaration,
  spec: ComponentBehaviorSpec | undefined,
): NormalizedSlot[] {
  const byName = new Map<string, NormalizedSlot>();
  for (const slot of decl.slots ?? []) {
    byName.set(slot.name, {
      name: slot.name,
      description: slot.description ?? '',
    });
  }
  for (const slot of spec?.slots ?? []) {
    byName.set(slot.name, {
      name: slot.name,
      description: slot.description,
    });
  }
  return [...byName.values()];
}

function normalizeParts(
  decl: ExtendedCemDeclaration,
  spec: ComponentBehaviorSpec | undefined,
): NormalizedPart[] {
  const byName = new Map<string, NormalizedPart>();
  for (const part of decl.cssParts ?? []) {
    byName.set(part.name, {
      name: part.name,
      description: part.description ?? '',
    });
  }
  for (const part of spec?.parts ?? []) {
    byName.set(part.name, {
      name: part.name,
      description: part.description,
    });
  }
  return [...byName.values()];
}

function normalizeCssProperties(decl: ExtendedCemDeclaration): NormalizedCssProperty[] {
  return (decl.cssProperties ?? []).map((prop) => ({
    name: prop.name,
    description: prop.description ?? '',
    defaultValue: prop.default,
  }));
}

function detectBindableProps(props: ReadonlyArray<NormalizedProp>): BindableControlProp[] {
  const candidates: BindableControlProp[] = ['value', 'checked', 'open'];
  return candidates.filter((candidate) => props.some((prop) => prop.name === candidate));
}

function detectPrimaryModelProp(
  bindableProps: ReadonlyArray<BindableControlProp>,
  formAssociated: boolean,
): BindableControlProp | null {
  if (bindableProps.includes('checked')) return 'checked';
  if (bindableProps.includes('value')) return 'value';
  if (bindableProps.includes('open')) return 'open';
  return formAssociated ? 'value' : null;
}

/**
 * Normalizes a `custom-elements.json` manifest paired with `ComponentBehaviorSpec[]`
 * into deterministic component models consumed by all framework & IDE code generators.
 */
export function normalizeManifest(
  manifest: ExtendedCustomElementsManifest,
  specs: ReadonlyArray<ComponentBehaviorSpec> = [],
): NormalizedComponentModel[] {
  const specByTag = new Map<string, ComponentBehaviorSpec>(
    specs.map((spec) => [spec.tag, spec]),
  );

  const models: NormalizedComponentModel[] = [];

  for (const mod of manifest.modules) {
    for (const decl of mod.declarations ?? []) {
      const tagName = decl.tagName?.toLowerCase();
      if (!tagName) continue;

      const embeddedSpec = (decl as unknown as Record<string, unknown>)['x-methane-spec'];
      const spec =
        specByTag.get(tagName) ??
        (embeddedSpec &&
        typeof embeddedSpec === 'object' &&
        'tag' in embeddedSpec &&
        typeof (embeddedSpec as { tag?: unknown }).tag === 'string'
          ? (embeddedSpec as ComponentBehaviorSpec)
          : undefined);
      const className = decl.name ?? toPascalCase(tagName);
      const props = normalizeProps(decl, spec);
      const events = normalizeEvents(decl, spec);
      const slots = normalizeSlots(decl, spec);
      const parts = normalizeParts(decl, spec);
      const cssProperties = normalizeCssProperties(decl);

      const formAssociated = Boolean(
        decl.formAssociated || spec?.conformance.includes('form-control'),
      );
      const bindableProps = detectBindableProps(props);
      const primaryModelProp = detectPrimaryModelProp(bindableProps, formAssociated);

      const stateSet = new Set<string>(spec?.states ?? []);
      for (const s of decl.cssStates ?? []) {
        stateSet.add(s.name);
      }

      models.push({
        tagName,
        className,
        elementInterfaceName: `${className}Element`,
        modulePath: mod.path,
        description: decl.description ?? '',
        formAssociated,
        primaryModelProp,
        bindableProps,
        props,
        events,
        slots,
        parts,
        cssProperties,
        states: [...stateSet],
      });
    }
  }

  return models.sort((a, b) => a.tagName.localeCompare(b.tagName));
}
