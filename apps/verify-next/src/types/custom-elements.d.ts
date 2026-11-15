import type {} from 'react';
import type {} from '@methane/react';

export interface MethaneUtilityElementProps {
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly id?: string;
}

export interface MethaneSkipLinkProps extends MethaneUtilityElementProps {
  readonly href?: string;
}

export interface MethaneErrorBoundaryProps extends MethaneUtilityElementProps {
  readonly 'fallback-message'?: string;
}

export interface MethaneCssTagProps extends MethaneUtilityElementProps {
  readonly gap?: string;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'mth-skip-link': MethaneSkipLinkProps;
      'mth-visually-hidden': MethaneUtilityElementProps;
      'mth-error-boundary': MethaneErrorBoundaryProps;
      'mth-stack': MethaneCssTagProps;
    }
  }
}
