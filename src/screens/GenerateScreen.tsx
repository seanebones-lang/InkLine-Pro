import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { generateTattooDesignWithLineart, processImageForAPI } from '../services/aiService';

const GenerateContent: React.FC = () => {
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [generatedImageUri, setGeneratedImageUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  const requestImagePickerPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to use this feature.'
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1, // High quality for pro tattooers (4K+ support)
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setGeneratedSvg(null); // Clear previous result
        setGeneratedImageUri(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1, // High quality for pro tattooers
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setGeneratedSvg(null); // Clear previous result
        setGeneratedImageUri(null);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const validateInputs = (): boolean => {
    if (!description.trim() && !selectedImage) {
      Alert.alert(
        'Input Required',
        'Please provide either a description or upload an image (or both).'
      );
      return false;
    }

    if (description.trim().length < 3) {
      Alert.alert(
        'Description Too Short',
        'Please provide a more detailed description (at least 3 characters).'
      );
      return false;
    }

    return true;
  };

  const handleGenerate = async () => {
    if (!validateInputs()) return;

    setIsGenerating(true);
    setProgress('Processing image...');
    setGeneratedSvg(null);

    try {
      // Process image if provided (compress/resize for API efficiency)
      let processedImageUri = selectedImage || undefined;
      if (selectedImage) {
        setProgress('Optimizing image for API...');
        processedImageUri = await processImageForAPI(selectedImage, 2048, 2048, 0.9);
      }

      setProgress('Generating design with Grok...');
      
      // Generate tattoo design with full pipeline
      const result = await generateTattooDesignWithLineart({
        description: description.trim() || undefined,
        imageUri: processedImageUri,
        highRes: true, // Enable high-res output for pro tattooers
      });

      setProgress('Finalizing preview...');
      setGeneratedSvg(result.svg);
      // Create data URI for image display
      setGeneratedImageUri(`data:image/png;base64,${result.base64}`);
      setProgress('');
    } catch (error: any) {
      console.error('Generation error:', error);
      Alert.alert(
        'Generation Failed',
        error.message || 'Failed to generate tattoo design. Please try again.'
      );
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    setDescription('');
    setSelectedImage(null);
    setGeneratedSvg(null);
    setGeneratedImageUri(null);
    setProgress('');
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView 
        className="flex-1" 
        contentContainerClassName="p-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Generate Tattoo Design
          </Text>
          <Text className="text-base text-gray-600">
            Create precise linework designs with AI assistance
          </Text>
        </View>

        {/* Text Input */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Description
          </Text>
          <TextInput
            className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 text-gray-900"
            placeholder="Describe your tattoo design idea..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isGenerating}
          />
          <Text className="text-sm text-gray-500 mt-2">
            Be specific about style, elements, and placement
          </Text>
        </View>

        {/* Image Picker Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Reference Image (Optional)
          </Text>
          
          {selectedImage ? (
            <View className="mb-4">
              <Image
                source={{ uri: selectedImage }}
                className="w-full h-64 rounded-xl mb-3"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setSelectedImage(null)}
                className="bg-red-500 p-3 rounded-xl"
                disabled={isGenerating}
              >
                <Text className="text-white text-center font-semibold">
                  Remove Image
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={pickImageFromGallery}
                className="flex-1 bg-blue-500 p-4 rounded-xl"
                disabled={isGenerating}
              >
                <Text className="text-white text-center font-semibold">
                  📷 Gallery
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={takePhoto}
                className="flex-1 bg-green-500 p-4 rounded-xl"
                disabled={isGenerating}
              >
                <Text className="text-white text-center font-semibold">
                  📸 Camera
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={handleGenerate}
          className={`p-4 rounded-xl mb-6 ${
            isGenerating ? 'bg-gray-400' : 'bg-purple-600'
          }`}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="white" className="mr-2" />
              <Text className="text-white text-center font-bold text-lg">
                {progress || 'Generating...'}
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Generate Design
            </Text>
          )}
        </TouchableOpacity>

        {/* Progress Indicator */}
        {isGenerating && progress && (
          <View className="mb-6">
            <Text className="text-sm text-gray-600 text-center">{progress}</Text>
          </View>
        )}

        {/* Generated Design Preview */}
        {generatedImageUri && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Generated Design
              </Text>
              <TouchableOpacity
                onPress={clearAll}
                className="bg-gray-200 px-4 py-2 rounded-lg"
              >
                <Text className="text-gray-700 font-semibold">Clear</Text>
              </TouchableOpacity>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 items-center justify-center min-h-[400px]">
              <Image
                source={{ uri: generatedImageUri }}
                className="w-full h-[400px] rounded-lg"
                resizeMode="contain"
              />
            </View>
            
            <Text className="text-sm text-gray-500 mt-3 text-center">
              High-resolution linework design ready for tattoo application
            </Text>
          </View>
        )}

        {/* Info Section */}
        {!generatedImageUri && !isGenerating && (
          <View className="mt-6 p-4 bg-blue-50 rounded-xl">
            <Text className="text-sm text-blue-900 font-semibold mb-2">
              💡 Pro Tips:
            </Text>
            <Text className="text-sm text-blue-800 mb-1">
              • Provide detailed descriptions for best results
            </Text>
            <Text className="text-sm text-blue-800 mb-1">
              • Upload reference images for style matching
            </Text>
            <Text className="text-sm text-blue-800">
              • Designs are optimized for 4K+ resolution
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export const GenerateScreen: React.FC = () => {
  return (
    <ProtectedRoute requireSubscription={true}>
      <GenerateContent />
    </ProtectedRoute>
  );
};
