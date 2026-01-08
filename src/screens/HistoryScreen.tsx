import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ProtectedRoute } from '../components/ProtectedRoute';
import {
  getGenerations,
  deleteGeneration,
  getGenerationImage,
  syncAllToSupabase,
  TattooGeneration,
} from '../services/historyService';
import { shareDesign } from '../services/printService';
import { useTheme, ThemeContextType } from '../contexts/ThemeContext';
import { logger } from '../utils/logger';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface HistoryItemProps {
  item: TattooGeneration;
  onPress: (item: TattooGeneration) => void;
  onDelete: (id: string) => void;
  onShare: (item: TattooGeneration) => void;
  colors: ThemeContextType['colors'];
}

const HistoryItem = React.memo<HistoryItemProps>(({ item, onPress, onDelete, onShare, colors }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadImage = async () => {
      try {
        // Check if cancelled
        if (abortController.signal.aborted) return;

        if (item.thumbnail_base64) {
          setImageUri(`data:image/png;base64,${item.thumbnail_base64}`);
        } else if (item.image_base64) {
          setImageUri(`data:image/png;base64,${item.image_base64}`);
        } else {
          // Try to get full image from local storage
          const fullImage = await getGenerationImage(item.id);
          if (fullImage && !abortController.signal.aborted) {
            setImageUri(`data:image/png;base64,${fullImage}`);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          logger.error('Error loading image:', error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoadingImage(false);
        }
      }
    };
    
    loadImage();

    return () => {
      abortController.abort();
    };
  }, [item.id, item.thumbnail_base64, item.image_base64]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1) }],
  }));

  return (
    <AnimatedTouchableOpacity
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
      style={[animatedStyle]}
      onPress={() => onPress(item)}
      className="mb-3 mx-4"
      accessibilityRole="button"
      accessibilityLabel={`Tattoo design from ${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'unknown date'}`}
    >
      <View
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        }}
      >
        <View className="flex-row">
          {/* Thumbnail */}
          <View className="w-24 h-24" style={{ backgroundColor: colors.background }}>
            {loadingImage ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : imageUri ? (
              <Image
                source={{ uri: imageUri }}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
                transition={200}
                cachePolicy="memory-disk"
                accessibilityLabel="Design thumbnail"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text style={{ color: colors.textSecondary }}>No Image</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 p-3">
            <Text
              className="text-base font-semibold mb-1"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {item.description || 'Untitled Design'}
            </Text>
            <Text
              className="text-sm mb-2"
              style={{ color: colors.textSecondary }}
            >
              {item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Unknown date'}
            </Text>
            <Text
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              {item.width}×{item.height} @ {item.dpi} DPI
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row items-center pr-2 gap-2">
            <TouchableOpacity
              onPress={() => onShare(item)}
              className="p-2"
              accessibilityRole="button"
              accessibilityLabel="Share design"
            >
              <Text style={{ color: colors.primary }}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              className="p-2"
              accessibilityRole="button"
              accessibilityLabel="Delete design"
            >
              <Text style={{ color: colors.error }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
});

HistoryItem.displayName = 'HistoryItem';

const HistoryContent: React.FC = () => {
  const { colors } = useTheme();
  const [generations, setGenerations] = useState<TattooGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TattooGeneration | null>(null);

  const loadGenerations = useCallback(async (reset: boolean = false) => {
    try {
      const currentPage = reset ? 0 : page;
      const result = await getGenerations(
        currentPage,
        20,
        searchQuery || undefined
      );

      if (reset) {
        setGenerations(result.data);
      } else {
        setGenerations((prev) => [...prev, ...result.data]);
      }

      setHasMore(result.hasMore);
      setPage(reset ? 1 : currentPage + 1);
    } catch (error) {
      logger.error('Error loading generations:', error);
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    loadGenerations(true);
  }, [searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Sync to Supabase
    await syncAllToSupabase();
    await loadGenerations(true);
  }, [loadGenerations]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadGenerations(false);
    }
  }, [loading, hasMore, loadGenerations]);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert(
      'Delete Design',
      'Are you sure you want to delete this design?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGeneration(id);
            setGenerations((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  }, []);

  const handleShare = useCallback(async (item: TattooGeneration) => {
    try {
      const imageBase64 = item.image_base64 || (await getGenerationImage(item.id));
      if (imageBase64) {
        await shareDesign(imageBase64, `tattoo-design-${item.id}.png`);
      } else {
        Alert.alert('Error', 'Image not available for sharing');
      }
    } catch (error) {
      logger.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share design');
    }
  }, []);

  const handleItemPress = useCallback((item: TattooGeneration) => {
    setSelectedItem(item);
    // Could navigate to detail view here
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: TattooGeneration }) => (
      <HistoryItem
        item={item}
        onPress={handleItemPress}
        onDelete={handleDelete}
        onShare={handleShare}
        colors={colors}
      />
    ),
    [handleItemPress, handleDelete, handleShare, colors]
  );

  const renderEmpty = useMemo(
    () => (
      <View className="flex-1 items-center justify-center py-20">
        <Text
          className="text-xl font-semibold mb-2"
          style={{ color: colors.text }}
        >
          No designs yet
        </Text>
        <Text
          className="text-base text-center px-8"
          style={{ color: colors.textSecondary }}
        >
          Generate your first tattoo design to see it here
        </Text>
      </View>
    ),
    [colors]
  );

  const renderFooter = useMemo(
    () =>
      loading && generations.length > 0 ? (
        <View className="py-4">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null,
    [loading, generations.length, colors.primary]
  );

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      accessibilityLabel="History screen"
    >
      {/* Search Bar */}
      <View
        className="px-4 pt-4 pb-2"
        style={{ backgroundColor: colors.surface }}
      >
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search designs..."
          placeholderTextColor={colors.textSecondary}
          className="p-3 rounded-xl"
          style={{
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.border,
            borderWidth: 1,
          }}
          accessibilityLabel="Search designs"
          accessibilityRole="search"
        />
      </View>

      {/* List */}
      {loading && generations.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            className="mt-4"
            style={{ color: colors.textSecondary }}
          >
            Loading history...
          </Text>
        </View>
      ) : (
        <FlashList
          data={generations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={100}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 20,
          }}
        />
      )}
    </View>
  );
};

export const HistoryScreen: React.FC = () => {
  return (
    <ProtectedRoute requireSubscription={false}>
      <HistoryContent />
    </ProtectedRoute>
  );
};
