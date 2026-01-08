/**
 * Storage Service
 * 
 * Handles image storage in Supabase Storage instead of base64 in database.
 * This prevents database bloat and improves performance.
 * 
 * @module storageService
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const BUCKET_NAME = 'tattoo-designs';
const THUMBNAIL_BUCKET_NAME = 'tattoo-thumbnails';

/**
 * Convert base64 string to Blob for upload
 */
function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Upload image to Supabase Storage
 * 
 * @param base64Image - Base64 encoded image
 * @param userId - User ID for path organization
 * @param imageId - Unique image ID
 * @param isThumbnail - Whether this is a thumbnail
 * @returns Storage path or null if upload fails
 */
export async function uploadImageToStorage(
  base64Image: string,
  userId: string,
  imageId: string,
  isThumbnail: boolean = false
): Promise<string | null> {
  try {
    const bucket = isThumbnail ? THUMBNAIL_BUCKET_NAME : BUCKET_NAME;
    const filePath = `${userId}/${imageId}.png`;
    
    // Convert base64 to blob
    const blob = base64ToBlob(base64Image, 'image/png');
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true, // Overwrite if exists
      });
    
    if (error) {
      logger.error('Error uploading image to storage:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    logger.error('Error in uploadImageToStorage:', error);
    return null;
  }
}

/**
 * Upload image from file URI to Supabase Storage
 * 
 * @param fileUri - Local file URI
 * @param userId - User ID for path organization
 * @param imageId - Unique image ID
 * @param isThumbnail - Whether this is a thumbnail
 * @returns Storage path or null if upload fails
 */
export async function uploadImageFromUri(
  fileUri: string,
  userId: string,
  imageId: string,
  isThumbnail: boolean = false
): Promise<string | null> {
  try {
    const bucket = isThumbnail ? THUMBNAIL_BUCKET_NAME : BUCKET_NAME;
    const filePath = `${userId}/${imageId}.png`;
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert to blob and upload
    const blob = base64ToBlob(base64, 'image/png');
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true,
      });
    
    if (error) {
      logger.error('Error uploading image from URI:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    logger.error('Error in uploadImageFromUri:', error);
    return null;
  }
}

/**
 * Download image from Supabase Storage
 * 
 * @param storagePath - Storage path or public URL
 * @returns Base64 encoded image or null
 */
export async function downloadImageFromStorage(
  storagePath: string
): Promise<string | null> {
  try {
    // If it's already a public URL, extract the path
    let filePath = storagePath;
    if (storagePath.includes(BUCKET_NAME) || storagePath.includes(THUMBNAIL_BUCKET_NAME)) {
      // Extract path from URL
      const urlParts = storagePath.split('/');
      const bucketIndex = urlParts.findIndex(part => 
        part === BUCKET_NAME || part === THUMBNAIL_BUCKET_NAME
      );
      if (bucketIndex !== -1) {
        filePath = urlParts.slice(bucketIndex + 1).join('/');
      }
    }
    
    // Determine bucket from path
    const bucket = filePath.includes('thumbnail') ? THUMBNAIL_BUCKET_NAME : BUCKET_NAME;
    
    // Download file
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);
    
    if (error) {
      logger.error('Error downloading image from storage:', error);
      return null;
    }
    
    // Convert blob to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
        resolve(base64Data);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(data);
    });
  } catch (error) {
    logger.error('Error in downloadImageFromStorage:', error);
    return null;
  }
}

/**
 * Delete image from Supabase Storage
 * 
 * @param storagePath - Storage path or public URL
 * @param isThumbnail - Whether this is a thumbnail
 * @returns Success status
 */
export async function deleteImageFromStorage(
  storagePath: string,
  isThumbnail: boolean = false
): Promise<boolean> {
  try {
    // Extract path from URL if needed
    let filePath = storagePath;
    if (storagePath.includes('/')) {
      const urlParts = storagePath.split('/');
      const bucketIndex = urlParts.findIndex(part => 
        part === BUCKET_NAME || part === THUMBNAIL_BUCKET_NAME
      );
      if (bucketIndex !== -1) {
        filePath = urlParts.slice(bucketIndex + 1).join('/');
      }
    }
    
    const bucket = isThumbnail ? THUMBNAIL_BUCKET_NAME : BUCKET_NAME;
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      logger.error('Error deleting image from storage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error in deleteImageFromStorage:', error);
    return false;
  }
}

/**
 * Generate thumbnail from base64 image
 * Uses expo-image-manipulator for proper resizing and compression
 */
export async function generateThumbnail(
  base64Image: string,
  maxSize: number = 400
): Promise<string | null> {
  try {
    // Convert base64 to file URI for manipulation
    const tempUri = `${FileSystem.cacheDirectory}temp_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(tempUri, base64Image, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Resize and compress image
    const manipulated = await ImageManipulator.manipulateAsync(
      tempUri,
      [{ resize: { width: maxSize } }], // Maintain aspect ratio
      {
        compress: 0.8, // 80% quality
        format: ImageManipulator.SaveFormat.PNG,
      }
    );
    
    // Read back as base64
    const thumbnailBase64 = await FileSystem.readAsStringAsync(
      manipulated.uri,
      { encoding: FileSystem.EncodingType.Base64 }
    );
    
    // Cleanup temp file
    await FileSystem.deleteAsync(tempUri, { idempotent: true });
    
    return thumbnailBase64;
  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    return null;
  }
}

/**
 * Get public URL for storage path
 */
export function getStoragePublicUrl(
  storagePath: string,
  isThumbnail: boolean = false
): string {
  const bucket = isThumbnail ? THUMBNAIL_BUCKET_NAME : BUCKET_NAME;
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}
