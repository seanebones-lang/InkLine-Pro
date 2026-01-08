/**
 * Web Demo Config Exports
 */

import { IS_WEB_DEMO } from './webDemo';

// Conditionally export web demo or real config
export const supabase = IS_WEB_DEMO
  ? require('./supabase.web').supabase
  : require('./supabase').supabase;
