import { registerUtilityElements } from '@methane/primitives';
import { createMethaneNitroPlugin } from '@methane/ssr-nuxt';
import { registerAllComponents } from '@methane/ui';

export default defineNitroPlugin((nitroApp) => {
  registerUtilityElements();
  registerAllComponents();
  const plugin = createMethaneNitroPlugin({
    assetBase: '/methane/styles',
  });
  plugin(nitroApp);
});
