// Metro bundler configuration for React Native
// Optimized for bundle size and performance

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimize transformer
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
    compress: {
      // Keep console for debugging web demo
      drop_console: false,
      // Remove debugger statements
      drop_debugger: true,
      // Dead code elimination
      dead_code: true,
      // Remove unused code
      unused: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true, // Enable inline requires for better tree shaking
    },
  }),
};

// Optimize resolver
config.resolver = {
  ...config.resolver,
  // Enable source maps only in development
  sourceExts: [...config.resolver.sourceExts],
};

module.exports = config;
