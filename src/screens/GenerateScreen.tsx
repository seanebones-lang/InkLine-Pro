import React from 'react';
import { View, Text } from 'react-native';
import { ProtectedRoute } from '../components/ProtectedRoute';

const GenerateContent: React.FC = () => {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold text-gray-900">Generate</Text>
      <Text className="text-gray-600 mt-2">Premium feature unlocked</Text>
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
