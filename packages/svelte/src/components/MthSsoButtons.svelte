<script lang="ts">
  import type { MthSsoButtonsProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSsoButtonsProps = $props();
</script>

<mth-sso-buttons {...rest}>
  {@render children?.()}
</mth-sso-buttons>
