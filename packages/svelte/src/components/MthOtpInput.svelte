<script lang="ts">
  import type { MthOtpInputProps } from '../index.js';

  let {
  value = $bindable(""),
  children,
  ...rest
  }: MthOtpInputProps = $props();
</script>

<mth-otp-input value={value} {...rest} oninput={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["oninput"]?.(e); }} onchange={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["onchange"]?.(e); }} onmth-input={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-input"]?.(e); }} onmth-change={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-change"]?.(e); }} onmth-select={(e: Event) => { const nextValue = (e as CustomEvent<{ value?: typeof value } | undefined>).detail?.value ?? (e.currentTarget as HTMLElement & { value?: typeof value }).value; if (nextValue !== undefined) value = nextValue; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-select"]?.(e); }}>
  {@render children?.()}
</mth-otp-input>
