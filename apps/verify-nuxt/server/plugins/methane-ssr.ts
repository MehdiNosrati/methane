import { registerUtilityElements } from '@methane-ui/primitives';
import { createMethaneNitroPlugin } from '@methane-ui/ssr-nuxt';
import { registerAllComponents } from '@methane-ui/ui';

export default defineNitroPlugin((nitroApp) => {
  registerUtilityElements();
  registerAllComponents();
  const plugin = createMethaneNitroPlugin({
    assetBase: '/methane/styles',
  });
  plugin(nitroApp);
});
