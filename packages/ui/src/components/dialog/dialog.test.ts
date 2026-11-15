import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthDialog, dialogSpec, registerMthDialog } from './index.js';

describe('<mth-dialog>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance for modal dialog', async () => {
    const compiled = compileSpec(dialogSpec);
    expect(compiled.docs).toContain('`<mth-dialog>`');
    expect(compiled.a11yChecklist.items.some((i) => i.id === 'apg-keyboard')).toBe(true);

    const report = await runBehaviorSpecAssertions(dialogSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Open dialog';
          const overlay = document.createElement('mth-dialog') as MthDialog;
          overlay.label = 'Settings';
          const closeInput = document.createElement('button');
          closeInput.textContent = 'Action';
          overlay.appendChild(closeInput);
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthDialog).show();
        },
        close: async (overlay) => {
          await (overlay as MthDialog).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthDialog).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: false,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('supports non-modal light dismiss and alert/confirm/prompt variants', async () => {
    // Non-modal dialog supports light dismiss
    const nonModalReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Non-modal';
        const overlay = document.createElement('mth-dialog') as MthDialog;
        overlay.modal = false;
        overlay.label = 'Inspector';
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthDialog).show();
      },
      close: async (overlay) => {
        await (overlay as MthDialog).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthDialog).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(nonModalReport.passed).toBe(true);

    // Alert variant uses alertdialog role on inner dialog without mutating host Light-DOM attributes
    const alertDialog = document.createElement('mth-dialog') as MthDialog;
    alertDialog.variant = 'alert';
    alertDialog.label = 'Session Expired';
    alertDialog.description = 'Please sign in again.';
    document.body.appendChild(alertDialog);
    await alertDialog.updateComplete;
    expect(alertDialog.hasAttribute('role')).toBe(false);
    expect(alertDialog.shadowRoot!.querySelector('dialog')?.getAttribute('role')).toBe('alertdialog');
    expect(scanSameRootAria(alertDialog).valid).toBe(true);

    // Slotted header updates aria-labelledby="mth-dialog-title"
    const slottedDialog = document.createElement('mth-dialog') as MthDialog;
    const customHeader = document.createElement('span');
    customHeader.setAttribute('slot', 'header');
    customHeader.textContent = 'Custom Slotted Header';
    slottedDialog.appendChild(customHeader);
    document.body.appendChild(slottedDialog);
    await slottedDialog.updateComplete;
    await Promise.resolve();
    await slottedDialog.updateComplete;
    expect(slottedDialog.shadowRoot!.querySelector('dialog')?.getAttribute('aria-labelledby')).toBe(
      'mth-dialog-title',
    );
    expect(slottedDialog.motionPhase).toBe('closed');
    await slottedDialog.show();
    expect(slottedDialog.motionPhase).toBe('open');
    await slottedDialog.hide();
    expect(slottedDialog.motionPhase).toBe('closed');

    // Confirm variant emits mth-confirm and closes
    const confirmDialog = document.createElement('mth-dialog') as MthDialog;
    confirmDialog.variant = 'confirm';
    confirmDialog.label = 'Delete project?';
    document.body.appendChild(confirmDialog);
    await confirmDialog.show();
    let confirmed = false;
    confirmDialog.addEventListener('mth-confirm', () => {
      confirmed = true;
    });
    const btns = confirmDialog.shadowRoot!.querySelectorAll<HTMLButtonElement>('.action-btn');
    btns[1]!.click();
    await confirmDialog.updateComplete;
    await Promise.resolve();
    expect(confirmed).toBe(true);
    expect(confirmDialog.open).toBe(false);

    // Prompt variant binds promptValue and emits value on confirm
    const promptDialog = document.createElement('mth-dialog') as MthDialog;
    promptDialog.variant = 'prompt';
    promptDialog.label = 'Rename branch';
    document.body.appendChild(promptDialog);
    await promptDialog.show();
    const promptInput = promptDialog.shadowRoot!.querySelector<HTMLInputElement>('#mth-dialog-prompt')!;
    promptInput.value = 'feature/v2';
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(promptDialog.promptValue).toBe('feature/v2');
    expect(promptDialog.returnValue).toBe('feature/v2');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-dialog label="Notice" description="Saved changes"></mth-dialog>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-dialog>', 'hyd-dialog>').replaceAll('<mth-dialog', '<hyd-dialog');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDialog('hyd');
        customElements.upgrade(host);
        await (host as MthDialog).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
