import { parseSafeFragment } from '@methane/sanitize';

export interface SharePayload {
  readonly title?: string;
  readonly text?: string;
  readonly url?: string;
}

export interface ClipboardResult {
  readonly ok: boolean;
  readonly method: 'navigator' | 'execCommand' | 'none';
}

export interface ShareResult {
  readonly ok: boolean;
  readonly method: 'web-share' | 'clipboard-fallback' | 'none';
}

/**
 * Clipboard and Web Share helpers with DOM-safe fallbacks and sanitization.
 */
export const ClipboardAndShare = {
  async copyText(text: string): Promise<ClipboardResult> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return { ok: true, method: 'navigator' };
      } catch {
        // Fallback below.
      }
    }

    if (typeof document !== 'undefined' && document.body) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const execFn = (document as Document & { execCommand?: (cmd: string) => boolean }).execCommand;
        if (typeof execFn === 'function' && execFn.call(document, 'copy')) {
          return { ok: true, method: 'execCommand' };
        }
      } catch {
        // Ignore fallback failure.
      } finally {
        textarea.remove();
      }
    }

    return { ok: false, method: 'none' };
  },

  async copySanitizedHtml(rawHtml: string, fallbackPlainText?: string): Promise<ClipboardResult> {
    const fragment = parseSafeFragment(rawHtml);
    const wrapper = document.createElement('div');
    wrapper.appendChild(fragment);
    const plain = fallbackPlainText ?? (wrapper.textContent ?? '');

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard?.write &&
      typeof ClipboardItem !== 'undefined'
    ) {
      try {
        const serializer = new XMLSerializer();
        const serialized = serializer.serializeToString(wrapper);
        const item = new ClipboardItem({
          'text/html': new Blob([serialized], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
        return { ok: true, method: 'navigator' };
      } catch {
        // Fall back to plain text copy.
      }
    }

    return this.copyText(plain);
  },

  async readText(): Promise<string | null> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    }
    return null;
  },

  canWebShare(payload?: SharePayload): boolean {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      return false;
    }
    if (payload && typeof navigator.canShare === 'function') {
      try {
        return navigator.canShare(payload);
      } catch {
        return false;
      }
    }
    return true;
  },

  async share(payload: SharePayload): Promise<ShareResult> {
    if (this.canWebShare(payload)) {
      try {
        await navigator.share(payload);
        return { ok: true, method: 'web-share' };
      } catch {
        // Fallback to clipboard copy of URL or text.
      }
    }
    const fallbackText = [payload.title, payload.text, payload.url].filter(Boolean).join(' — ');
    if (!fallbackText) {
      return { ok: false, method: 'none' };
    }
    const copied = await this.copyText(fallbackText);
    return { ok: copied.ok, method: copied.ok ? 'clipboard-fallback' : 'none' };
  },
};
