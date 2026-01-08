import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <Animated.View entering={FadeIn.duration(300)} className="w-full max-w-md">
        <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
        </Text>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mb-4">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 text-gray-900"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mb-6">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignUp ? 'password-new' : 'password'}
            className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 text-gray-900"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            className="w-full py-4 bg-blue-600 rounded-xl items-center mb-4"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            className="py-3 items-center"
          >
            <Text className="text-gray-600">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text className="text-blue-600 font-semibold">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};
