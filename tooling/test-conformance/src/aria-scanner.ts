import type { AriaReferenceIssue, SameRootAriaReport } from './types.js';

export const ARIA_IDREF_ATTRIBUTES: ReadonlyArray<string> = [
  'aria-labelledby',
  'aria-describedby',
  'aria-errormessage',
  'aria-controls',
  'aria-activedescendant',
  'aria-owns',
  'aria-flowto',
  'aria-details',
];

function collectIdsInRoot(root: ParentNode): Set<string> {
  const ids = new Set<string>();
  const elements = root.querySelectorAll('[id]');
  for (const el of elements) {
    if (el.id) {
      ids.add(el.id);
    }
  }
  return ids;
}

function collectAllShadowRoots(root: ParentNode, out: Set<string>): void {
  if (typeof Element !== 'undefined' && root instanceof Element) {
    if (root.id) out.add(root.id);
    if (root.shadowRoot) {
      for (const shadowEl of root.shadowRoot.querySelectorAll('[id]')) {
        if (shadowEl.id) out.add(shadowEl.id);
      }
      collectAllShadowRoots(root.shadowRoot, out);
    }
  }
  for (const el of root.querySelectorAll('*')) {
    if (el.shadowRoot) {
      for (const shadowEl of el.shadowRoot.querySelectorAll('[id]')) {
        if (shadowEl.id) out.add(shadowEl.id);
      }
      collectAllShadowRoots(el.shadowRoot, out);
    }
  }
}

function getRootKind(root: ParentNode): 'document' | 'shadow-root' | 'fragment' {
  if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) {
    return 'shadow-root';
  }
  if (typeof Document !== 'undefined' && root instanceof Document) {
    return 'document';
  }
  return 'fragment';
}

export interface ScanSameRootAriaOptions {
  /** Recurse into attached open ShadowRoots, scanning each root independently. Defaults to `true`. */
  includeShadowRoots?: boolean;
  /** Optional outer document used to classify cross-root ID leaks vs dangling IDs. */
  outerDocument?: Document;
}

/**
 * Enforces ADR-003: Every `aria-*` ID reference must resolve within the exact same DOM root.
 */
export function scanSameRootAria(
  root: ParentNode,
  options?: ScanSameRootAriaOptions,
): SameRootAriaReport {
  const includeShadowRoots = options?.includeShadowRoots ?? true;
  const issues: AriaReferenceIssue[] = [];
  let rootsScanned = 0;
  let referencesChecked = 0;

  const outerDoc =
    options?.outerDocument ??
    (root instanceof Node ? root.ownerDocument ?? (root as Document) : undefined);

  const foreignIds = new Set<string>();
  for (const id of collectIdsInRoot(root)) {
    foreignIds.add(id);
  }
  collectAllShadowRoots(root, foreignIds);
  if (outerDoc && typeof outerDoc.querySelectorAll === 'function') {
    for (const id of collectIdsInRoot(outerDoc)) {
      foreignIds.add(id);
    }
    collectAllShadowRoots(outerDoc, foreignIds);
  }

  function scanElementAttributes(el: Element, localIds: Set<string>, rootKind: 'document' | 'shadow-root' | 'fragment'): void {
    for (const attr of ARIA_IDREF_ATTRIBUTES) {
      const raw = el.getAttribute(attr);
      if (!raw || raw.trim().length === 0) continue;

      const tokens = raw.trim().split(/\s+/);
      for (const idRef of tokens) {
        referencesChecked += 1;
        if (!localIds.has(idRef)) {
          const reason = foreignIds.has(idRef) ? 'cross-root' : 'dangling';
          issues.push({
            elementTag: el.tagName.toLowerCase(),
            attribute: attr,
            targetId: idRef,
            reason,
            rootKind,
          });
        }
      }
    }
  }

  function scanSingleRoot(currentRoot: ParentNode): void {
    rootsScanned += 1;
    const localIds = collectIdsInRoot(currentRoot);
    const rootKind = getRootKind(currentRoot);

    if (typeof Element !== 'undefined' && currentRoot instanceof Element) {
      if (currentRoot.id) localIds.add(currentRoot.id);
      scanElementAttributes(currentRoot, localIds, rootKind);
      if (includeShadowRoots && currentRoot.shadowRoot) {
        scanSingleRoot(currentRoot.shadowRoot);
      }
    }

    const elements = currentRoot.querySelectorAll('*');
    for (const el of elements) {
      scanElementAttributes(el, localIds, rootKind);

      if (includeShadowRoots && el.shadowRoot) {
        scanSingleRoot(el.shadowRoot);
      }
    }
  }

  scanSingleRoot(root);

  return {
    valid: issues.length === 0,
    rootsScanned,
    referencesChecked,
    issues,
  };
}
