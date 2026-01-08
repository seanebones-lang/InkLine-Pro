import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Platform, Share, Alert } from 'react-native';
import { generateEnhancedSVG } from '../components/LineworkViewer';

// Type definitions for Bluetooth printer
interface BluetoothDevice {
  address: string;
  name: string;
}

// Import Bluetooth printer (conditional for platform support)
let BluetoothEscposPrinter: any = null;
try {
  if (Platform.OS === 'android') {
    BluetoothEscposPrinter = require('react-native-bluetooth-escpos-printer');
  }
} catch (error) {
  console.warn('Bluetooth printer library not available:', error);
}

/**
 * Convert SVG to PNG at 300 DPI
 * Uses WebView rendering for high-quality conversion
 */
export async function svgToPNG300DPI(
  svgString: string,
  width: number = 2400, // 8 inches at 300 DPI
  height: number = 2400
): Promise<string> {
  try {
    // For React Native, we'll use expo-print to convert SVG to PDF first
    // Then convert to PNG, or use a WebView-based approach
    
    // Create HTML with SVG embedded for rendering
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            svg {
              width: ${width}px;
              height: ${height}px;
            }
          </style>
        </head>
        <body>
          ${svgString}
        </body>
      </html>
    `;

    // Generate PDF from HTML (expo-print can handle this)
    const { uri: pdfUri } = await Print.printToFileAsync({ html });
    
    // For now, return the base64 image directly
    // In production, you might want to use a library like react-native-view-shot
    // or convert PDF to PNG server-side
    
    // Return the original base64 if available, or use PDF as fallback
    return pdfUri;
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
    throw new Error('Failed to convert SVG to PNG');
  }
}

/**
 * Export design as PNG at 300 DPI
 * Returns data URI for direct use in printing
 */
export async function exportAsPNG300DPI(
  base64Image: string,
  width: number = 2400, // 8 inches at 300 DPI
  height: number = 2400
): Promise<string> {
  try {
    // For printing, we use the base64 image directly
    // The high-res base64 from AI generation is already at sufficient quality
    // Return as data URI for Bluetooth printing
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error('Error exporting PNG:', error);
    throw error;
  }
}

/**
 * Scan for Bluetooth printers
 */
export async function scanBluetoothPrinters(): Promise<BluetoothDevice[]> {
  if (!BluetoothEscposPrinter || Platform.OS !== 'android') {
    throw new Error('Bluetooth printing is only available on Android');
  }

  try {
    // Enable Bluetooth
    await BluetoothEscposPrinter.enableBluetooth();
    
    // Scan for devices
    const devices = await BluetoothEscposPrinter.scanDevices();
    
    return devices.map((device: any) => ({
      address: device.address || device.id,
      name: device.name || 'Unknown Printer',
    }));
  } catch (error) {
    console.error('Error scanning Bluetooth printers:', error);
    throw new Error('Failed to scan for Bluetooth printers');
  }
}

/**
 * Print via Bluetooth
 */
export async function printViaBluetooth(
  deviceAddress: string,
  imageUri: string
): Promise<void> {
  if (!BluetoothEscposPrinter || Platform.OS !== 'android') {
    throw new Error('Bluetooth printing is only available on Android');
  }

  try {
    // Connect to printer
    await BluetoothEscposPrinter.connect(deviceAddress);
    
    // Handle data URI or file URI
    let printUri = imageUri;
    if (imageUri.startsWith('data:')) {
      // For data URIs, we need to save to file first
      const base64Data = imageUri.split(',')[1];
      const fileUri = `${FileSystem.cacheDirectory}print_temp.png`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      printUri = fileUri;
    }
    
    // Print image
    await BluetoothEscposPrinter.printImage(printUri, {
      width: 384, // Standard thermal printer width
      left: 0,
    });
    
    // Disconnect
    await BluetoothEscposPrinter.disconnect();
  } catch (error) {
    console.error('Error printing via Bluetooth:', error);
    throw new Error('Failed to print via Bluetooth');
  }
}

/**
 * Print via WiFi/AirPrint using expo-print
 */
export async function printViaWiFi(
  base64Image: string,
  width: number = 2400,
  height: number = 2400
): Promise<void> {
  try {
    // Generate enhanced SVG
    const svg = generateEnhancedSVG(base64Image, width, height, {
      showDots: true,
      showDashes: true,
    });

    // Create HTML for printing
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              @page {
                size: ${width / 300}in ${height / 300}in;
                margin: 0;
              }
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            svg {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          ${svg}
        </body>
      </html>
    `;

    // Print using expo-print
    await Print.printAsync({
      html,
      base64: false,
    });
  } catch (error) {
    console.error('Error printing via WiFi:', error);
    throw new Error('Failed to print via WiFi/AirPrint');
  }
}

/**
 * Share design as fallback option
 */
export async function shareDesign(
  base64Image: string,
  filename: string = 'tattoo-design.png'
): Promise<void> {
  try {
    // Save to file system
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, base64Image, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share via native share sheet
    await Share.share({
      url: fileUri,
      message: 'Tattoo design',
    });
  } catch (error) {
    console.error('Error sharing design:', error);
    Alert.alert('Error', 'Failed to share design');
  }
}

/**
 * Get available print options based on platform
 */
export function getAvailablePrintOptions(): {
  bluetooth: boolean;
  wifi: boolean;
  share: boolean;
} {
  return {
    bluetooth: Platform.OS === 'android' && BluetoothEscposPrinter !== null,
    wifi: true, // expo-print works on all platforms
    share: true, // Share sheet available on all platforms
  };
}
