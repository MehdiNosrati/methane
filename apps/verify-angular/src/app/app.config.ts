import { type ApplicationConfig } from '@angular/core';
import { provideMethaneHydration } from '@methane/ssr-angular/client';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: 'METHANE_HYDRATION',
      useFactory: () => {
        const provider = provideMethaneHydration();
        provider.initialize();
        return provider;
      },
    },
  ],
};
