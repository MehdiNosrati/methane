# `@methane-ui/chat`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Real-time messaging, threaded discussions, notification bell, typing/presence indicators, emoji reaction bars, and collaborative cursor overlays for **Methane UI**.

## Installation

```bash
pnpm add @methane-ui/chat @methane-ui/core @methane-ui/tokens
# or
npm install @methane-ui/chat @methane-ui/core @methane-ui/tokens
```

> **Peer dependency:** `@methane-ui/core` (`^0.1.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane-ui/chat` | Auto-registers all 8 chat kit elements and exports `registerAllComponents(prefix?)` |
| `@methane-ui/chat/<slug>` | Per-component entrypoint (e.g. `@methane-ui/chat/chat-thread`, `@methane-ui/chat/message-composer`) |
| `@methane-ui/chat/<slug>/element` | Unregistered component class, spec, styles, messages, and `registerMth*()` |
| `@methane-ui/chat/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-chat-thread>` | `MthChatThread` | `estimate-height`, `overscan`, `unread-message-id`, `label`, `show-scroll-to-bottom`, `allow-raw-html` | `mth-scroll-bottom`, `mth-retry` |
| `<mth-message-composer>` | `MthMessageComposer` | `value`, `default-value`, `name`, `label`, `placeholder`, `streaming`, `submit-on-enter`, `max-length` | `mth-input`, `mth-change`, `mth-submit`, `mth-stop`, `mth-attach`, `mth-emoji` |
| `<mth-comment-thread>` | `MthCommentThread` | `label`, `allow-reply`, `allow-resolve`, `allow-raw-html`, `.comments` | `mth-reply`, `mth-resolve-toggle` |
| `<mth-reaction-bar>` | `MthReactionBar` | `value`, `multiple`, `allow-add`, `disabled`, `label`, `.reactions` | `mth-change`, `mth-add-reaction` |
| `<mth-notification-bell>` | `MthNotificationBell` | `open`, `placement`, `offset`, `unread-count`, `max-count`, `use-store`, `label` | `mth-open`, `mth-after-open`, `mth-close`, `mth-after-close`, `mth-item-select`, `mth-item-dismiss`, `mth-mark-all-read` |
| `<mth-presence-badge>` | `MthPresenceBadge` | `status`, `label`, `show-label`, `size` | — |
| `<mth-typing-indicator>` | `MthTypingIndicator` | `label`, `locale`, `.users` | — |
| `<mth-collab-cursors>` | `MthCollabCursors` | `label`, `.cursors` | — |

## Usage Examples

```html
<mth-chat-thread id="thread" show-scroll-to-bottom></mth-chat-thread>
<mth-typing-indicator></mth-typing-indicator>
<mth-message-composer id="composer" placeholder="Write a message..." submit-on-enter></mth-message-composer>
```

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/chat/chat-thread';
import '@methane-ui/chat/message-composer';
import '@methane-ui/chat/typing-indicator';

const thread = document.getElementById('thread') as any;
thread.messages = [
  { id: '1', author: 'Maya', body: 'Shipped the v2 **release notes**!', timestamp: '2026-11-15T10:00:00Z' },
];
```

## Theming, A11y, Security & SSR Notes

- **Security**: Message bodies inside `<mth-chat-thread>` and `<mth-comment-thread>` are sanitized with `@methane-ui/sanitize` (`allow-raw-html` defaults to `false`).
- **Performance**: `<mth-chat-thread>` uses `VirtualizerController` for smooth scrolling across thousands of messages.
- **Accessibility**: Screen-reader announcements via `LiveAnnouncer`, keyboard-accessible notification center popover, and reduced-motion-safe typing indicator animation.
- **SSR**: Server-renders initial message markup and notification badge state with `@methane-ui/ssr`.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
