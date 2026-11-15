import '@angular/compiler';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component.js';
import { config } from './app/app.config.server.js';

export function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(AppComponent, config, context);
}

export default bootstrap;
