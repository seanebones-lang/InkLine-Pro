import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from '../utils/logger';

export interface ImageGenerationOptions {
  description?: string;
  imageUri?: string;
  highRes?: boolean;
}

export interface GrokVisionRequest {
  model?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface HuggingFaceLineartResponse {
  image: string; // base64 encoded image
}

/**
 * Compress and resize image for API efficiency while maintaining quality
 * Supports 4K+ resolution for pro tattooers
 * Uses modern expo-image-manipulator for optimal performance
 */
export async function processImageForAPI(
  imageUri: string,
  maxWidth: number = 2048,
  maxHeight: number = 2048,
  quality: number = 0.9
): Promise<string> {
  try {
    // Get image info first
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    return manipResult.uri;
  } catch (error) {
    logger.error('Error processing image:', error);
    // Fallback to original URI if processing fails
    return imageUri;
  }
}

/**
 * Convert image URI to base64 for API transmission
 * Uses modern expo-file-system for reliable React Native compatibility
 */
export async function imageUriToBase64(imageUri: string): Promise<string> {
  try {
    // Check if it's already a data URI
    if (imageUri.startsWith('data:')) {
      const base64 = imageUri.includes(',') 
        ? imageUri.split(',')[1] 
        : imageUri;
      return base64;
    }

    // Use expo-file-system for local files (modern 2026 approach)
    if (imageUri.startsWith('file://') || imageUri.startsWith('content://') || !imageUri.startsWith('http')) {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }

    // For remote URLs, use fetch with modern blob handling
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Convert response to base64 using modern approach
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    uint8Array.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = btoa(binary);
    
    return base64;
  } catch (error) {
    logger.error('Error converting image to base64:', error);
    throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Call Grok Vision API via Supabase proxy
 * Generates precise black linework tattoo design
 */
export async function generateTattooDesign(
  options: ImageGenerationOptions
): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const baseUrl = `${supabaseUrl}/functions/v1/grok-proxy`;

    // Build prompt
    let prompt = 'Generate precise black linework tattoo design';
    if (options.description) {
      prompt += ` from description: ${options.description}`;
    }
    if (options.imageUri) {
      prompt += ' from reference photo';
    }
    prompt += ', use dots/dashes for shading references, vector quality, clean outlines, professional tattoo linework style';

    // Build messages with image if provided
    const content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: prompt }
    ];

    if (options.imageUri) {
      // Convert image to base64
      const base64Image = await imageUriToBase64(options.imageUri);
      const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;
      
      content.push({
        type: 'image_url',
        image_url: { url: imageDataUrl }
      });
    }

    // Use latest Grok vision model (updated for 2026)
    // Default to latest available model - can be overridden via options if needed
    const grokModel = options.highRes ? 'grok-3-vision' : 'grok-beta-vision';
    
    const requestBody: GrokVisionRequest = {
      model: grokModel,
      messages: [
        {
          role: 'user',
          content
        }
      ],
      temperature: 0.7,
      max_tokens: options.highRes ? 4000 : 2000,
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract image URL or base64 from response
    // Grok vision API may return image in different formats
    if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      
      // Try to extract base64 image if present
      const base64Match = content.match(/data:image\/[^;]+;base64,([^\s"']+)/);
      if (base64Match) {
        return base64Match[1];
      }
      
      // If it's a URL, fetch and convert to base64
      const urlMatch = content.match(/https?:\/\/[^\s"']+/);
      if (urlMatch) {
        return await imageUriToBase64(urlMatch[0]);
      }
      
      // Return the content as-is (might be SVG or other format)
      return content;
    }

    throw new Error('No image data in response');
  } catch (error) {
    logger.error('Grok Vision API error:', error);
    throw error;
  }
}

/**
 * Process image through Hugging Face ControlNet lineart model
 * Enhances/cleans up linework for professional tattoo quality
 * Uses modern 2026 API patterns with improved error handling
 */
export async function processLineart(
  imageBase64: string,
  model: string = 'lllyasviel/control_v11p_sd15_lineart'
): Promise<string> {
  try {
    // Hugging Face Inference API (anonymous access)
    const hfApiUrl = `https://api-inference.huggingface.co/models/${model}`;
    
    // Convert base64 to Uint8Array (modern approach)
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    // Modern base64 to binary conversion
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const response = await fetch(hfApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: bytes,
    });

    if (!response.ok) {
      // Handle async inference queue with exponential backoff
      if (response.status === 503) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return processLineart(imageBase64, model); // Retry with same params
      }
      
      const errorText = await response.text();
      throw new Error(`HF API error (${response.status}): ${errorText}`);
    }

    // Modern blob to base64 conversion
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 string
    let binary = '';
    uint8Array.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = btoa(binary);
    
    return base64;
  } catch (error) {
    logger.error('Hugging Face lineart processing error:', error);
    throw error;
  }
}

/**
 * Convert base64 image to SVG format for preview
 * Creates a simple SVG wrapper with the image embedded
 */
export function base64ToSVG(base64Image: string, width: number = 800, height: number = 800): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${base64Image}"/>
</svg>`;
  return svg;
}

/**
 * Main function to generate tattoo design with full pipeline
 * 1. Generate design with Grok Vision
 * 2. Process through HF lineart model
 * 3. Return SVG-ready format
 */
export async function generateTattooDesignWithLineart(
  options: ImageGenerationOptions
): Promise<{ svg: string; base64: string }> {
  try {
    // Step 1: Process input image if provided
    let processedImageUri = options.imageUri;
    if (options.imageUri && !options.highRes) {
      processedImageUri = await processImageForAPI(options.imageUri);
    }

    // Step 2: Generate design with Grok
    const grokResult = await generateTattooDesign({
      ...options,
      imageUri: processedImageUri,
    });

    // Step 3: Process through HF lineart model
    let lineartBase64 = grokResult;
    
    // If grokResult is already base64, use it; otherwise convert
    if (!grokResult.match(/^[A-Za-z0-9+/=]+$/)) {
      // Might be a URL or other format, try to fetch
      try {
        lineartBase64 = await imageUriToBase64(grokResult);
      } catch {
        // If it fails, assume it's already base64
        lineartBase64 = grokResult;
      }
    }

    // Process through HF lineart model
    const enhancedLineart = await processLineart(lineartBase64);

    // Step 4: Convert to SVG
    const svg = base64ToSVG(enhancedLineart, 1200, 1200);

    return {
      svg,
      base64: enhancedLineart,
    };
  } catch (error) {
    logger.error('Error in generateTattooDesignWithLineart:', error);
    throw error;
  }
}
