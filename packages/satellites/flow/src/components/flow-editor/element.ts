import { defineComponents } from '@methane-ui/core';
import { MthFlowEditor } from './flow-editor.js';

export {
  MthFlowEditor,
  type FlowDirection,
  type FlowEdge,
  type FlowEdgeStyle,
  type FlowEditorEngine,
  type FlowNode,
  type PositionedFlowNode,
  type RoutedFlowEdge,
} from './flow-editor.js';

export function registerMthFlowEditor(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-flow-editor': MthFlowEditor,
    },
  });
}

registerMthFlowEditor();
