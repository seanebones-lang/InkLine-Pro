import { supabase } from '../config/supabase';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import { supabaseCircuitBreaker } from '../utils/circuitBreaker';
import {
  uploadImageToStorage,
  uploadImageFromUri,
  downloadImageFromStorage,
  deleteImageFromStorage,
  generateThumbnail,
} from './storageService';

export interface TattooGeneration {
  id: string;
  user_id: string;
  description?: string;
  image_base64?: string; // Legacy: kept for backward compatibility
  image_storage_path?: string; // New: Supabase Storage path
  svg_content?: string;
  thumbnail_base64?: string; // Legacy: kept for backward compatibility
  thumbnail_storage_path?: string; // New: Supabase Storage path for thumbnail
  width: number;
  height: number;
  dpi: number;
  created_at: string;
  updated_at: string;
}

// Initialize SQLite database for offline storage
let db: SQLite.SQLiteDatabase | null = null;

// Prepared statements for better performance
let preparedStatements: {
  insert?: SQLite.SQLiteStatement;
  select?: SQLite.SQLiteStatement;
  selectById?: SQLite.SQLiteStatement;
  selectByUserId?: SQLite.SQLiteStatement;
  update?: SQLite.SQLiteStatement;
  delete?: SQLite.SQLiteStatement;
} = {};

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('tattoo_history.db');
    
    // Create table if it doesn't exist (with new columns for storage)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tattoo_generations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        description TEXT,
        image_base64 TEXT,
        image_storage_path TEXT,
        svg_content TEXT,
        thumbnail_base64 TEXT,
        thumbnail_storage_path TEXT,
        width INTEGER DEFAULT 2400,
        height INTEGER DEFAULT 2400,
        dpi INTEGER DEFAULT 300,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_user_id ON tattoo_generations(user_id);
      CREATE INDEX IF NOT EXISTS idx_created_at ON tattoo_generations(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_synced ON tattoo_generations(synced);
    `);

    // Migrate: Add new columns if they don't exist (for existing databases)
    try {
      await db.execAsync(`
        ALTER TABLE tattoo_generations ADD COLUMN image_storage_path TEXT;
        ALTER TABLE tattoo_generations ADD COLUMN thumbnail_storage_path TEXT;
      `);
    } catch (error) {
      // Columns already exist, ignore
      logger.debug('Migration columns already exist or migration not needed');
    }

    // Prepare statements for better performance
    try {
      preparedStatements.insert = await db.prepareAsync(`
        INSERT INTO tattoo_generations 
        (id, user_id, description, image_base64, image_storage_path, svg_content, thumbnail_base64, thumbnail_storage_path, width, height, dpi, created_at, updated_at, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);
      
      preparedStatements.selectById = await db.prepareAsync(`
        SELECT * FROM tattoo_generations WHERE id = ?
      `);
      
      preparedStatements.selectByUserId = await db.prepareAsync(`
        SELECT * FROM tattoo_generations 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `);
      
      preparedStatements.update = await db.prepareAsync(`
        UPDATE tattoo_generations SET synced = 1 WHERE id = ?
      `);
      
      preparedStatements.delete = await db.prepareAsync(`
        DELETE FROM tattoo_generations WHERE id = ?
      `);
    } catch (error) {
      logger.warn('Error preparing statements, falling back to regular queries:', error);
    }
  }
  return db;
}

/**
 * Save generation to local database (offline-first)
 * Now uses Supabase Storage for images instead of base64 in database
 */
