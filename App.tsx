import React from 'react';
import { View, Text } from 'react-native';

console.log('[App] Starting to render');

export default function App() {
  console.log('[App] App component rendering');

  try {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000000' }}>
          Hello World - InkLine Pro Web Demo
        </Text>
        <Text style={{ fontSize: 16, color: '#666666', marginTop: 16 }}>
          If you can see this, React is working!
        </Text>
      </View>
    );
  } catch (error) {
    console.error('[App] Render error:', error);
    throw error;
  }
}

console.log('[App] Module loaded successfully');
