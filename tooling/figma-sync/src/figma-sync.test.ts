import { compileDtcgTokens, dtcgSource } from '@methane/tokens';
import { DEFAULT_BEHAVIOR_SPECS, DEFAULT_CEM_FIXTURE } from '@methane/wrapper-codegen';
import { describe, expect, it } from 'vitest';
import {
  dtcgToFigmaVariables,
  figmaRgbaToOklchString,
  figmaVariablesToDtcg,
  generateCodeConnectFiles,
  oklchToFigmaRgba,
  parseOklchColor,
} from './index.js';

describe('@methane/figma-sync two-way Figma Variables <-> W3C DTCG sync', () => {
  it('converts OKLCH colors to Figma sRGB RGBA and back accurately', () => {
    const inGamut = parseOklchColor('oklch(0.62 0.14 255)');
    expect(inGamut).not.toBeNull();
    const rgba = oklchToFigmaRgba(inGamut!);
    expect(rgba.r).toBeGreaterThanOrEqual(0);
    expect(rgba.r).toBeLessThanOrEqual(1);
    expect(rgba.b).toBeGreaterThan(rgba.r);
    expect(rgba.a).toBe(1);

    const roundTripped = figmaRgbaToOklchString(rgba);
    const reParsed = parseOklchColor(roundTripped);
    expect(reParsed).not.toBeNull();
    expect(reParsed!.l).toBeCloseTo(0.62, 2);
    expect(reParsed!.c).toBeCloseTo(0.14, 2);
    expect(reParsed!.h).toBeCloseTo(255, 0);

    // Out-of-gamut colors clamp safely into [0, 1] sRGB
    const wideGamut = parseOklchColor('oklch(0.56 0.21 255)');
    const clampedRgba = oklchToFigmaRgba(wideGamut!);
    expect(clampedRgba.r).toBeGreaterThanOrEqual(0);
    expect(clampedRgba.g).toBeGreaterThanOrEqual(0);
    expect(clampedRgba.b).toBeLessThanOrEqual(1);
  });

  it('exports @methane/tokens DTCG source to Figma VariableCollections with Light/Dark/High-Contrast and Density modes', () => {
    const payload = dtcgToFigmaVariables(dtcgSource);
    const collections = payload.meta.variableCollections;
    const variables = payload.meta.variables;

    const colorCollection = collections['collection:color'];
    const scaleCollection = collections['collection:scale'];
    expect(colorCollection).toBeDefined();
    expect(scaleCollection).toBeDefined();

    expect(colorCollection!.modes.map((m) => m.name)).toEqual([
      'Light',
      'Dark',
      'High-Contrast',
    ]);
    expect(scaleCollection!.modes.map((m) => m.name)).toEqual([
      'Compact',
      'Default',
      'Comfortable',
    ]);

    const accentVar = variables['var:color.accent'];
    expect(accentVar).toBeDefined();
    expect(accentVar!.resolvedType).toBe('COLOR');
    expect(accentVar!.codeSyntax?.WEB).toBe('var(--mth-color-accent)');
    expect(accentVar!.valuesByMode['mode:light']).toEqual({
      type: 'VARIABLE_ALIAS',
      id: 'var:color.brand.500',
    });
    expect(accentVar!.valuesByMode['mode:dark']).toEqual({
      type: 'VARIABLE_ALIAS',
      id: 'var:color.brand.400',
    });

    const densityVar = variables['var:density'];
    expect(densityVar?.valuesByMode).toEqual({
      'mode:compact': 0.8,
      'mode:default': 1,
      'mode:comfortable': 1.2,
    });

    const controlInline = variables['var:space.controlInline'];
    expect(controlInline?.valuesByMode).toEqual({
      'mode:compact': 9.6,
      'mode:default': 12,
      'mode:comfortable': 14.4,
    });
  });

  it('round-trips Figma Variables back into compilable W3C DTCG JSON preserving theme extensions and aliases', () => {
    const figmaPayload = dtcgToFigmaVariables(dtcgSource);
    const roundTrippedDtcg = figmaVariablesToDtcg(figmaPayload, { baseDocument: dtcgSource });
    const compiled = compileDtcgTokens(roundTrippedDtcg);

    expect(compiled.tokenMap['color.accent']).toBe('--mth-color-accent');
    expect(compiled.tokenMap['space.4']).toBe('--mth-space-4');
    expect(compiled.css).toContain('light-dark(var(--mth-color-brand-500), var(--mth-color-brand-400))');
    expect(compiled.css).toContain('--mth-density: 1;');
  });
});

describe('@methane/figma-sync deterministic Code Connect generator', () => {
  it('generates React 19, Vue, Angular, Svelte, and HTML Code Connect files from CEM + specs', () => {
    const files1 = generateCodeConnectFiles(
      { manifest: DEFAULT_CEM_FIXTURE, specs: DEFAULT_BEHAVIOR_SPECS },
      {
        figmaFileUrl: 'https://www.figma.com/design/ABC123/Methane',
        nodeIds: { 'mth-button': '101:22' },
      },
    );
    const files2 = generateCodeConnectFiles(
      { manifest: DEFAULT_CEM_FIXTURE, specs: DEFAULT_BEHAVIOR_SPECS },
      {
        figmaFileUrl: 'https://www.figma.com/design/ABC123/Methane',
        nodeIds: { 'mth-button': '101:22' },
      },
    );

    expect(files1).toEqual(files2);
    expect(files1.length).toBeGreaterThanOrEqual(20);

    const buttonReact = files1.find((f) => f.tagName === 'mth-button' && f.framework === 'react');
    const buttonVue = files1.find((f) => f.tagName === 'mth-button' && f.framework === 'vue');
    const buttonAngular = files1.find((f) => f.tagName === 'mth-button' && f.framework === 'angular');
    const buttonSvelte = files1.find((f) => f.tagName === 'mth-button' && f.framework === 'svelte');
    const buttonHtml = files1.find((f) => f.tagName === 'mth-button' && f.framework === 'html');

    expect(buttonReact?.content).toContain("import '@methane/react';");
    expect(buttonReact?.content).toContain('node-id=101%3A22');
    expect(buttonReact?.content).toContain("figma.enum('Variant'");
    expect(buttonVue?.content).toContain("import '@methane/vue';");
    expect(buttonAngular?.content).toContain('MthButtonDirective');
    expect(buttonSvelte?.content).toContain('@methane/svelte');
    expect(buttonHtml?.path).toBe('code-connect/html/mth-button.figma.html');
    expect(buttonHtml?.content).toContain('<mth-button');
  });
});
