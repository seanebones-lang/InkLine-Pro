import { supabase } from '../config/supabase';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

export interface TattooGeneration {
  id: string;
  user_id: string;
  description?: string;
  image_base64?: string;
  svg_content?: string;
  thumbnail_base64?: string;
  width: number;
  height: number;
  dpi: number;
  created_at: string;
  updated_at: string;
}

// Initialize SQLite database for offline storage
let db: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('tattoo_history.db');
    
    // Create table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tattoo_generations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        description TEXT,
        image_base64 TEXT,
        svg_content TEXT,
        thumbnail_base64 TEXT,
        width INTEGER DEFAULT 2400,
        height INTEGER DEFAULT 2400,
        dpi INTEGER DEFAULT 300,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_user_id ON tattoo_generations(user_id);
      CREATE INDEX IF NOT EXISTS idx_created_at ON tattoo_generations(created_at DESC);
    `);
  }
  return db;
}

/**
 * Save generation to local database (offline-first)
 */
export async function saveGenerationLocally(generation: Omit<TattooGeneration, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const database = await getDatabase();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  // Create thumbnail from base64 (smaller version for list view)
  let thumbnail = generation.thumbnail_base64;
  if (!thumbnail && generation.image_base64) {
    // Use first 1000 chars as thumbnail (simplified)
    thumbnail = generation.image_base64.substring(0, 1000);
  }

  await database.runAsync(
    `INSERT INTO tattoo_generations 
     (id, user_id, description, image_base64, svg_content, thumbnail_base64, width, height, dpi, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      id,
      generation.user_id,
      generation.description || null,
      generation.image_base64 || null,
      generation.svg_content || null,
      thumbnail || null,
      generation.width,
      generation.height,
      generation.dpi,
      now,
      now,
    ]
  );

  // Try to sync to Supabase in background
  syncToSupabase(id, { ...generation, id, created_at: now, updated_at: now }).catch((error) => {
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

    const { error } = await supabase
      .from('tattoo_generations')
      .upsert({
        id,
        user_id: user.id,
        description: generation.description,
        // Store only thumbnail in Supabase to save space, full image stays local
        thumbnail_base64: generation.thumbnail_base64,
        svg_content: generation.svg_content,
        width: generation.width,
        height: generation.height,
        dpi: generation.dpi,
        created_at: generation.created_at,
        updated_at: generation.updated_at,
      }, {
        onConflict: 'id',
      });

    if (!error) {
      const database = await getDatabase();
      await database.runAsync(
        'UPDATE tattoo_generations SET synced = 1 WHERE id = ?',
        [id]
      );
    }
  } catch (error) {
    logger.error('Error syncing to Supabase:', error);
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
 * Get full image data from local storage
 */
export async function getGenerationImage(id: string): Promise<string | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ image_base64: string }>(
    'SELECT image_base64 FROM tattoo_generations WHERE id = ?',
    [id]
  );
  return result?.image_base64 || null;
}

/**
 * Delete generation
 */
export async function deleteGeneration(id: string): Promise<void> {
  // Delete from local
  const database = await getDatabase();
  await database.runAsync('DELETE FROM tattoo_generations WHERE id = ?', [id]);

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
