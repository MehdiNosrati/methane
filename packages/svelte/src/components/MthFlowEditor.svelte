<script lang="ts">
  import type { MthFlowEditorProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFlowEditorProps = $props();
</script>

<mth-flow-editor {...rest}>
  {@render children?.()}
</mth-flow-editor>
