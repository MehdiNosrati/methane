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

function sanitizeTypeText(raw: string | undefined): string {
  const text = raw?.trim();
  if (!text) return 'unknown';
  return text;
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
    return customMatch[1].trim();
  }
  return rawEventType.trim();
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
      defaultValue: member.default,
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
        defaultValue: attr.default,
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
      detailType: specEvent.detailType || existing?.detailType || 'void',
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

      const spec = specByTag.get(tagName);
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
