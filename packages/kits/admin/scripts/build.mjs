import '@lit-labs/ssr-dom-shim';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '..');
const srcComponentsDir = resolve(pkgRoot, 'src/components');
const distDir = resolve(pkgRoot, 'dist');
const distComponentsDir = resolve(distDir, 'components');

function toPascalCase(tag) {
  return tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function formatDefaultLiteral(value) {
  if (value === undefined) return undefined;
  return JSON.stringify(value);
}

function discoverComponents() {
  if (!existsSync(srcComponentsDir)) return [];
  return readdirSync(srcComponentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      const hasIndex = existsSync(resolve(srcComponentsDir, name, 'index.ts'));
      const hasSpec = existsSync(resolve(srcComponentsDir, name, `${name}.spec.ts`));
      return hasIndex && hasSpec;
    })
    .sort((a, b) => a.localeCompare(b));
}

async function main() {
  const components = discoverComponents();
  mkdirSync(distDir, { recursive: true });

  const jsExports = [];
  const dtsExports = [];
  const registerTags = [];
  const cemModules = [];
  const specs = [];
  const seenBarrelExports = new Map();

  for (const dirName of components) {
    const specModUrl = pathToFileURL(resolve(distComponentsDir, dirName, `${dirName}.spec.js`)).href;
    const elemModUrl = pathToFileURL(resolve(distComponentsDir, dirName, 'element.js')).href;

    const specMod = await import(specModUrl);
    const elemMod = await import(elemModUrl);

    for (const exportName of Object.keys(elemMod)) {
      if (exportName === 'CEM_METADATA') {
        throw new Error(
          `Conflicting barrel export '${exportName}' in ${dirName}/element.ts; keep CEM_METADATA scoped to ${dirName}.spec.ts.`,
        );
      }
      const existingOwner = seenBarrelExports.get(exportName);
      if (existingOwner) {
        throw new Error(
          `Conflicting barrel export '${exportName}' in ${dirName}/element.ts (already exported by ${existingOwner}/element.ts).`,
        );
      }
      seenBarrelExports.set(exportName, dirName);
    }

    const spec = Object.values(specMod).find(
      (v) => v && typeof v === 'object' && 'tag' in v && 'conformance' in v,
    );
    if (!spec) {
      throw new Error(`No ComponentBehaviorSpec export found in ${dirName}/${dirName}.spec.ts`);
    }

    const className = toPascalCase(spec.tag);
    const ElementCtor = elemMod[className];
    if (!ElementCtor) {
      throw new Error(`Expected class ${className} exported from ${dirName}/element.ts`);
    }

    const meta =
      typeof specMod.CEM_METADATA === 'object' && specMod.CEM_METADATA !== null
        ? specMod.CEM_METADATA
        : {};

    const elemProps =
      ElementCtor.elementProperties instanceof Map ? ElementCtor.elementProperties : new Map();

    const members = [];
    const attributes = [];

    for (const prop of spec.props) {
      const propMeta = elemProps.get(prop.name);
      const attrName =
        prop.attr === false
          ? undefined
          : typeof prop.attr === 'string'
            ? prop.attr
            : prop.name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      const reflect = Boolean(propMeta?.reflect);
      const description = meta.propDescriptions?.[prop.name] ?? `${prop.name} property.`;
      const defaultLiteral = formatDefaultLiteral(prop.default);

      members.push({
        kind: 'field',
        name: prop.name,
        ...(attrName ? { attribute: attrName } : {}),
        ...(reflect ? { reflect: true } : {}),
        type: { text: prop.type },
        ...(defaultLiteral !== undefined ? { default: defaultLiteral } : {}),
        description,
      });

      if (attrName) {
        attributes.push({
          name: attrName,
          fieldName: prop.name,
          type: { text: prop.type },
          ...(defaultLiteral !== undefined ? { default: defaultLiteral } : {}),
          description,
        });
      }
    }

    const declaration = {
      kind: 'class',
      name: className,
      tagName: spec.tag,
      customElement: true,
      ...(ElementCtor.formAssociated ? { formAssociated: true } : {}),
      ...(spec.role ? { role: spec.role } : {}),
      ...(spec.focusModel === 'delegates-focus' ? { delegatesFocus: true } : {}),
      description: meta.description ?? `Methane ${className} custom element (<${spec.tag}>).`,
      superclass: {
        name: 'UIElement',
        package: '@methane-ui/core',
      },
      members,
      attributes,
      events: spec.events.map((ev) => ({
        name: ev.name,
        type: {
          text: ev.detailType.startsWith('CustomEvent<')
            ? ev.detailType
            : `CustomEvent<${ev.detailType}>`,
        },
        description: meta.eventDescriptions?.[ev.name] ?? `Emitted event ${ev.name}.`,
      })),
      slots: spec.slots.map((slot) => ({
        name: slot.name,
        description: slot.description,
      })),
      cssParts: spec.parts.map((part) => ({
        name: part.name,
        description: part.description,
      })),
      cssProperties: Array.isArray(meta.cssProperties) ? meta.cssProperties : [],
      cssStates: spec.states.map((state) => ({
        name: state,
        description: `Custom element state :state(${state}).`,
      })),
      'x-methane-spec': spec,
    };

    cemModules.push({
      kind: 'javascript-module',
      path: `src/components/${dirName}/${dirName}.ts`,
      declarations: [declaration],
      exports: [
        {
          kind: 'js',
          name: className,
          declaration: {
            name: className,
            module: `src/components/${dirName}/${dirName}.ts`,
          },
        },
        {
          kind: 'custom-element-definition',
          name: spec.tag,
          declaration: {
            name: className,
            module: `src/components/${dirName}/${dirName}.ts`,
          },
        },
      ],
    });

    specs.push(spec);
    registerTags.push([spec.tag, className, dirName]);
    jsExports.push(`export * from './components/${dirName}/index.js';`);
    dtsExports.push(`export * from './components/${dirName}/index.js';`);
  }

  const runtimeImports = registerTags
    .map(
      ([, className, dirName]) =>
        `import { ${className} } from './components/${dirName}/element.js';`,
    )
    .join('\n');
  const registryMapEntries = registerTags
    .map(([tag, className]) => `      '${tag}': ${className},`)
    .join('\n');

  const barrelJs = [
    "import { getRuntime } from '@methane-ui/core';",
    runtimeImports,
    '',
    ...jsExports,
    '',
    'export function registerAllComponents(prefix = "mth") {',
    '  return getRuntime().registry.defineComponents({',
    '    prefix,',
    '    components: {',
    registryMapEntries,
    '    },',
    '  });',
    '}',
    '',
  ].join('\n');

  const barrelDts = [
    ...dtsExports,
    'export declare function registerAllComponents(prefix?: string): ReadonlyArray<string>;',
    '',
  ].join('\n');

  writeFileSync(resolve(distDir, 'index.js'), barrelJs, 'utf8');
  writeFileSync(resolve(distDir, 'index.d.ts'), barrelDts, 'utf8');
  writeFileSync(resolve(distDir, 'specs.json'), JSON.stringify(specs, null, 2) + '\n', 'utf8');

  const cem = {
    schemaVersion: '1.0.0',
    readme: '',
    modules: cemModules,
  };
  writeFileSync(resolve(pkgRoot, 'custom-elements.json'), JSON.stringify(cem, null, 2) + '\n', 'utf8');
}

await main();
