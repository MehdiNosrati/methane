<script lang="ts">
  import type { MthSettingsShellProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSettingsShellProps = $props();
</script>

<mth-settings-shell {...rest}>
  {@render children?.()}
</mth-settings-shell>
