import type {
  CemDeclaration,
  ComponentBehaviorSpec,
  CustomElementsManifest,
} from '@methane/spec-compiler';

export interface CemCssProperty {
  readonly name: string;
  readonly description?: string;
  readonly default?: string;
}

export interface CemCssState {
  readonly name: string;
  readonly description?: string;
}

export interface ExtendedCemAttribute {
  readonly name: string;
  readonly fieldName?: string;
  readonly description?: string;
  readonly default?: string;
  readonly type?: { readonly text: string };
}

export interface ExtendedCemMember {
  readonly kind: string;
  readonly name: string;
  readonly attribute?: string;
  readonly reflect?: boolean;
  readonly description?: string;
  readonly default?: string;
  readonly type?: { readonly text: string };
}

export interface ExtendedCemEvent {
  readonly name: string;
  readonly description?: string;
  readonly type?: { readonly text: string };
}

export interface ExtendedCemDeclaration extends CemDeclaration {
  readonly description?: string;
  readonly customElement?: boolean;
  readonly formAssociated?: boolean;
  readonly attributes?: ReadonlyArray<ExtendedCemAttribute>;
  readonly members?: ReadonlyArray<ExtendedCemMember>;
  readonly events?: ReadonlyArray<ExtendedCemEvent>;
  readonly cssProperties?: ReadonlyArray<CemCssProperty>;
  readonly cssStates?: ReadonlyArray<CemCssState>;
}

export interface ExtendedCustomElementsManifest extends CustomElementsManifest {
  readonly modules: ReadonlyArray<{
    readonly path: string;
    readonly declarations?: ReadonlyArray<ExtendedCemDeclaration>;
  }>;
}

export interface NormalizedProp {
  readonly name: string;
  readonly attr: string | null;
  readonly type: string;
  readonly defaultValue: string | undefined;
  readonly description: string;
  readonly reflect: boolean;
}

export interface NormalizedEvent {
  readonly name: string;
  readonly reactPropName: string;
  readonly legacyReactPropName: string;
  readonly angularOutputName: string;
  readonly vueEmitName: string;
  readonly sveltePropName: string;
  readonly detailType: string;
  readonly cancelable: boolean;
  readonly description: string;
}

export interface NormalizedSlot {
  readonly name: string;
  readonly description: string;
}

export interface NormalizedPart {
  readonly name: string;
  readonly description: string;
}

export interface NormalizedCssProperty {
  readonly name: string;
  readonly description: string;
  readonly defaultValue: string | undefined;
}

export type BindableControlProp = 'value' | 'checked' | 'open';

export interface NormalizedComponentModel {
  readonly tagName: string;
  readonly className: string;
  readonly elementInterfaceName: string;
  readonly modulePath: string;
  readonly description: string;
  readonly formAssociated: boolean;
  readonly primaryModelProp: BindableControlProp | null;
  readonly bindableProps: ReadonlyArray<BindableControlProp>;
  readonly props: ReadonlyArray<NormalizedProp>;
  readonly events: ReadonlyArray<NormalizedEvent>;
  readonly slots: ReadonlyArray<NormalizedSlot>;
  readonly parts: ReadonlyArray<NormalizedPart>;
  readonly cssProperties: ReadonlyArray<NormalizedCssProperty>;
  readonly states: ReadonlyArray<string>;
}

export interface GeneratedFile {
  readonly path: string;
  readonly content: string;
}

export interface CodegenInput {
  readonly manifest: ExtendedCustomElementsManifest;
  readonly specs?: ReadonlyArray<ComponentBehaviorSpec>;
}

export interface CodegenTargetDirs {
  readonly reactDir?: string;
  readonly vueDir?: string;
  readonly angularDir?: string;
  readonly svelteDir?: string;
  readonly ideDir?: string;
}

export interface CodegenOptions extends CodegenTargetDirs {
  readonly write?: boolean;
  readonly packageVersion?: string;
}

export interface CodegenOutput {
  readonly models: ReadonlyArray<NormalizedComponentModel>;
  readonly reactFiles: ReadonlyArray<GeneratedFile>;
  readonly vueFiles: ReadonlyArray<GeneratedFile>;
  readonly angularFiles: ReadonlyArray<GeneratedFile>;
  readonly svelteFiles: ReadonlyArray<GeneratedFile>;
  readonly ideFiles: ReadonlyArray<GeneratedFile>;
  readonly writtenPaths: ReadonlyArray<string>;
}
