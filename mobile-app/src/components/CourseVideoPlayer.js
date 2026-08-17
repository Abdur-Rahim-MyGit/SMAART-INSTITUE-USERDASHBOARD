/**
 * CourseVideoPlayer — safe entry point for course video playback.
 *
 * WHY THIS INDIRECTION EXISTS
 * ---------------------------
 * `expo-video` is a native module. `LearningScreen` is a bottom-tab screen, so
 * it is imported during app startup — which means a plain top-level import of
 * the player pulled `expo-video` onto the boot path. On any binary compiled
 * before `expo-video` was added, that threw
 *
 *     Cannot find native module 'ExpoVideo'
 *
 * at launch and took the whole app down, not just video.
 *
 * The real implementation therefore lives in `./CourseVideoPlayerImpl`, behind
 * a guarded require. This is the same pattern already used for
 * `expo-local-authentication` in `utils/biometrics.js` and `expo-device` in
 * `utils/device.js`, and it mirrors the lazy-loading of the onnxruntime screen
 * in `navigation/AppStack.js`.
 *
 * Consequences on a binary without the native module: the app boots, courses
 * open, and every non-video step (notes, flash cards, quizzes, case studies)
 * plus all progress tracking works. Only the video frame degrades, into the
 * notice below. After a rebuild that includes `expo-video`, the real player
 * loads with no code change.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

let Impl = null;
let loadError = null;
try {
  // eslint-disable-next-line global-require
  Impl = require('./CourseVideoPlayerImpl').default;
} catch (err) {
  Impl = null;
  loadError = err;
}

/** True when the native video module is present in this binary. */
export const isVideoPlaybackAvailable = () => Impl !== null;

function VideoUnavailable() {
  const missingNativeModule = /native module/i.test(loadError?.message || '');

  return (
    <View style={styles.shell}>
      <Feather name="film" size={26} color="rgba(255,255,255,0.5)" />
      <Text style={styles.title}>Video playback unavailable</Text>
      <Text style={styles.body}>
        {missingNativeModule
          ? 'This build was compiled before video support was added. Install a fresh development build to enable playback — everything else in this course works as normal.'
          : 'The video component could not be loaded on this device.'}
      </Text>
    </View>
  );
}

export default function CourseVideoPlayer(props) {
  if (!Impl) return <VideoUnavailable />;
  return <Impl {...props} />;
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  body: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
});
