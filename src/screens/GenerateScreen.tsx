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
  Modal,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { generateTattooDesignWithLineart, processImageForAPI } from '../services/aiService';
import { LineworkViewer } from '../components/LineworkViewer';
import {
  printViaBluetooth,
  printViaWiFi,
  scanBluetoothPrinters,
  shareDesign,
  getAvailablePrintOptions,
  exportAsPNG300DPI,
  BluetoothDevice,
} from '../services/printService';

const GenerateContent: React.FC = () => {
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [generatedImageUri, setGeneratedImageUri] = useState<string | null>(null);
  const [generatedBase64, setGeneratedBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  
  // Print states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printOptions, setPrintOptions] = useState(getAvailablePrintOptions());

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
      // Store base64 for printing/export
      setGeneratedBase64(result.base64);
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
    setGeneratedBase64(null);
    setProgress('');
  };

  // Print functions
  const handlePrint = () => {
    if (!generatedBase64) {
      Alert.alert('Error', 'No design to print');
      return;
    }
    setShowPrintModal(true);
    if (printOptions.bluetooth) {
      scanForBluetoothDevices();
    }
  };

  const scanForBluetoothDevices = async () => {
    setIsScanning(true);
    try {
      const devices = await scanBluetoothPrinters();
      setBluetoothDevices(devices);
      if (devices.length === 0) {
        Alert.alert('No Devices', 'No Bluetooth printers found');
      }
    } catch (error: any) {
      Alert.alert('Scan Error', error.message || 'Failed to scan for printers');
    } finally {
      setIsScanning(false);
    }
  };

  const handleBluetoothPrint = async (deviceAddress: string) => {
    if (!generatedBase64) return;

    setIsPrinting(true);
    try {
      // Export as PNG first
      const pngUri = await exportAsPNG300DPI(generatedBase64);
      await printViaBluetooth(deviceAddress, pngUri);
      Alert.alert('Success', 'Design sent to printer');
      setShowPrintModal(false);
    } catch (error: any) {
      Alert.alert('Print Error', error.message || 'Failed to print');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleWiFiPrint = async () => {
    if (!generatedBase64) return;

    setIsPrinting(true);
    try {
      await printViaWiFi(generatedBase64);
      setShowPrintModal(false);
    } catch (error: any) {
      Alert.alert('Print Error', error.message || 'Failed to print');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShare = async () => {
    if (!generatedBase64) return;

    try {
      await shareDesign(generatedBase64, 'tattoo-design.png');
    } catch (error: any) {
      Alert.alert('Share Error', error.message || 'Failed to share');
    }
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
        {generatedImageUri && generatedBase64 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Generated Design
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handlePrint}
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                  disabled={isPrinting}
                >
                  <Text className="text-white font-semibold">🖨️ Print</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={clearAll}
                  className="bg-gray-200 px-4 py-2 rounded-lg"
                >
                  <Text className="text-gray-700 font-semibold">Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 items-center justify-center min-h-[400px]">
              <LineworkViewer
                base64Image={generatedBase64}
                width={1200}
                height={1200}
                showDots={true}
                showDashes={true}
              />
            </View>
            
            <Text className="text-sm text-gray-500 mt-3 text-center">
              High-resolution linework design ready for tattoo application (300 DPI)
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

        {/* Print Modal */}
        <Modal
          visible={showPrintModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPrintModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-gray-900">Print Design</Text>
                <TouchableOpacity
                  onPress={() => setShowPrintModal(false)}
                  className="p-2"
                >
                  <Text className="text-2xl text-gray-500">×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* WiFi/AirPrint Option */}
                {printOptions.wifi && (
                  <TouchableOpacity
                    onPress={handleWiFiPrint}
                    disabled={isPrinting}
                    className="bg-blue-500 p-4 rounded-xl mb-4"
                  >
                    <Text className="text-white text-center font-bold text-lg">
                      📡 Print via WiFi/AirPrint
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Bluetooth Option */}
                {printOptions.bluetooth && (
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-lg font-semibold text-gray-900">
                        Bluetooth Printers
                      </Text>
                      <TouchableOpacity
                        onPress={scanForBluetoothDevices}
                        disabled={isScanning}
                        className="bg-gray-200 px-3 py-1 rounded-lg"
                      >
                        {isScanning ? (
                          <ActivityIndicator size="small" color="#666" />
                        ) : (
                          <Text className="text-gray-700 font-semibold">Scan</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {bluetoothDevices.length > 0 ? (
                      <FlatList
                        data={bluetoothDevices}
                        keyExtractor={(item) => item.address}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            onPress={() => handleBluetoothPrint(item.address)}
                            disabled={isPrinting}
                            className="bg-gray-100 p-4 rounded-xl mb-2"
                          >
                            <Text className="text-gray-900 font-semibold">
                              {item.name}
                            </Text>
                            <Text className="text-gray-500 text-sm">
                              {item.address}
                            </Text>
                          </TouchableOpacity>
                        )}
                        scrollEnabled={false}
                      />
                    ) : (
                      <Text className="text-gray-500 text-center py-4">
                        No Bluetooth printers found. Tap "Scan" to search.
                      </Text>
                    )}
                  </View>
                )}

                {/* Share Option */}
                {printOptions.share && (
                  <TouchableOpacity
                    onPress={handleShare}
                    className="bg-green-500 p-4 rounded-xl mb-4"
                  >
                    <Text className="text-white text-center font-bold text-lg">
                      📤 Share Design
                    </Text>
                  </TouchableOpacity>
                )}

                {isPrinting && (
                  <View className="items-center py-4">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="text-gray-600 mt-2">Printing...</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
