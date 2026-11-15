import type { DemoNode, DemoSpec } from './types.js';

const VOID_HTML_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const SAFE_TAG_RE = /^[a-zA-Z][a-zA-Z0-9-]*$/;
const SAFE_ATTR_RE = /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/;

export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function hasPreviewTarget(node: DemoNode): boolean {
  if (node.attrs && Object.prototype.hasOwnProperty.call(node.attrs, 'data-preview-target')) {
    return node.attrs['data-preview-target'] !== false;
  }
  if (node.children) {
    for (const child of node.children) {
      if (typeof child !== 'string' && hasPreviewTarget(child)) {
        return true;
      }
    }
  }
  return false;
}

function injectPreviewTarget(node: DemoNode, preferredTag: string): { node: DemoNode; injected: boolean } {
  if (node.tag === preferredTag) {
    return {
      node: {
        ...node,
        attrs: { ...(node.attrs ?? {}), 'data-preview-target': true },
      },
      injected: true,
    };
  }
  if (node.children) {
    let injected = false;
    const nextChildren = node.children.map((child) => {
      if (injected || typeof child === 'string') return child;
      const res = injectPreviewTarget(child, preferredTag);
      if (res.injected) injected = true;
      return res.node;
    });
    if (injected) {
      return { node: { ...node, children: nextChildren }, injected: true };
    }
  }
  return { node, injected: false };
}

function renderAttrs(attrs: Readonly<Record<string, string | number | boolean>> | undefined): string {
  if (!attrs) return '';
  let out = '';
  for (const [name, value] of Object.entries(attrs)) {
    if (!SAFE_ATTR_RE.test(name)) {
      throw new Error(`Unsafe HTML attribute name "${name}" in demo spec`);
    }
    if (value === false) continue;
    if (value === true) {
      out += ` ${name}`;
    } else {
      out += ` ${name}="${escapeHtml(String(value))}"`;
    }
  }
  return out;
}

export function renderDemoNode(node: DemoNode): string {
  if (!SAFE_TAG_RE.test(node.tag)) {
    throw new Error(`Unsafe HTML tag name "${node.tag}" in demo spec`);
  }
  const attrsHtml = renderAttrs(node.attrs);
  if (VOID_HTML_TAGS.has(node.tag.toLowerCase())) {
    return `<${node.tag}${attrsHtml}>`;
  }

  const parts: string[] = [];
  if (node.text !== undefined) {
    parts.push(escapeHtml(node.text));
  }
  if (node.children) {
    for (const child of node.children) {
      parts.push(typeof child === 'string' ? escapeHtml(child) : renderDemoNode(child));
    }
  }

  return `<${node.tag}${attrsHtml}>${parts.join('')}</${node.tag}>`;
}

export function renderDemoHtml(tagName: string, spec: DemoSpec): string {
  if (spec.tree !== undefined) {
    const rawNodes = Array.isArray(spec.tree) ? spec.tree : [spec.tree];
    const anyTarget = rawNodes.some((n) => hasPreviewTarget(n));
    let nodes: ReadonlyArray<DemoNode> = rawNodes;

    if (!anyTarget && rawNodes.length > 0) {
      let injected = false;
      nodes = rawNodes.map((n) => {
        if (injected) return n;
        const res = injectPreviewTarget(n, tagName);
        if (res.injected) injected = true;
        return res.node;
      });
      if (!injected && nodes[0]) {
        nodes = [
          {
            ...nodes[0],
            attrs: { ...(nodes[0].attrs ?? {}), 'data-preview-target': true },
          },
          ...nodes.slice(1),
        ];
      }
    }

    return nodes.map((n) => renderDemoNode(n)).join('\n');
  }

  const mergedAttrs: Record<string, string | number | boolean> = {
    ...(spec.attrs ?? {}),
  };
  if (spec.style) {
    const existingStyle = typeof mergedAttrs['style'] === 'string' ? mergedAttrs['style'] : '';
    mergedAttrs['style'] = existingStyle ? `${existingStyle};${spec.style}` : spec.style;
  }
  mergedAttrs['data-preview-target'] = true;

  return renderDemoNode({
    tag: tagName,
    attrs: mergedAttrs,
    ...(spec.text !== undefined ? { text: spec.text } : {}),
    ...(spec.children !== undefined ? { children: spec.children } : {}),
  });
}
