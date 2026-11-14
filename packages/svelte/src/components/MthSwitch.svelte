<script lang="ts">
  import type { MthSwitchProps } from '../index.js';

  let {
  checked = $bindable(false),
  children,
  ...rest
  }: MthSwitchProps = $props();
</script>

<mth-switch checked={checked} {...rest} onchange={(e: Event) => { const nextChecked = (e as CustomEvent<{ checked?: boolean } | undefined>).detail?.checked ?? (e.currentTarget as HTMLElement & { checked?: boolean }).checked; if (typeof nextChecked === "boolean") checked = nextChecked; (rest as Record<string, ((ev: Event) => void) | undefined>)["onchange"]?.(e); }} onmth-change={(e: Event) => { const nextChecked = (e as CustomEvent<{ checked?: boolean } | undefined>).detail?.checked ?? (e.currentTarget as HTMLElement & { checked?: boolean }).checked; if (typeof nextChecked === "boolean") checked = nextChecked; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-change"]?.(e); }} onmth-input={(e: Event) => { const nextChecked = (e as CustomEvent<{ checked?: boolean } | undefined>).detail?.checked ?? (e.currentTarget as HTMLElement & { checked?: boolean }).checked; if (typeof nextChecked === "boolean") checked = nextChecked; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-input"]?.(e); }}>
  {@render children?.()}
</mth-switch>
