/**
 * Web Demo Service Exports
 * Re-exports services with web demo support
 */

import { IS_WEB_DEMO } from '../config/webDemo';

// Conditionally export web demo or real services
export * from IS_WEB_DEMO ? './aiService.web' : './aiService';
export * from IS_WEB_DEMO ? './historyService.web' : './historyService';
export * from IS_WEB_DEMO ? './printService.web' : './printService';
