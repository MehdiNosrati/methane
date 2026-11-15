import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import {
  normalizeManifest,
  toCamelCase,
  toPascalCase,
  type NormalizedComponentModel,
  type NormalizedProp,
} from '@methane-ui/wrapper-codegen';
import type {
  CodeConnectFramework,
  CodeConnectInput,
  CodeConnectOptions,
  GeneratedCodeConnectFile,
} from './types.js';

const DEFAULT_FIGMA_FILE_URL = 'https://www.figma.com/design/METHANE_UI_KIT/Methane-Components';
const ALL_FRAMEWORKS: ReadonlyArray<CodeConnectFramework> = [
  'react',
  'vue',
  'angular',
  'svelte',
  'html',
];

function extractEnumOptions(prop: NormalizedProp): string[] | null {
  const literals: string[] = [];
  for (const branch of prop.type.split('|')) {
    const match = /^(['"])(.*)\1$/.exec(branch.trim());
    if (match) {
      literals.push(match[2]!);
    }
  }
  return literals.length >= 2 ? literals : null;
}

function unquoteDefaultValue(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return typeof parsed === 'string' ? parsed : String(parsed);
      } catch {
        return trimmed.slice(1, -1);
      }
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function escapeHtmlAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function buildFigmaPropMappings(model: NormalizedComponentModel): string[] {
  const lines: string[] = [];
  const props = [...model.props].sort((a, b) => a.name.localeCompare(b.name));

  for (const prop of props) {
    const label = toPascalCase(prop.name);
    const enumOptions = extractEnumOptions(prop);
    if (enumOptions) {
      const mapping = enumOptions
        .map((opt) => `'${opt.length === 0 ? 'Empty' : toPascalCase(opt)}': '${opt}'`)
        .join(', ');
      lines.push(`    ${prop.name}: figma.enum('${label}', { ${mapping} }),`);
    } else if (prop.type === 'boolean') {
      lines.push(`    ${prop.name}: figma.boolean('${label}'),`);
    } else if (prop.type === 'string') {
      lines.push(`    ${prop.name}: figma.string('${label}'),`);
    }
  }

  const slots = [...model.slots].sort((a, b) => a.name.localeCompare(b.name));
  for (const slot of slots) {
    if (slot.name === '') {
      lines.push(`    children: figma.children('*'),`);
    } else {
      lines.push(`    ${toCamelCase(slot.name)}Slot: figma.slot('${slot.name}'),`);
    }
  }

  return lines;
}

function renderReactCodeConnect(
  model: NormalizedComponentModel,
  figmaUrl: string,
): string {
  const propMappings = buildFigmaPropMappings(model);
  const sampleAttrs = model.props
    .slice(0, 3)
    .map((p) => (p.type === 'boolean' ? `${p.name}={props.${p.name}}` : `${p.name}={props.${p.name}}`))
    .join(' ');
  const attrsPart = sampleAttrs ? ` ${sampleAttrs}` : '';
  const hasDefaultSlot = model.slots.some((s) => s.name === '');
  const childrenPart = hasDefaultSlot ? '{props.children}' : '';

  return [
    `import figma from '@figma/code-connect';`,
    `import '@methane-ui/react';`,
    '',
    `export default figma.connect('${figmaUrl}', {`,
    `  props: {`,
    ...propMappings,
    `  },`,
    `  example: (props) => (`,
    `    <${model.tagName}${attrsPart}>${childrenPart}</${model.tagName}>`,
    `  ),`,
    `});`,
    '',
  ].join('\n');
}

function renderVueCodeConnect(
  model: NormalizedComponentModel,
  figmaUrl: string,
): string {
  const propMappings = buildFigmaPropMappings(model);
  const sampleAttrs = model.props
    .slice(0, 3)
    .map((p) => `:${p.name}="${p.name}"`)
    .join(' ');
  const attrsPart = sampleAttrs ? ` ${sampleAttrs}` : '';

  return [
    `import figma, { html } from '@figma/code-connect/html';`,
    `import '@methane-ui/vue';`,
    '',
    `export default figma.connect('${figmaUrl}', {`,
    `  props: {`,
    ...propMappings,
    `  },`,
    `  example: (props) => html\``,
    `    <${model.tagName}${attrsPart}>\${props.children ?? ''}</${model.tagName}>`,
    `  \`,`,
    `});`,
    '',
  ].join('\n');
}

function renderAngularCodeConnect(
  model: NormalizedComponentModel,
  figmaUrl: string,
): string {
  const propMappings = buildFigmaPropMappings(model);
  const sampleAttrs = model.props
    .slice(0, 3)
    .map((p) => `[${p.name}]="${p.name}"`)
    .join(' ');
  const attrsPart = sampleAttrs ? ` ${sampleAttrs}` : '';

  return [
    `import figma, { html } from '@figma/code-connect/html';`,
    `import { ${model.className}Directive } from '@methane-ui/angular';`,
    '',
    `export default figma.connect('${figmaUrl}', {`,
    `  imports: ['${model.className}Directive'],`,
    `  props: {`,
    ...propMappings,
    `  },`,
    `  example: (props) => html\``,
    `    <${model.tagName}${attrsPart}>\${props.children ?? ''}</${model.tagName}>`,
    `  \`,`,
    `});`,
    '',
  ].join('\n');
}

function renderSvelteCodeConnect(
  model: NormalizedComponentModel,
  figmaUrl: string,
): string {
  const propMappings = buildFigmaPropMappings(model);
  const sampleAttrs = model.props
    .slice(0, 3)
    .map((p) => `${p.name}={props.${p.name}}`)
    .join(' ');
  const attrsPart = sampleAttrs ? ` ${sampleAttrs}` : '';

  return [
    `import figma, { html } from '@figma/code-connect/html';`,
    `import { ${model.className} } from '@methane-ui/svelte';`,
    '',
    `export default figma.connect('${figmaUrl}', {`,
    `  props: {`,
    ...propMappings,
    `  },`,
    `  example: (props) => html\``,
    `    <${model.tagName}${attrsPart}>\${props.children ?? ''}</${model.tagName}>`,
    `  \`,`,
    `});`,
    '',
  ].join('\n');
}

function renderHtmlCodeConnect(
  model: NormalizedComponentModel,
  spec: ComponentBehaviorSpec | undefined,
  figmaUrl: string,
): string {
  const attrs = model.props
    .filter((p) => p.attr !== null)
    .flatMap((p) => {
      if (p.type === 'boolean') {
        return p.defaultValue === 'true' ? [p.attr!] : [];
      }
      const enumOpts = extractEnumOptions(p);
      const enumVal = enumOpts ? (enumOpts.find((o) => o.length > 0) ?? enumOpts[0]) : undefined;
      const defaultVal = unquoteDefaultValue(p.defaultValue);
      const val =
        enumVal !== undefined && enumVal.length > 0
          ? enumVal
          : defaultVal !== undefined && defaultVal.length > 0
            ? defaultVal
            : undefined;
      if (val === undefined) return [];
      return [`${p.attr!}="${escapeHtmlAttr(val)}"`];
    })
    .slice(0, 4);
  const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
  const slots = model.slots
    .filter((s) => s.name !== '')
    .map((s) => `  <span slot="${s.name}">${s.description}</span>`);
  const body = slots.length > 0 ? `\n${slots.join('\n')}\n` : model.description;
  const roleComment = spec?.role ? ` role="${spec.role}"` : '';

  return [
    `<!-- Figma Code Connect: ${figmaUrl} -->`,
    `<${model.tagName}${attrStr}${roleComment}>${body}</${model.tagName}>`,
    '',
  ].join('\n');
}

export function generateCodeConnectFiles(
  input: CodeConnectInput,
  options: CodeConnectOptions = {},
): ReadonlyArray<GeneratedCodeConnectFile> {
  const models = [...normalizeManifest(input.manifest, input.specs)].sort((a, b) =>
    a.tagName.localeCompare(b.tagName),
  );
  const specMap = new Map<string, ComponentBehaviorSpec>(
    (input.specs ?? []).map((spec) => [spec.tag, spec]),
  );
  const frameworks = options.frameworks ?? ALL_FRAMEWORKS;
  const baseUrl = options.figmaFileUrl ?? DEFAULT_FIGMA_FILE_URL;

  const files: GeneratedCodeConnectFile[] = [];

  for (const model of models) {
    const nodeId = options.nodeIds?.[model.tagName] ?? `node-${model.tagName}`;
    const figmaUrl = `${baseUrl}?node-id=${encodeURIComponent(nodeId)}`;
    const spec = specMap.get(model.tagName);

    for (const framework of frameworks) {
      if (framework === 'html') {
        files.push({
          path: `code-connect/html/${model.tagName}.figma.html`,
          tagName: model.tagName,
          framework,
          content: renderHtmlCodeConnect(model, spec, figmaUrl),
        });
      } else if (framework === 'react') {
        files.push({
          path: `code-connect/react/${model.tagName}.figma.ts`,
          tagName: model.tagName,
          framework,
          content: renderReactCodeConnect(model, figmaUrl),
        });
      } else if (framework === 'vue') {
        files.push({
          path: `code-connect/vue/${model.tagName}.figma.ts`,
          tagName: model.tagName,
          framework,
          content: renderVueCodeConnect(model, figmaUrl),
        });
      } else if (framework === 'angular') {
        files.push({
          path: `code-connect/angular/${model.tagName}.figma.ts`,
          tagName: model.tagName,
          framework,
          content: renderAngularCodeConnect(model, figmaUrl),
        });
      } else if (framework === 'svelte') {
        files.push({
          path: `code-connect/svelte/${model.tagName}.figma.ts`,
          tagName: model.tagName,
          framework,
          content: renderSvelteCodeConnect(model, figmaUrl),
        });
      }
    }
  }

  return files;
}
