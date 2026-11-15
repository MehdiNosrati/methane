import { Directive, Input } from '@angular/core';

@Directive({
  selector: 'mth-skip-link',
  standalone: true,
})
export class MthSkipLinkHostDirective {
  @Input() href?: string;
}

@Directive({
  selector: 'mth-visually-hidden',
  standalone: true,
})
export class MthVisuallyHiddenHostDirective {}

@Directive({
  selector: 'mth-error-boundary',
  standalone: true,
})
export class MthErrorBoundaryHostDirective {
  @Input('fallback-message') fallbackMessage?: string;
}
