<script lang="ts">
  import type { MthChatThreadProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthChatThreadProps = $props();
</script>

<mth-chat-thread {...rest}>
  {@render children?.()}
</mth-chat-thread>
