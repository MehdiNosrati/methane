'use client';

import { useEffect } from 'react';
import { registerUtilityElements } from '@methane/primitives';
import { initNextHydration } from '@methane/ssr-next/client';

export function MethaneClientHydration(): null {
  useEffect(() => {
    initNextHydration();
    registerUtilityElements();
  }, []);

  return null;
}
