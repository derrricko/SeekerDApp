const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    extraNodeModules: {
      assert: require.resolve('./stubs/empty'),
      http: require.resolve('./stubs/empty'),
      https: require.resolve('./stubs/empty'),
      os: require.resolve('./stubs/empty'),
      url: require.resolve('./stubs/empty'),
      zlib: require.resolve('./stubs/empty'),
      path: require.resolve('./stubs/empty'),
      fs: require.resolve('./stubs/empty'),
      net: require.resolve('./stubs/empty'),
      tls: require.resolve('./stubs/empty'),
      crypto: require.resolve('./stubs/empty'),
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
