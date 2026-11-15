# `@methane-ui/auth`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Authentication, identity, MFA, WebAuthn passkeys, SSO, session management, and RBAC permission matrix Web Components for **Methane UI**.

## Installation

```bash
pnpm add @methane-ui/auth @methane-ui/core @methane-ui/tokens
# or
npm install @methane-ui/auth @methane-ui/core @methane-ui/tokens
```

> **Peer dependency:** `@methane-ui/core` (`^0.1.2`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane-ui/auth` | Tree-shakeable barrel re-exporting component classes, styles, messages, `registerMth*` helpers, and `registerAllComponents(prefix?)` without side effects |
| `@methane-ui/auth/define` | Side-effect entrypoint that auto-registers all auth custom elements and exports `registerAllComponents` |
| `@methane-ui/auth/<slug>` | Per-component entrypoint (e.g. `@methane-ui/auth/auth-form`, `@methane-ui/auth/mfa-challenge`) |
| `@methane-ui/auth/<slug>/element` | Unregistered component class, styles, messages, and `registerMth*()` |
| `@methane-ui/auth/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-auth-form>` | `MthAuthForm` | `mode`, `value`, `name`, `email`, `password`, `full-name`, `error`, `loading`, `disabled`, `required`, `submit-label` | `mth-submit`, `mth-change` |
| `<mth-mfa-challenge>` | `MthMfaChallenge` | `mode`, `length`, `value`, `name`, `error`, `loading`, `disabled`, `required`, `allow-resend` | `mth-input`, `mth-change`, `mth-complete`, `mth-submit`, `mth-resend`, `mth-mode-change` |
| `<mth-passkey-prompt>` | `MthPasskeyPrompt` | `mode`, `status`, `username`, `error`, `disabled`, `conditional`, `allow-fallback` | `mth-passkey-auth`, `mth-fallback` |
| `<mth-sso-buttons>` | `MthSsoButtons` | `loading-provider`, `orientation`, `disabled`, `label`, `.providers` | `mth-sso-select` |
| `<mth-profile-menu>` | `MthProfileMenu` | `open`, `name`, `email`, `avatar-src`, `user-role`, `placement`, `offset`, `disabled` | `mth-open`, `mth-after-open`, `mth-close`, `mth-after-close`, `mth-select` |
| `<mth-session-list>` | `MthSessionList` | `heading`, `allow-revoke-current`, `loading`, `disabled`, `.sessions` | `mth-revoke`, `mth-revoke-others` |
| `<mth-role-matrix>` | `MthRoleMatrix` | `readonly`, `disabled`, `label`, `.roles`, `.permissions` | `mth-change` |

## Usage Examples

```html
<mth-auth-form id="login" mode="sign-in" submit-label="Continue"></mth-auth-form>

<mth-mfa-challenge id="otp" length="6" allow-resend></mth-mfa-challenge>
```

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/auth/auth-form';
import '@methane-ui/auth/mfa-challenge';

document.getElementById('login')?.addEventListener('mth-submit', (ev) => {
  console.log('Credentials payload:', (ev as CustomEvent).detail);
});

document.getElementById('otp')?.addEventListener('mth-complete', (ev) => {
  console.log('6-digit OTP:', (ev as CustomEvent<{ value: string }>).detail.value);
});
```

## Theming, A11y & SSR Notes

- **Theming**: Customize via `--mth-*` semantic surface, border, and error tokens alongside `::part(base)`, `::part(submit-button)`, `::part(digits)`, and `::part(menu)`.
- **Accessibility & Keyboard**: `<mth-auth-form>` and `<mth-mfa-challenge>` participate in native FACE validation, announce live error states, and support multi-digit paste and arrow navigation. `<mth-profile-menu>` manages top-layer focus and `Escape` dismissal.
- **SSR**: Safe for server rendering via `@methane-ui/ssr`; client-only WebAuthn calls (`navigator.credentials`) stay gated behind user actions.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
