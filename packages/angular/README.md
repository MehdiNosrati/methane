# `@methane-ui/angular`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Standalone Angular 17+ `@Directive` wrappers, `ControlValueAccessor` form bindings, and strongly-typed `@Input()` / `@Output()` bindings for `@methane-ui/*` custom elements.

## Installation

```bash
pnpm add @methane-ui/angular @methane-ui/ui @methane-ui/core
# or
npm install @methane-ui/angular @methane-ui/ui @methane-ui/core
```

> **Peer dependencies:** `@angular/core >= 17.0.0`, `@angular/forms >= 17.0.0`. Remember to include `CUSTOM_ELEMENTS_SCHEMA` on components rendering `<mth-*>` tags.

## Exported API

| Export | Description |
| --- | --- |
| `Mth*Directive` | Selector-matched Angular directives (e.g. `MthButtonDirective` for `mth-button`, `MthInputDirective` for `mth-input`) with typed inputs and `mth-*` custom event `@Output()`s |
| `ControlValueAccessor` integration | Form-capable directives (`mth-input`, `mth-checkbox`, `mth-select`, `mth-date-picker`, etc.) implement `NG_VALUE_ACCESSOR` for `[(ngModel)]` and `formControlName` |
| `METHANE_ANGULAR_DIRECTIVES` | Readonly array containing all standalone directives for bulk import |

## Usage Examples

### Standalone Component with Reactive Forms

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/input';
import { MthButtonDirective, MthInputDirective } from '@methane-ui/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ReactiveFormsModule, MthButtonDirective, MthInputDirective],
  template: `
    <mth-input
      [formControl]="email"
      type="email"
      placeholder="name@company.com"
    ></mth-input>
    <mth-button variant="solid" (click)="submit()">Sign in</mth-button>
  `,
})
export class LoginComponent {
  email = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  submit(): void {
    console.log(this.email.value);
  }
}
```

### Bulk Import via `METHANE_ANGULAR_DIRECTIVES`

```ts
import { METHANE_ANGULAR_DIRECTIVES } from '@methane-ui/angular';

@Component({
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [...METHANE_ANGULAR_DIRECTIVES],
  // ...
})
export class DashboardComponent {}
```

## SSR Notes

- Pair with `@methane-ui/ssr-angular` for Angular SSR / Universal Declarative Shadow DOM serialization and `provideMethaneHydration().initialize()` inside Angular `provideAppInitializer()`.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
