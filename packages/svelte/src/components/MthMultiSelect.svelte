<script lang="ts">
  import type { MthMultiSelectProps } from '../index.js';

  let {
  value = $bindable(""),
  open = $bindable(false),
  children,
  ...rest
  }: MthMultiSelectProps = $props();
</script>

<mth-multi-select value={value} open={open} {...rest} oninput={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["oninput"]?.(e); }} onchange={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["onchange"]?.(e); }} onmth-input={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-input"]?.(e); }} onmth-change={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-change"]?.(e); }} onmth-select={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-select"]?.(e); }} onmth-open={(e: Event) => { open = true; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-open"]?.(e); }} onmth-close={(e: Event) => { open = false; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-close"]?.(e); }}>
  {@render children?.()}
</mth-multi-select>
