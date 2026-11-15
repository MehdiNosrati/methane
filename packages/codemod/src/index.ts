export { CLI_VERSION, parseCliArgs, runCli, type CliIo, type ParsedCliArgs } from './cli.js';
export { createUnifiedDiff } from './diff.js';
export {
  applyTextEdits,
  createEmptyStats,
  createMutableStats,
  mergeStats,
  type MutableStats,
} from './edits.js';
export {
  compileManifest,
  createPrefixManifest,
  parseMigrationManifest,
  toReactEventPropName,
  validateMigrationManifest,
  type CompiledManifest,
  type ManifestValidationIssue,
} from './manifest.js';
export { DEFAULT_EXTENSIONS, detectLanguage, runCodemod, transformCode } from './runner.js';
export { collectCssDeclarationEdits, collectCssEdits, transformCss } from './transforms/css.js';
export {
  collectHtmlEdits,
  transformHtml,
  type HtmlAttrNode,
  type HtmlElementOpen,
  type HtmlTransformHooks,
} from './transforms/html.js';
export { collectTypeScriptEdits, transformTypeScript } from './transforms/typescript.js';
export type {
  AttributeMigrationRule,
  CodemodRunOptions,
  CodemodRunReport,
  EventMigrationRule,
  FileTransformReport,
  MigrationManifest,
  SlotMigrationRule,
  TagPrefixRewrite,
  TagRenameRule,
  TextEdit,
  TokenPrefixRewrite,
  TokenRenameRule,
  TransformLanguage,
  TransformOptions,
  TransformResult,
  TransformStats,
} from './types.js';
