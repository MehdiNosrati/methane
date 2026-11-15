export { generateAllWrappers } from './codegen.js';
export { DEFAULT_BEHAVIOR_SPECS, DEFAULT_CEM_FIXTURE } from './fixture.js';
export { generateAngularFiles } from './generators/angular.js';
export { generateIdeFiles } from './generators/ide.js';
export { generateReactFiles } from './generators/react.js';
export { generateSvelteFiles } from './generators/svelte.js';
export { generateVueFiles } from './generators/vue.js';
export {
  normalizeManifest,
  sanitizeTypeText,
  toCamelCase,
  toPascalCase,
} from './normalize.js';
export {
  PRIMITIVES_UTILITY_MANIFEST,
  PRIMITIVES_UTILITY_SPECS,
  hasWorkspaceManifests,
  loadWorkspaceManifestAndSpecs,
} from './workspace.js';
export type {
  BindableControlProp,
  CemCssProperty,
  CemCssState,
  CodegenInput,
  CodegenOptions,
  CodegenOutput,
  CodegenTargetDirs,
  ExtendedCemAttribute,
  ExtendedCemDeclaration,
  ExtendedCemEvent,
  ExtendedCemMember,
  ExtendedCustomElementsManifest,
  GeneratedFile,
  NormalizedComponentModel,
  NormalizedCssProperty,
  NormalizedEvent,
  NormalizedPart,
  NormalizedProp,
  NormalizedSlot,
} from './types.js';
