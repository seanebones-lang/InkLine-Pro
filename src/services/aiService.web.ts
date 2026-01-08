/**
 * Web Demo AI Service
 * Uses mock implementation for web preview
 */

import { IS_WEB_DEMO } from '../config/webDemo';
import { mockAiService } from './mockServices';
import * as aiService from './aiService';

// Re-export with web demo support
export const generateTattooDesignWithLineart = IS_WEB_DEMO
  ? mockAiService.generateTattooDesignWithLineart
  : aiService.generateTattooDesignWithLineart;

export const processImageForAPI = IS_WEB_DEMO
  ? mockAiService.processImageForAPI
  : aiService.processImageForAPI;
