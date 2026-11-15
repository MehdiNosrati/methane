<script lang="ts">
  import type { MthMenuItemProps } from '../index.js';

  let {
  value = $bindable(""),
  checked = $bindable(false),
  children,
  ...rest
  }: MthMenuItemProps = $props();
</script>

<mth-menu-item value={value} checked={checked} {...rest} oninput={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["oninput"]?.(e); }} onchange={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; const nextChecked = (e as CustomEvent<{ checked?: boolean } | undefined>).detail?.checked ?? (e.currentTarget as HTMLElement & { checked?: boolean }).checked; if (typeof nextChecked === "boolean") checked = nextChecked; (rest as Record<string, ((ev: Event) => void) | undefined>)["onchange"]?.(e); }} onmth-input={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; const nextChecked = (e as CustomEvent<{ checked?: boolean } | undefined>).detail?.checked ?? (e.currentTarget as HTMLElement & { checked?: boolean }).checked; if (typeof nextChecked === "boolean") checked = nextChecked; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-input"]?.(e); }} onmth-change={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; const nextChecked = (e as CustomEvent<{ checked?: boolean } | undefined>).detail?.checked ?? (e.currentTarget as HTMLElement & { checked?: boolean }).checked; if (typeof nextChecked === "boolean") checked = nextChecked; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-change"]?.(e); }} onmth-select={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-select"]?.(e); }}>
  {@render children?.()}
</mth-menu-item>
