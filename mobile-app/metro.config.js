const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Windows: Metro tries to watch ReactAndroid resource dirs
// (e.g. values-hu, values-de, ...) and hits the OS FSWatcher limit.
// These are Gradle/build-time files — they never need to be watched.
config.resolver = config.resolver || {};

// Explicitly block the ReactAndroid subtree from being crawled/watched
config.resolver.blockList = [
  ...(config.resolver.blockList ? [config.resolver.blockList].flat() : []),
  /node_modules[/\\]react-native[/\\]ReactAndroid[/\\].*/,
];

module.exports = config;
