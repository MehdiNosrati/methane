import '@methane/tokens/tokens.css';
import '@methane/css/index.css';
import type { ReactNode } from 'react';
import { MethaneClientHydration } from '../client/hydrate';
import type {} from '../types/custom-elements';

export const metadata = {
  title: 'Methane UI — Next.js 15 SSR Verification',
  description: 'Next.js 15 App Router + React 19 native custom elements SSR verification app',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <mth-skip-link href="#main">Skip to verification harness</mth-skip-link>
        <MethaneClientHydration />
        {children}
      </body>
    </html>
  );
}
