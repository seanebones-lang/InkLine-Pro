/**
 * Web Demo History Service
 * Uses mock implementation for web preview
 */

import { IS_WEB_DEMO } from '../config/webDemo';
import { mockHistoryService } from './mockServices';
import * as historyService from './historyService';

// Re-export with web demo support
export const saveGenerationLocally = IS_WEB_DEMO
  ? mockHistoryService.saveGenerationLocally
  : historyService.saveGenerationLocally;

export const getGenerations = IS_WEB_DEMO
  ? mockHistoryService.getGenerations
  : historyService.getGenerations;

export const getGenerationImage = IS_WEB_DEMO
  ? mockHistoryService.getGenerationImage
  : historyService.getGenerationImage;

export const deleteGeneration = IS_WEB_DEMO
  ? mockHistoryService.deleteGeneration
  : historyService.deleteGeneration;

export type TattooGeneration = historyService.TattooGeneration;
