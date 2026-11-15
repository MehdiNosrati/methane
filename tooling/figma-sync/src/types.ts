import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import type { DtcgDocument } from '@methane/tokens';
import type { ExtendedCustomElementsManifest } from '@methane/wrapper-codegen';

export type FigmaVariableResolvedType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

export interface FigmaColorValue {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface FigmaVariableAlias {
  readonly type: 'VARIABLE_ALIAS';
  readonly id: string;
}

export type FigmaVariableValue =
  | FigmaColorValue
  | FigmaVariableAlias
  | number
  | string
  | boolean;

export interface FigmaMode {
  readonly modeId: string;
  readonly name: string;
}

export interface FigmaVariableCollection {
  readonly id: string;
  readonly name: string;
  readonly defaultModeId: string;
  readonly modes: ReadonlyArray<FigmaMode>;
  readonly variableIds: ReadonlyArray<string>;
}

export interface FigmaVariable {
  readonly id: string;
  readonly name: string;
  readonly variableCollectionId: string;
  readonly resolvedType: FigmaVariableResolvedType;
  readonly valuesByMode: Readonly<Record<string, FigmaVariableValue>>;
  readonly description?: string;
  readonly scopes?: ReadonlyArray<string>;
  readonly codeSyntax?: {
    readonly WEB?: string;
    readonly ANDROID?: string;
    readonly iOS?: string;
  };
}

export interface FigmaVariablesPayload {
  readonly version: number;
  readonly meta: {
    readonly variableCollections: Readonly<Record<string, FigmaVariableCollection>>;
    readonly variables: Readonly<Record<string, FigmaVariable>>;
  };
}

export interface DtcgToFigmaOptions {
  /** Base font size in px used when converting rem dimensions to Figma FLOAT pixels. Defaults to 16. */
  readonly remBasePx?: number;
}

export interface FigmaToDtcgOptions {
  /** Base font size in px used when converting pixel floats back to rem for typography/space. Defaults to 16. */
  readonly remBasePx?: number;
  /** Optional base DTCG document to preserve original token `$type` / formatting hints when round-tripping. */
  readonly baseDocument?: DtcgDocument;
}

export type CodeConnectFramework = 'react' | 'vue' | 'angular' | 'svelte' | 'html';

export interface CodeConnectOptions {
  readonly figmaFileUrl?: string;
  readonly nodeIds?: Readonly<Record<string, string>>;
  readonly frameworks?: ReadonlyArray<CodeConnectFramework>;
}

export interface CodeConnectInput {
  readonly manifest: ExtendedCustomElementsManifest;
  readonly specs?: ReadonlyArray<ComponentBehaviorSpec>;
}

export interface GeneratedCodeConnectFile {
  readonly path: string;
  readonly tagName: string;
  readonly framework: CodeConnectFramework;
  readonly content: string;
}
