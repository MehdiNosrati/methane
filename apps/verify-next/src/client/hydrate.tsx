'use client';

import { useEffect } from 'react';
import { registerUtilityElements } from '@methane-ui/primitives';
import { initNextHydration } from '@methane-ui/ssr-next/client';
import { registerAllComponents } from '@methane-ui/ui';

export function MethaneClientHydration(): null {
  useEffect(() => {
    initNextHydration();
    registerUtilityElements();
    registerAllComponents();
  }, []);

  return null;
}