export async function saveGenerationLocally(
  generation: Omit<TattooGeneration, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const database = await getDatabase();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  let imageStoragePath: string | null = null;
  let thumbnailStoragePath: string | null = null;
  let thumbnailBase64: string | null = null;
  
  // Upload images to Supabase Storage if base64 is provided
  if (generation.image_base64) {
    try {
      // Upload full image to storage
      imageStoragePath = await uploadImageToStorage(
        generation.image_base64,
        generation.user_id,
        id,
        false
      );
      
      // Generate and upload thumbnail
      const thumbnail = await generateThumbnail(generation.image_base64, 400);
      if (thumbnail) {
        thumbnailStoragePath = await uploadImageToStorage(
          thumbnail,
          generation.user_id,
          `${id}_thumb`,
          true
        );
        // Keep thumbnail base64 for offline viewing (small, ~50KB)
        thumbnailBase64 = thumbnail;
      }
    } catch (error) {
      logger.error('Error uploading images to storage, falling back to base64:', error);
      // Fallback: Keep base64 if storage upload fails (backward compatibility)
    }
  }
  
  // Use prepared statement if available, otherwise fallback to regular query
  if (preparedStatements.insert) {
    await preparedStatements.insert.executeAsync([
      id,
      generation.user_id,
      generation.description || null,
      // Store base64 only if storage upload failed (backward compatibility)
      imageStoragePath ? null : (generation.image_base64 || null),
      imageStoragePath || null,
      generation.svg_content || null,
      thumbnailBase64 || generation.thumbnail_base64 || null,
      thumbnailStoragePath || null,
      generation.width,
      generation.height,
      generation.dpi,
      now,
      now,
    ]);
  } else {
    await database.runAsync(
      `INSERT INTO tattoo_generations 
       (id, user_id, description, image_base64, image_storage_path, svg_content, thumbnail_base64, thumbnail_storage_path, width, height, dpi, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        generation.user_id,
        generation.description || null,
        imageStoragePath ? null : (generation.image_base64 || null),
        imageStoragePath || null,
        generation.svg_content || null,
        thumbnailBase64 || generation.thumbnail_base64 || null,
        thumbnailStoragePath || null,
        generation.width,
        generation.height,
        generation.dpi,
        now,
        now,
      ]
    );
  }

  // Try to sync to Supabase in background
  syncToSupabase(id, {
    ...generation,
    id,
    image_storage_path: imageStoragePath || undefined,
    thumbnail_storage_path: thumbnailStoragePath || undefined,
    created_at: now,
    updated_at: now,
  }).catch((error) => {
    logger.error('Error syncing to Supabase in background:', error);
  });

  return id;
}

/**
 * Sync local generation to Supabase
 */
async function syncToSupabase(id: string, generation: TattooGeneration): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use circuit breaker for reliability
    await supabaseCircuitBreaker.execute(
      async () => {
        const { error } = await supabase
          .from('tattoo_generations')
          .upsert({
            id,
            user_id: user.id,
            description: generation.description,
            // Store storage paths, not base64 (saves database space)
            image_storage_path: generation.image_storage_path,
            thumbnail_storage_path: generation.thumbnail_storage_path,
            svg_content: generation.svg_content,
            width: generation.width,
            height: generation.height,
            dpi: generation.dpi,
            created_at: generation.created_at,
            updated_at: generation.updated_at,
          }, {
            onConflict: 'id',
          });

        if (error) {
          throw error;
        }

        // Mark as synced in local database
        const database = await getDatabase();
        if (preparedStatements.update) {
          await preparedStatements.update.executeAsync([id]);
        } else {
          await database.runAsync(
            'UPDATE tattoo_generations SET synced = 1 WHERE id = ?',
            [id]
          );
        }
      },
      () => {
        // Fallback: Just log error, sync will retry later
        logger.warn('Supabase sync failed, will retry later');
        return Promise.resolve();
      }
    );
  } catch (error) {
    logger.error('Error syncing to Supabase:', error);
    // Don't throw - offline-first means we can continue without sync
  }
}

/**
 * Get generations from Supabase with pagination
 */
export async function getGenerationsFromSupabase(
  page: number = 0,
  pageSize: number = 20,
  searchQuery?: string
): Promise<{ data: TattooGeneration[]; hasMore: boolean }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], hasMore: false };
    }

    // Use circuit breaker for reliability with graceful fallback
    return await supabaseCircuitBreaker.execute(
      async () => {
        let query = supabase
          .from('tattoo_generations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (searchQuery) {
          query = query.ilike('description', `%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          data: (data || []) as TattooGeneration[],
          hasMore: (data?.length || 0) === pageSize,
        };
      },
      () => {
        // Fallback: Return empty result, will use local storage
        logger.info('Supabase unavailable, falling back to local storage');
        return Promise.resolve({ data: [], hasMore: false });
      }
    );
  } catch (error) {
    logger.error('Error fetching from Supabase:', error);
    return { data: [], hasMore: false };
  }
}

/**
 * Get generations from local database (offline)
 */
export async function getGenerationsLocally(
  limit: number = 50,
  searchQuery?: string
): Promise<TattooGeneration[]> {
  const database = await getDatabase();
  
  let query = 'SELECT * FROM tattoo_generations ORDER BY created_at DESC LIMIT ?';
  let params: any[] = [limit];

  if (searchQuery) {
    query = 'SELECT * FROM tattoo_generations WHERE description LIKE ? ORDER BY created_at DESC LIMIT ?';
    params = [`%${searchQuery}%`, limit];
  }

  const result = await database.getAllAsync(query, params);
  return result as TattooGeneration[];
}

/**
 * Get generations (tries Supabase first, falls back to local)
 */
