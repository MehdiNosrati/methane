<script lang="ts">
  import type { MthPasskeyPromptProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthPasskeyPromptProps = $props();
</script>

<mth-passkey-prompt {...rest}>
  {@render children?.()}
</mth-passkey-prompt>
