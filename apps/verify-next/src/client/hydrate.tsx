'use client';

import { useEffect } from 'react';
import { registerUtilityElements } from '@methane/primitives';
import { initNextHydration } from '@methane/ssr-next/client';
import { registerAllComponents } from '@methane/ui';

export function MethaneClientHydration(): null {
  useEffect(() => {
    initNextHydration();
    registerUtilityElements();
    registerAllComponents();
  }, []);

  return null;
}
