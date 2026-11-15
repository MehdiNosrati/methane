import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MthQueryBuilder,
  queryBuilderSpec,
  registerMthQueryBuilder,
} from './index.js';

describe('<mth-query-builder>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes FormControlSuite', async () => {
    registerMthQueryBuilder();
    const compiled = compileSpec(queryBuilderSpec);
    expect(compiled.docs).toContain('`<mth-query-builder>`');

    let mountedQb: MthQueryBuilder | null = null;
    const formAdapter = {
      mount: async () => {
        const el = document.createElement('mth-query-builder') as MthQueryBuilder;
        el.name = 'query';
        mountedQb = el;
        return el;
      },
      setValue: async (el: HTMLElement, val: string) => {
        (el as MthQueryBuilder).value = val;
        await (el as MthQueryBuilder).updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthQueryBuilder).value,
      getFormDataValue: (fd: FormData, name: string) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedQb) return null;
        if (mountedQb.effectivelyDisabled) return null;
        return mountedQb.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean((el as MthQueryBuilder).shadowRoot!.querySelector('button')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthQueryBuilder).checkValidity(),
      name: 'query',
      defaultValue: '{"combinator":"and","items":[]}',
      nextValue: '{"combinator":"or","items":[{"kind":"rule","id":"r1","field":"role","operator":"equals","value":"admin"}]}',
    };

    const formReport = await FormControlSuite.run(formAdapter);
    expect(formReport.failures).toEqual([]);
    expect(formReport.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(queryBuilderSpec, {
      formControl: formAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('adds nested groups and rules and checks same-root ARIA', async () => {
    registerMthQueryBuilder();
    const el = document.createElement('mth-query-builder') as MthQueryBuilder;
    el.fields = [{ id: 'role', label: 'Role' }];
    document.body.appendChild(el);
    await el.updateComplete;

    el.setQueryAst({
      combinator: 'or',
      items: [
        {
          kind: 'group',
          id: 'g1',
          combinator: 'and',
          items: [{ kind: 'rule', id: 'r1', field: 'role', operator: 'equals', value: 'admin' }],
        },
      ],
    });
    await el.updateComplete;
    expect(el.getQueryAst().items).toHaveLength(1);

    el.value = '{"combinator":"and","items":[]}';
    el.required = true;
    await el.updateComplete;
    expect(el.reportValidity()).toBe(false);
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute('role')).toBe('group');
    expect(base.getAttribute('aria-invalid')).toBe('true');
    expect(base.getAttribute('aria-errormessage')).toBe('mth-qb-error');

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-query-builder name="q"></mth-query-builder>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-query-builder>', 'hyd-query-builder>')
      .replaceAll('<mth-query-builder', '<hyd-query-builder');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthQueryBuilder('hyd');
        customElements.upgrade(host);
        await (host as MthQueryBuilder).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
