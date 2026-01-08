module.exports = function(api) {
  api.cache(true);
  const plugins = [];

  // NativeWind causes build failures on web with Expo SDK 54
  // For web demo, className props will be ignored (use inline styles instead)
  if (process.env.EXPO_PUBLIC_WEB_DEMO !== 'true') {
    plugins.push('nativewind/babel');
  }

  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
