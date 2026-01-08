import {
  saveGenerationLocally,
  getGenerations,
  deleteGeneration,
  getGenerationImage,
} from '../historyService';
import * as SQLite from 'expo-sqlite';
import { supabase } from '../../config/supabase';

// Mock dependencies
jest.mock('expo-sqlite');
jest.mock('../../config/supabase');

describe('historyService', () => {
  const mockDb = {
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    });
  });

  describe('saveGenerationLocally', () => {
    it('should save generation to local database', async () => {
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });

      const generation = {
        user_id: 'test-user-id',
        description: 'Test design',
        image_base64: 'base64data',
        svg_content: '<svg></svg>',
        width: 2400,
        height: 2400,
        dpi: 300,
      };

      const id = await saveGenerationLocally(generation);

      expect(id).toBeDefined();
      expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it('should handle missing optional fields', async () => {
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });

      const generation = {
        user_id: 'test-user-id',
        width: 2400,
        height: 2400,
        dpi: 300,
      };

      const id = await saveGenerationLocally(generation);

      expect(id).toBeDefined();
    });
  });

  describe('getGenerations', () => {
    it('should fetch generations from Supabase', async () => {
      const mockData = [
        {
          id: '1',
          user_id: 'test-user-id',
          description: 'Test',
          created_at: new Date().toISOString(),
          width: 2400,
          height: 2400,
          dpi: 300,
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getGenerations(0, 20);

      expect(result.data).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should fallback to local storage when Supabase fails', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await getGenerations(0, 20);

      expect(result.data).toEqual([]);
    });
  });

  describe('deleteGeneration', () => {
    it('should delete from local database', async () => {
      mockDb.runAsync.mockResolvedValue({});

      await deleteGeneration('test-id');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM tattoo_generations WHERE id = ?',
        ['test-id']
      );
    });
  });

  describe('getGenerationImage', () => {
    it('should retrieve image from local database', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        image_base64: 'base64data',
      });

      const result = await getGenerationImage('test-id');

      expect(result).toBe('base64data');
      expect(mockDb.getFirstAsync).toHaveBeenCalled();
    });

    it('should return null when image not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getGenerationImage('test-id');

      expect(result).toBeNull();
    });
  });
});
