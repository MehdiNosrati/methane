import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { registerUtilityElements } from '@methane/primitives';
import { initAngularHydration, upgradeMethaneAngularElements } from '@methane/ssr-angular/client';
import { AppComponent } from './app/app.component.js';
import { appConfig } from './app/app.config.js';

initAngularHydration();
registerUtilityElements();
upgradeMethaneAngularElements(document);

bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  console.error(error);
});
