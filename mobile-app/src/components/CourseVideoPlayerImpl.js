/**
 * Real video playback for course modules.
 *
 * DO NOT IMPORT THIS DIRECTLY — go through `./CourseVideoPlayer`, which wraps
 * it in a guarded require. This file imports `expo-video` at module scope, so
 * importing it from a screen that loads at startup crashes the whole app on any
 * binary that predates the native module. See the wrapper for the full note.
 *
 * Replaces the placeholder that used to sit in the course modal: a play button
 * that flipped a boolean, showed a spinner and the hardcoded string "05:42"
 * forever. Nothing was ever loaded or streamed, and no progress was recorded.
 *
 * Built on `expo-video` (SDK 57). Two behaviours are load-bearing and easy to
 * get wrong:
 *
 *  1. `timeUpdateEventInterval` defaults to 0, which means the `timeUpdate`
 *     event NEVER fires. Progress tracking is silently dead without setting it,
 *     with no error to point at. It is set in the player setup below.
 *
 *  2. Watched position is a high-water mark, not the playhead. Scrubbing
 *     backwards to re-watch a section must not revoke credit the student has
 *     already earned — this mirrors the server, which stores `last_timestamp`
 *     the same way.
 *
 * Progress is reported through `onProgress` rather than written here, so the
 * screen owns the API contract and this component stays a pure player.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

/** How often an in-flight video checkpoints to the server, in ms. */
const SAVE_INTERVAL_MS = 5000;
/** Fraction of the video that counts as "watched". Matches the web player. */
const COMPLETE_AT = 0.95;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CourseVideoPlayer({
  source,
  startAt = 0,
  alreadyCompleted = false,
  onProgress,
  onComplete,
  accent = '#045C9A',
}) {
  const viewRef = useRef(null);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  const player = useVideoPlayer(source || null, (p) => {
    // Without this the `timeUpdate` event never fires — see the header note.
    p.timeUpdateEventInterval = 1;
    p.loop = false;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const [displayTime, setDisplayTime] = useState(startAt || 0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [controlsShown, setControlsShown] = useState(true);

  const didResume = useRef(false);
  const lastSavedAt = useRef(0);
  // Mirror of what we would report, kept in a ref so the unmount flush never
  // touches `player` — by then the native object may already be released.
  //
  // `completed` is seeded from the saved server state, NOT hardcoded false.
  // The unmount flush below fires unconditionally, and the server `$set`s
  // whatever it receives — so opening an already-watched step and closing it
  // without pressing play used to report `completed: false` and permanently
  // erase that step's completion. Progress must never move backwards.
  const snapshot = useRef({
    currentTime: startAt || 0,
    maxWatchedTime: startAt || 0,
    duration: 0,
    completed: Boolean(alreadyCompleted),
  });

  const report = useCallback(() => {
    if (!onProgress) return;
    onProgress({ ...snapshot.current });
  }, [onProgress]);

  // Resume where the student left off, once the media is actually ready.
  // Seeking before `readyToPlay` is a no-op — duration is still 0.
  useEffect(() => {
    if (status !== 'readyToPlay' || didResume.current) return;
    didResume.current = true;
    const total = player.duration || 0;
    setDuration(total);
    snapshot.current.duration = total;
    if (startAt > 1 && total > 0 && startAt < total - 1) {
      player.currentTime = startAt;
      setDisplayTime(startAt);
    }
  }, [status, startAt, player]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const total = player.duration || snapshot.current.duration || 0;
    setDisplayTime(currentTime);
    if (total && total !== duration) setDuration(total);

    snapshot.current.currentTime = currentTime;
    snapshot.current.duration = total;
    if (currentTime > snapshot.current.maxWatchedTime) {
      snapshot.current.maxWatchedTime = currentTime;
    }

    if (!snapshot.current.completed && total > 0 && snapshot.current.maxWatchedTime / total >= COMPLETE_AT) {
      snapshot.current.completed = true;
      report();
      onComplete?.();
      return;
    }

    const now = Date.now();
    if (now - lastSavedAt.current >= SAVE_INTERVAL_MS) {
      lastSavedAt.current = now;
      report();
    }
  });

  useEventListener(player, 'playToEnd', () => {
    const total = player.duration || snapshot.current.duration || 0;
    snapshot.current.maxWatchedTime = total || snapshot.current.maxWatchedTime;
    snapshot.current.currentTime = total;
    if (!snapshot.current.completed) {
      snapshot.current.completed = true;
      onComplete?.();
    }
    report();
  });

  // Checkpoint whenever playback stops, and once more on unmount, so closing
  // the modal mid-video still records where the student got to.
  //
  // `report` is re-created whenever the parent's `onProgress` identity changes,
  // so both effects read it through a ref. Depending on it directly would make
  // the cleanup run on every such change — firing a spurious "unmount" save on
  // each re-render rather than only when the player actually goes away.
  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  useEffect(() => {
    if (!isPlaying && didResume.current) reportRef.current();
  }, [isPlaying]);

  useEffect(() => () => reportRef.current(), []);

  const togglePlay = useCallback(() => {
    if (player.playing) player.pause();
    else player.play();
    setControlsShown(true);
  }, [player]);

  const seekTo = useCallback(
    (ratio) => {
      const total = player.duration || 0;
      if (!total) return;
      const target = Math.max(0, Math.min(total - 0.5, total * ratio));
      player.currentTime = target;
      setDisplayTime(target);
      snapshot.current.currentTime = target;
    },
    [player]
  );

  const pct = duration > 0 ? Math.min(1, displayTime / duration) : 0;
  const watchedPct = duration > 0 ? Math.min(1, snapshot.current.maxWatchedTime / duration) : 0;

  if (!source) {
    return (
      <Animated.View style={[styles.shell, styles.centered, { opacity: fadeIn }]}>
        <Feather name="video-off" size={26} color="rgba(255,255,255,0.5)" />
        <Text style={styles.stateText}>No video attached to this module yet</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.shell, { opacity: fadeIn }]}>
      <VideoView
        ref={viewRef}
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        // expo-video 57 replaced the old `allowsFullscreen` boolean with
        // `fullscreenOptions`; the old prop was silently ignored.
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture={false}
      />

      {/* Tap surface toggles the control overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setControlsShown((v) => !v)} />

      {status === 'loading' && (
        <View style={[StyleSheet.absoluteFill, styles.centered, styles.scrim]} pointerEvents="none">
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.stateText}>Loading video…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={[StyleSheet.absoluteFill, styles.centered, styles.scrim]}>
          <Feather name="alert-triangle" size={24} color="#FCA5A5" />
          <Text style={styles.stateText}>This video could not be loaded</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: accent }]}
            onPress={() => {
              didResume.current = false;
              // `replace` loads synchronously on the main thread and is flagged
              // for deprecation in expo-video 57; the async form avoids the
              // UI stall while the asset is fetched.
              player.replaceAsync(source).catch(() => {});
            }}
          >
            <Feather name="refresh-cw" size={13} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {controlsShown && status === 'readyToPlay' && (
        <>
          {/* Centered play overlay (semi-transparent blur overlay) */}
          <Pressable style={[StyleSheet.absoluteFill, styles.centered, styles.playOverlay]} onPress={togglePlay}>
            <View style={styles.playCircle}>
              <Feather
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 0 : 4 }}
              />
            </View>
          </Pressable>

          <View style={styles.controlBar}>
            {/* Play/Pause Button in Control Bar */}
            <Pressable onPress={togglePlay} hitSlop={12} style={styles.controlBarPlayBtn}>
              <Feather name={isPlaying ? 'pause' : 'play'} size={14} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.timeText}>{formatTime(displayTime)}</Text>

            <Pressable
              style={styles.trackHit}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              onPress={(e) => trackWidth > 0 && seekTo(e.nativeEvent.locationX / trackWidth)}
            >
              <View style={styles.trackContainer}>
                <View style={styles.track}>
                  {/* Furthest-watched sits under the playhead so a student can see
                      what they have already covered after scrubbing back. */}
                  <View style={[styles.trackWatched, { width: `${watchedPct * 100}%` }]} />
                  <View style={[styles.trackFill, { width: `${pct * 100}%`, backgroundColor: accent }]} />
                </View>
                {/* Custom Playhead thumb */}
                <View
                  style={[
                    styles.trackThumb,
                    {
                      left: `${pct * 100}%`,
                      backgroundColor: '#FFFFFF',
                      borderColor: accent,
                    },
                  ]}
                />
              </View>
            </Pressable>

            <Text style={styles.timeText}>{formatTime(duration)}</Text>

            <Pressable hitSlop={8} onPress={() => viewRef.current?.enterFullscreen()}>
              <Feather name="maximize" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0B1220',
    position: 'relative',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scrim: {
    backgroundColor: 'rgba(11,18,32,0.72)',
  },
  stateText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 2,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  playOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  controlBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 18, 32, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  controlBarPlayBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 32,
  },
  trackHit: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  trackContainer: {
    height: 20,
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
    width: '100%',
  },
  trackWatched: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  trackThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    marginLeft: -6,
  },
});
