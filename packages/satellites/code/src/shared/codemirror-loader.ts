import type {
  defaultKeymap as cmDefaultKeymap,
  history as cmHistory,
  historyKeymap as cmHistoryKeymap,
  indentWithTab as cmIndentWithTab,
} from '@codemirror/commands';
import type { Compartment, EditorState } from '@codemirror/state';
import type { EditorView, keymap as cmKeymap } from '@codemirror/view';

export interface LoadedCodeMirror {
  readonly defaultKeymap: typeof cmDefaultKeymap;
  readonly history: typeof cmHistory;
  readonly historyKeymap: typeof cmHistoryKeymap;
  readonly indentWithTab: typeof cmIndentWithTab;
  readonly Compartment: typeof Compartment;
  readonly EditorState: typeof EditorState;
  readonly EditorView: typeof EditorView;
  readonly keymap: typeof cmKeymap;
}

let cmModulesCache: LoadedCodeMirror | null = null;
let cmModulesPromise: Promise<LoadedCodeMirror> | null = null;

/**
 * Guards heavy browser engine imports so pure-Node SSR renders never evaluate DOM-coupled packages.
 */
export function isBrowserDom(): boolean {
  return typeof document !== 'undefined' && Boolean(document.documentElement?.style);
}

/**
 * Lazily loads and caches CodeMirror 6 modules for client-side editors.
 */
export function loadCodeMirrorModules(): Promise<LoadedCodeMirror> {
  if (cmModulesCache) {
    return Promise.resolve(cmModulesCache);
  }
  if (!cmModulesPromise) {
    cmModulesPromise = Promise.all([
      import('@codemirror/commands'),
      import('@codemirror/state'),
      import('@codemirror/view'),
    ]).then(([commands, state, view]) => {
      const loaded: LoadedCodeMirror = {
        defaultKeymap: commands.defaultKeymap,
        history: commands.history,
        historyKeymap: commands.historyKeymap,
        indentWithTab: commands.indentWithTab,
        Compartment: state.Compartment,
        EditorState: state.EditorState,
        EditorView: view.EditorView,
        keymap: view.keymap,
      };
      cmModulesCache = loaded;
      return loaded;
    });
  }
  return cmModulesPromise;
}
