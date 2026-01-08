/**
 * Image caching utility for optimized image loading
 * Uses expo-image's built-in caching with additional optimizations
 */

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from './logger';

const CACHE_DIR = `${FileSystem.cacheDirectory}image_cache/`;
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB cache limit

/**
 * Initialize image cache directory
 */
export async function initializeImageCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    logger.error('Error initializing image cache:', error);
  }
}

/**
 * Save base64 image to cache file and return file URI
 * This is more efficient than using data URIs directly
 */
export async function cacheBase64Image(
  base64: string,
  key: string
): Promise<string> {
  try {
    await initializeImageCache();
    
    const fileUri = `${CACHE_DIR}${key}.png`;
    
    // Write base64 to file
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return fileUri;
  } catch (error) {
    logger.error('Error caching image:', error);
    // Fallback to data URI
    return `data:image/png;base64,${base64}`;
  }
}

/**
 * Get cached image URI or create cache entry
 */
export async function getCachedImageUri(
  base64: string,
  key: string
): Promise<string> {
  try {
    await initializeImageCache();
    
    const fileUri = `${CACHE_DIR}${key}.png`;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (fileInfo.exists) {
      return fileUri;
    }
    
    // Cache the image
    return await cacheBase64Image(base64, key);
  } catch (error) {
    logger.error('Error getting cached image:', error);
    // Fallback to data URI
    return `data:image/png;base64,${base64}`;
  }
}

/**
 * Create optimized thumbnail from base64 image
 * Returns file URI for efficient caching
 */
export async function createThumbnail(
  base64: string,
  key: string,
  size: number = 200
): Promise<string> {
  try {
    await initializeImageCache();
    
    // First, save full image temporarily
    const tempUri = await cacheBase64Image(base64, `${key}_temp`);
    
    // Resize to thumbnail
    const manipResult = await ImageManipulator.manipulateAsync(
      tempUri,
      [{ resize: { width: size, height: size } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.PNG,
      }
    );
    
    // Save thumbnail
    const thumbnailUri = `${CACHE_DIR}${key}_thumb.png`;
    await FileSystem.copyAsync({
      from: manipResult.uri,
      to: thumbnailUri,
    });
    
    // Clean up temp file
    await FileSystem.deleteAsync(tempUri, { idempotent: true });
    
    return thumbnailUri;
  } catch (error) {
    logger.error('Error creating thumbnail:', error);
    // Fallback to data URI
    return `data:image/png;base64,${base64}`;
  }
}

/**
 * Clear image cache
 */
export async function clearImageCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await initializeImageCache();
    }
  } catch (error) {
    logger.error('Error clearing image cache:', error);
  }
}

/**
 * Get cache size
 */
export async function getCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      return 0;
    }
    
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;
    
    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size;
      }
    }
    
    return totalSize;
  } catch (error) {
    logger.error('Error getting cache size:', error);
    return 0;
  }
}

/**
 * Clean up old cache entries if cache exceeds limit
 */
export async function cleanupCache(): Promise<void> {
  try {
    const currentSize = await getCacheSize();
    
    if (currentSize > MAX_CACHE_SIZE) {
      // Get all files with their modification times
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      const fileInfos = await Promise.all(
        files.map(async (file) => {
          const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
          return {
            name: file,
            size: 'size' in info ? info.size : 0,
            modificationTime: 'modificationTime' in info ? info.modificationTime : 0,
          };
        })
      );
      
      // Sort by modification time (oldest first)
      fileInfos.sort((a, b) => a.modificationTime - b.modificationTime);
      
      // Delete oldest files until under limit
      let sizeToRemove = currentSize - MAX_CACHE_SIZE * 0.8; // Remove to 80% of limit
      for (const fileInfo of fileInfos) {
        if (sizeToRemove <= 0) break;
        
        await FileSystem.deleteAsync(`${CACHE_DIR}${fileInfo.name}`, {
          idempotent: true,
        });
        sizeToRemove -= fileInfo.size;
      }
    }
  } catch (error) {
    logger.error('Error cleaning up cache:', error);
  }
}
