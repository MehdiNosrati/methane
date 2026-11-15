export interface DemoNode {
  readonly tag: string;
  readonly attrs?: Readonly<Record<string, string | number | boolean>>;
  readonly text?: string;
  readonly children?: ReadonlyArray<DemoNode | string>;
}

export interface DemoSetupContext {
  readonly stage: HTMLElement;
  readonly canvas: HTMLElement;
  readonly target: HTMLElement;
  readonly setReadout: (message: string) => void;
  readonly syncControlValue: (attr: string, value: string | boolean) => void;
}

export interface DemoSpec {
  readonly tree?: DemoNode | ReadonlyArray<DemoNode>;
  readonly attrs?: Readonly<Record<string, string | number | boolean>>;
  readonly style?: string;
  readonly text?: string;
  readonly children?: ReadonlyArray<DemoNode | string>;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly setup?: (ctx: DemoSetupContext) => void | Promise<void>;
}
