export interface TagPrefixRewrite {
  readonly fromPrefix: string;
  readonly toPrefix: string;
  readonly tags?: ReadonlyArray<string>;
}

export interface TagRenameRule {
  readonly from: string;
  readonly to: string;
}

export interface TokenPrefixRewrite {
  readonly fromPrefix: string;
  readonly toPrefix: string;
}

export interface TokenRenameRule {
  readonly from: string;
  readonly to: string;
}

export interface AttributeMigrationRule {
  readonly tag?: string | ReadonlyArray<string>;
  readonly from: string;
  readonly to?: string;
  readonly valueMap?: Readonly<Record<string, string>>;
  readonly remove?: boolean;
}

export interface SlotMigrationRule {
  readonly tag?: string | ReadonlyArray<string>;
  readonly from: string;
  readonly to: string;
}

export interface EventMigrationRule {
  readonly tag?: string | ReadonlyArray<string>;
  readonly from: string;
  readonly to: string;
}

export interface MigrationManifest {
  readonly version: string;
  readonly name?: string;
  readonly description?: string;
  readonly tagPrefix?: TagPrefixRewrite;
  readonly tagRenames?: ReadonlyArray<TagRenameRule>;
  readonly tokenPrefix?: TokenPrefixRewrite;
  readonly tokenRenames?: ReadonlyArray<TokenRenameRule>;
  readonly attributes?: ReadonlyArray<AttributeMigrationRule>;
  readonly slots?: ReadonlyArray<SlotMigrationRule>;
  readonly events?: ReadonlyArray<EventMigrationRule>;
}

export interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly replacement: string;
}

export type TransformLanguage = 'typescript' | 'html' | 'css';

export interface TransformStats {
  readonly tagRewrites: number;
  readonly tokenRenames: number;
  readonly attributeMigrations: number;
  readonly slotMigrations: number;
  readonly eventMigrations: number;
}

export interface TransformResult {
  readonly code: string;
  readonly changed: boolean;
  readonly editsCount: number;
  readonly stats: TransformStats;
  readonly diff?: string;
}

export interface TransformOptions {
  readonly filePath?: string;
  readonly language?: TransformLanguage;
  readonly includeDiff?: boolean;
}

export interface FileTransformReport {
  readonly filePath: string;
  readonly language: TransformLanguage;
  readonly changed: boolean;
  readonly editsCount: number;
  readonly stats: TransformStats;
  readonly diff: string;
}

export interface CodemodRunOptions {
  readonly targets: ReadonlyArray<string>;
  readonly manifest: MigrationManifest;
  readonly dryRun?: boolean;
  readonly cwd?: string;
  readonly extensions?: ReadonlyArray<string>;
}

export interface CodemodRunReport {
  readonly dryRun: boolean;
  readonly totalFiles: number;
  readonly changedFiles: number;
  readonly totalEdits: number;
  readonly files: ReadonlyArray<FileTransformReport>;
  readonly stats: TransformStats;
}
