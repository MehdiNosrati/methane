import type { RenderInfo } from '@lit-labs/ssr';
import type { ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';

export type SsrStyleMode = 'linked' | 'inline';

export interface StylesheetLink {
  readonly tagName: string;
  readonly href: string;
  readonly hash: string;
  readonly css: string;
  readonly criticalCss: string;
}

export interface CollectedStylesheetLink {
  readonly tagName: string;
  readonly href: string;
  readonly hash: string | null;
  readonly rel: string;
}

export type CriticalCssResolver = (tagName: string, fullCss: string) => string;

export interface MethaneSsrOptions {
  /**
   * ADR-008 style delivery mode:
   * - `'linked'` (default): injects `<link rel="stylesheet" href="${assetBase}/${tag}.${hash}.css">`
   *   plus a `< 1 KB` critical layout `<style>` shell inside `<template shadowrootmode="open">`.
   * - `'inline'`: embeds the full component CSS inside `<style>` for email, single-file exports, and edge.
   */
  readonly styles?: SsrStyleMode;
  /** Base path or CDN URL for content-hashed component CSS assets. Defaults to `'/_methane/styles'`. */
  readonly assetBase?: string;
  /** Optional custom critical CSS string or extractor (capped below 1024 UTF-8 bytes). */
  readonly criticalCss?: string | CriticalCssResolver;
  /** Content hash hex length in asset filenames. Defaults to `8`. */
  readonly hashLength?: number;
  /** Whether to add `defer-hydration` to top-level custom elements. Defaults to `false`. */
  readonly deferHydration?: boolean;
  /** Optional callback invoked whenever a stylesheet link is emitted during rendering. */
  readonly onStylesheetLink?: (link: StylesheetLink) => void;
  /** Additional custom `@lit-labs/ssr` `ElementRendererConstructor` implementations. */
  readonly elementRenderers?: ReadonlyArray<ElementRendererConstructor>;
}

export interface SsrRenderResult {
  readonly html: string;
  readonly links: ReadonlyArray<StylesheetLink>;
  readonly criticalBytesByTag: Readonly<Record<string, number>>;
}

export interface HoistStylesheetLinksOptions {
  /**
   * How hoisted `<link>` elements are added to `<head>`:
   * - `'preload'` (default): adds `<link rel="preload" as="style" href="...">` to `<head>`
   *   while keeping `<link rel="stylesheet" href="...">` inside each shadow root so Shadow DOM styling works.
   * - `'stylesheet'`: adds `<link rel="stylesheet" href="...">` to `<head>`.
   */
  readonly headMode?: 'preload' | 'stylesheet';
  /** Remove `<link rel="stylesheet">` from shadow templates when hoisting (only useful if non-shadow global CSS). Defaults to `false`. */
  readonly stripShadowLinks?: boolean;
  /** Optional nonce attribute added to injected `<head>` links for strict CSP. */
  readonly nonce?: string;
}

export interface CreateSsrTransformOptions extends HoistStylesheetLinksOptions {
  /** Optional client hydration script module URL injected before `</body>`. */
  readonly hydrationModuleUrl?: string;
}

export interface ResolvedMethaneSsrOptions {
  readonly styles: SsrStyleMode;
  readonly assetBase: string;
  readonly criticalCss: string | CriticalCssResolver | undefined;
  readonly hashLength: number;
  readonly deferHydration: boolean;
  readonly onStylesheetLink: ((link: StylesheetLink) => void) | undefined;
}

export interface MethaneRenderContext {
  readonly options: ResolvedMethaneSsrOptions;
  readonly linksByHref: Map<string, StylesheetLink>;
  readonly criticalBytesByTag: Record<string, number>;
}

export interface MethaneRenderInfo extends RenderInfo {
  readonly methaneSsr?: MethaneRenderContext;
}