export async function getGenerations(
  page: number = 0,
  pageSize: number = 20,
  searchQuery?: string
): Promise<{ data: TattooGeneration[]; hasMore: boolean }> {
  try {
    // Try Supabase first
    const result = await getGenerationsFromSupabase(page, pageSize, searchQuery);
    if (result.data.length > 0) {
      return result;
    }
  } catch (error) {
    logger.info('Supabase unavailable, using local storage', error);
  }

  // Fallback to local
  const localData = await getGenerationsLocally(pageSize * (page + 1), searchQuery);
  const paginatedData = localData.slice(page * pageSize, (page + 1) * pageSize);

  return {
    data: paginatedData,
    hasMore: localData.length > (page + 1) * pageSize,
  };
}

/**
 * Get full image data (downloads from storage if path exists, falls back to base64)
 */
export async function getGenerationImage(id: string): Promise<string | null> {
  const database = await getDatabase();
  
  let generation: TattooGeneration | null = null;
  
  if (preparedStatements.selectById) {
    const result = await preparedStatements.selectById.executeAsync([id]);
    const rows = await result.getAllAsync<TattooGeneration>();
    generation = rows[0] || null;
  } else {
    generation = await database.getFirstAsync<TattooGeneration>(
      'SELECT * FROM tattoo_generations WHERE id = ?',
      [id]
    );
  }
  
  if (!generation) return null;
  
  // Priority: Try storage path first (new format)
  if (generation.image_storage_path) {
    try {
      const base64 = await downloadImageFromStorage(generation.image_storage_path);
      if (base64) return base64;
    } catch (error) {
      logger.warn('Error downloading from storage, falling back to base64:', error);
    }
  }
  
  // Fallback: Use base64 (legacy format or storage unavailable)
  return generation.image_base64 || null;
}

/**
 * Get thumbnail (downloads from storage if path exists, falls back to base64)
 */
export async function getGenerationThumbnail(id: string): Promise<string | null> {
  const database = await getDatabase();
  
  let generation: TattooGeneration | null = null;
  
  if (preparedStatements.selectById) {
    const result = await preparedStatements.selectById.executeAsync([id]);
    const rows = await result.getAllAsync<TattooGeneration>();
    generation = rows[0] || null;
  } else {
    generation = await database.getFirstAsync<TattooGeneration>(
      'SELECT * FROM tattoo_generations WHERE id = ?',
      [id]
    );
  }
  
  if (!generation) return null;
  
  // Priority: Try storage path first (new format)
  if (generation.thumbnail_storage_path) {
    try {
      const base64 = await downloadImageFromStorage(generation.thumbnail_storage_path);
      if (base64) return base64;
    } catch (error) {
      logger.warn('Error downloading thumbnail from storage, falling back to base64:', error);
    }
  }
  
  // Fallback: Use base64 (legacy format or storage unavailable)
  return generation.thumbnail_base64 || null;
}

/**
 * Delete generation (including storage files)
 */
export async function deleteGeneration(id: string): Promise<void> {
  const database = await getDatabase();
  
  // Get generation to delete storage files
  let generation: TattooGeneration | null = null;
  if (preparedStatements.selectById) {
    const result = await preparedStatements.selectById.executeAsync([id]);
    const rows = await result.getAllAsync<TattooGeneration>();
    generation = rows[0] || null;
  } else {
    generation = await database.getFirstAsync<TattooGeneration>(
      'SELECT * FROM tattoo_generations WHERE id = ?',
      [id]
    );
  }
  
  // Delete from storage if paths exist
  if (generation) {
    if (generation.image_storage_path) {
      await deleteImageFromStorage(generation.image_storage_path, false).catch((error) => {
        logger.error('Error deleting image from storage:', error);
      });
    }
    if (generation.thumbnail_storage_path) {
      await deleteImageFromStorage(generation.thumbnail_storage_path, true).catch((error) => {
        logger.error('Error deleting thumbnail from storage:', error);
      });
    }
  }
  
  // Delete from local database
  if (preparedStatements.delete) {
    await preparedStatements.delete.executeAsync([id]);
  } else {
    await database.runAsync('DELETE FROM tattoo_generations WHERE id = ?', [id]);
  }

  // Delete from Supabase
  try {
    await supabase
      .from('tattoo_generations')
      .delete()
      .eq('id', id);
  } catch (error) {
    logger.error('Error deleting from Supabase:', error);
  }
}

/**
 * Sync all unsynced local generations to Supabase
 */
export async function syncAllToSupabase(): Promise<void> {
  const database = await getDatabase();
  const unsynced = await database.getAllAsync<{ id: string }>(
    'SELECT id FROM tattoo_generations WHERE synced = 0'
  );

  for (const item of unsynced) {
    const generation = await database.getFirstAsync<TattooGeneration>(
      'SELECT * FROM tattoo_generations WHERE id = ?',
      [item.id]
    );
    if (generation) {
      await syncToSupabase(generation.id, generation);
    }
  }
}
