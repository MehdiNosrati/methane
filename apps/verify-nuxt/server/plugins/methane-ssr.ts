import { registerUtilityElements } from '@methane/primitives';
import { createMethaneNitroPlugin } from '@methane/ssr-nuxt';

export default defineNitroPlugin((nitroApp) => {
  registerUtilityElements();
  const plugin = createMethaneNitroPlugin({
    assetBase: '/methane/styles',
  });
  plugin(nitroApp);
});
