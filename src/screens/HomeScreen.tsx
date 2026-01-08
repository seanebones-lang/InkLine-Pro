import React from 'react';
import { View, Text } from 'react-native';

export const HomeScreen: React.FC = () => {
  return (
    <View
      className="flex-1 justify-center items-center bg-white"
      accessible={true}
      accessibilityRole="main"
      accessibilityLabel="Home screen"
    >
      <Text
        className="text-2xl font-bold text-gray-900"
        accessibilityRole="header"
      >
        Home
      </Text>
    </View>
  );
};
