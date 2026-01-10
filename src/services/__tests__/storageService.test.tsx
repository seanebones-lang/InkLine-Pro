import { supabase } from '../../config/supabase';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from '../../utils/logger';
import {
  uploadImageToStorage,
  uploadImageFromUri,
  downloadImageFromStorage,
  deleteImageFromStorage,
  generateThumbnail,
  getStoragePublicUrl,
} from '../storageService';

// Mock modules
jest.mock('../../config/supabase');
j est.mock('expo-file-system');
j est.mock('expo-image-manipulator');
j est.mock('../../utils/logger');

const mockSupabase = supabase as any;
const mockStorage = {
  upload: jest.fn(),
  download: jest.fn(),
  remove: jest.fn(),
  getPublicUrl: jest.fn(),
};
const mockFrom = jest.fn(() => mockStorage);
const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;
const mockWriteAsStringAsync = FileSystem.writeAsStringAsync as jest.Mock;
const mockDeleteAsync = FileSystem.deleteAsync as jest.Mock;
const mockManipulateAsync = ImageManipulator.manipulateAsync as jest.Mock;

const mockPublicUrl = 'https://example.supabase.co/storage/v1/object/public/tattoo-designs/user123/image.png';
const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const mockBlob = new Blob([]);
const mockFileUri = '/path/to/image.png';
const mockTempUri = `${FileSystem.cacheDirectory}temp.png`;
const mockThumbUri = `${FileSystem.cacheDirectory}thumb.png`;

beforeEach(() => {
  jest.clearAllMocks();
  mockStorage.upload.mockResolvedValue({ data: {}, error: null });
  mockStorage.download.mockResolvedValue({ data: mockBlob, error: null });
  mockStorage.remove.mockResolvedValue({ error: null });
  mockStorage.getPublicUrl.mockReturnValue({ publicUrl: mockPublicUrl });
  mockSupabase.storage.from.mockReturnValue(mockStorage);
  mockReadAsStringAsync.mockResolvedValue(mockBase64);
  mockWriteAsStringAsync.mockResolvedValue(undefined);
  mockDeleteAsync.mockResolvedValue(undefined);
  mockManipulateAsync.mockResolvedValue({ uri: mockThumbUri });
});

