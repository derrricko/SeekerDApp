const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    extraNodeModules: {
      assert: require.resolve('empty-module'),
      http: require.resolve('empty-module'),
      https: require.resolve('empty-module'),
      os: require.resolve('empty-module'),
      url: require.resolve('empty-module'),
      zlib: require.resolve('empty-module'),
      path: require.resolve('empty-module'),
      fs: require.resolve('empty-module'),
      net: require.resolve('empty-module'),
      tls: require.resolve('empty-module'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('readable-stream'),
      buffer: require.resolve('buffer'),
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
