import { registerAllComponents as registerAdminComponents } from '@methane-ui/admin';
import { registerAllComponents as registerAiComponents } from '@methane-ui/ai';
import { registerAllComponents as registerAuthComponents } from '@methane-ui/auth';
import { registerAllComponents as registerChatComponents } from '@methane-ui/chat';
import { registerAllComponents as registerCommerceComponents } from '@methane-ui/commerce';

registerAdminComponents();
registerAiComponents();
registerAuthComponents();
registerChatComponents();
registerCommerceComponents();

(window as unknown as { __METHANE_KITS_READY__?: boolean }).__METHANE_KITS_READY__ = true;