describe('storageService', () => {
  describe('base64ToBlob', () => {
    it('converts base64 to Blob', () => {
      const blob = base64ToBlob(mockBase64);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('handles data URL prefix', () => {
      const dataUrl = `data:image/png;base64,${mockBase64}`;
      const blob = base64ToBlob(dataUrl);
      expect(blob.type).toBe('image/png');
    });
  });

  describe('uploadImageToStorage', () => {
    it('uploads base64 to main bucket', async () => {
      const result = await uploadImageToStorage(mockBase64, 'user123', 'img456');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('tattoo-designs');
      expect(mockStorage.upload).toHaveBeenCalledWith('user123/img456.png', expect.any(Blob), expect.any(Object));
      expect(mockStorage.getPublicUrl).toHaveBeenCalledWith('user123/img456.png');
      expect(result).toBe(mockPublicUrl);
    });

    it('uploads to thumbnail bucket', async () => {
      await uploadImageToStorage(mockBase64, 'user123', 'img456', true);
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('tattoo-thumbnails');
    });

    it('returns null on upload error', async () => {
      mockStorage.upload.mockResolvedValue({ data: null, error: { message: 'fail' } });
      const result = await uploadImageToStorage(mockBase64, 'user123', 'img456');
      expect(result).toBeNull();
    });

    it('returns null on exception', async () => {
      mockSupabase.storage.from.mockImplementation(() => {
        throw new Error('supabase fail');
      });
      const result = await uploadImageToStorage(mockBase64, 'user123', 'img456');
      expect(result).toBeNull();
    });
  });

  describe('uploadImageFromUri', () => {
    it('uploads from file URI', async () => {
      const result = await uploadImageFromUri(mockFileUri, 'user123', 'img456');
      expect(mockReadAsStringAsync).toHaveBeenCalledWith(mockFileUri, expect.any(Object));
      expect(mockStorage.upload).toHaveBeenCalled();
      expect(result).toBe(mockPublicUrl);
    });

    it('handles thumbnail', async () => {
      await uploadImageFromUri(mockFileUri, 'user123', 'img456', true);
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('tattoo-thumbnails');
    });

    it('returns null on read error', async () => {
      mockReadAsStringAsync.mockRejectedValue(new Error('read fail'));
      const result = await uploadImageFromUri(mockFileUri, 'user123', 'img456');
      expect(result).toBeNull();
    });
  });

  describe('downloadImageFromStorage', () => {
    it('downloads from path', async () => {
      const result = await downloadImageFromStorage('user123/img456.png');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('tattoo-designs');
      expect(mockStorage.download).toHaveBeenCalledWith('user123/img456.png');
      expect(result).toBe(mockBase64); // after prefix removal
    });

    it('extracts path from URL', async () => {
      const url = 'https://supabase.co/storage/v1/object/public/tattoo-designs/user123/img456.png';
      await downloadImageFromStorage(url);
      expect(mockStorage.download).toHaveBeenCalledWith('user123/img456.png');
    });

    it('uses thumbnail bucket', async () => {
      await downloadImageFromStorage('thumbnails/user123/thumb.png');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('tattoo-thumbnails');
    });

    it('returns null on download error', async () => {
      mockStorage.download.mockResolvedValue({ data: null, error: { message: 'fail' } });
      const result = await downloadImageFromStorage('path');
      expect(result).toBeNull();
    });

    it('handles FileReader error', async () => {
      const mockData = { reader: { onloadend: jest.fn(), onerror: jest.fn(() => 'error') } } as any;
      // Mock FileReader behavior
      const result = await downloadImageFromStorage('path');
      expect(result).toBeNull();
    });
  });

  describe('deleteImageFromStorage', () => {
    it('deletes from main bucket', async () => {
      const result = await deleteImageFromStorage('user123/img456.png');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('tattoo-designs');
      expect(mockStorage.remove).toHaveBeenCalledWith(['user123/img456.png']);
      expect(result).toBe(true);
    });

    it('deletes thumbnail', async () => {
      await deleteImageFromStorage('user123/thumb.png', true);
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('tattoo-thumbnails');
    });

    it('extracts path from URL', async () => {
      await deleteImageFromStorage(mockPublicUrl);
      expect(mockStorage.remove).toHaveBeenCalledWith(['user123/img456.png']);
    });

    it('returns false on error', async () => {
      mockStorage.remove.mockResolvedValue({ error: { message: 'fail' } });
      const result = await deleteImageFromStorage('path');
      expect(result).toBe(false);
    });
  });

  describe('generateThumbnail', () => {
    it('generates thumbnail from base64', async () => {
      const result = await generateThumbnail(mockBase64, 300);
      expect(mockWriteAsStringAsync).toHaveBeenCalled();
      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.stringContaining('temp_'),
        [{ resize: { width: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.PNG }
      );
      expect(mockReadAsStringAsync).toHaveBeenCalledWith(mockThumbUri, expect.any(Object));
      expect(mockDeleteAsync).toHaveBeenCalled();
      expect(result).toBe(mockBase64);
    });

    it('uses default size', async () => {
      await generateThumbnail(mockBase64);
      expect(mockManipulateAsync).toHaveBeenCalledWith(expect.any(String), [{ resize: { width: 400 } }], expect.any(Object));
    });

    it('returns null on error', async () => {
      mockManipulateAsync.mockRejectedValue(new Error('manip fail'));
      const result = await generateThumbnail(mockBase64);
      expect(result).toBeNull();
    });
  });

  describe('getStoragePublicUrl', () => {
    it('returns public URL for main bucket', () => {
      const result = getStoragePublicUrl('user123/img456.png');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('tattoo-designs');
      expect(mockStorage.getPublicUrl).toHaveBeenCalledWith('user123/img456.png');
      expect(result).toBe(mockPublicUrl);
    });

    it('for thumbnail bucket', () => {
      getStoragePublicUrl('user123/thumb.png', true);
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('tattoo-thumbnails');
    });
  });
});