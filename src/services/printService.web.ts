/**
 * Web Demo Print Service
 * Uses mock implementation for web preview
 */

import { IS_WEB_DEMO } from '../config/webDemo';
import { mockPrintService } from './mockServices';
import * as printService from './printService';

// Re-export with web demo support
export const scanBluetoothPrinters = IS_WEB_DEMO
  ? mockPrintService.scanBluetoothPrinters
  : printService.scanBluetoothPrinters;

export const printViaBluetooth = IS_WEB_DEMO
  ? mockPrintService.printViaBluetooth
  : printService.printViaBluetooth;

export const printViaWiFi = IS_WEB_DEMO
  ? mockPrintService.printViaWiFi
  : printService.printViaWiFi;

export const shareDesign = IS_WEB_DEMO
  ? mockPrintService.shareDesign
  : printService.shareDesign;

export const getAvailablePrintOptions = IS_WEB_DEMO
  ? mockPrintService.getAvailablePrintOptions
  : printService.getAvailablePrintOptions;

export const exportAsPNG300DPI = IS_WEB_DEMO
  ? async (base64: string) => `data:image/png;base64,${base64}`
  : printService.exportAsPNG300DPI;

export type BluetoothDevice = printService.BluetoothDevice;
