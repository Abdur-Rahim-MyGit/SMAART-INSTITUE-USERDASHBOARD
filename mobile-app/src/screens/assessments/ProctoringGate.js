/**
 * ProctoringGate — the pre-exam identity check, shown between "assessment
 * loaded" and "first question." Reuses the exact camera + on-device pipeline
 * pattern already proved out in screens/proctoring/FaceVerificationTestScreen.js,
 * wired to a real exam attempt via useProctoringSession instead of running
 * standalone.
 */
import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const PHASE_COPY = {
  idle: 'Face the camera in good light, then start the check.',
  starting: 'Starting your proctoring session…',
  registering: 'Hold still — capturing frames…',
  error: 'Something went wrong.',
};

export default function ProctoringGate({ session, accent, onCancel }) {
  const { colors: themeColors } = useTheme();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput({});
  const startedRef = useRef(false);

  const capturePhoto = useCallback(async () => {
    const result = await photoOutput.capturePhotoToFile({}, {});
    const path = result.filePath;
    return path.startsWith('file://') ? path : `file://${path}`;
  }, [photoOutput]);

  const beginSetup = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    session.start(capturePhoto).then((ok) => {
      if (!ok) startedRef.current = false;
    });
  }, [session, capturePhoto]);

  if (!hasPermission) {
    return (
      <View style={[styles.wrap, { backgroundColor: themeColors.bg }]}>
        <Feather name="camera" size={30} color={accent} />
        <Text style={[styles.title, { color: themeColors.text }]}>Camera access needed</Text>
        <Text style={[styles.body, { color: themeColors.textMuted }]}>
          This is a proctored assessment — we verify it's really you before you begin.
        </Text>
        <Pressable style={[styles.btn, { backgroundColor: accent }]} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant camera access</Text>
        </Pressable>
        <Pressable onPress={onCancel} hitSlop={10} style={styles.cancelWrap}>
          <Text style={[styles.cancel, { color: themeColors.textMuted }]}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.wrap, { backgroundColor: themeColors.bg }]}>
        <Feather name="alert-triangle" size={30} color={themeColors.danger} />
        <Text style={[styles.title, { color: themeColors.text }]}>No front camera found</Text>
        <Text style={[styles.body, { color: themeColors.textMuted }]}>
          A front-facing camera is required for proctored assessments on this device.
        </Text>
        <Pressable style={[styles.btn, { backgroundColor: accent }]} onPress={onCancel}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const { phase } = session;
  const busy = phase === 'starting' || phase === 'loading-models' || phase === 'registering';
  const canStart = phase === 'idle' || phase === 'error';
  const bodyCopy = phase === 'loading-models'
    ? `Preparing verification models… ${session.modelProgress}%`
    : phase === 'registering'
      ? (session.registerStatus || PHASE_COPY.registering)
      : phase === 'error'
        ? (session.error || PHASE_COPY.error)
        : PHASE_COPY[phase] || '';

  return (
    <View style={[styles.wrap, { backgroundColor: themeColors.bg }]}>
      <View style={styles.cameraBox}>
        <Camera style={StyleSheet.absoluteFill} isActive device={device} outputs={[photoOutput]} />
      </View>

      <Text style={[styles.title, { color: themeColors.text }]}>Identity check</Text>
      <Text style={[styles.body, { color: themeColors.textMuted }]}>{bodyCopy}</Text>

      {busy ? <ActivityIndicator style={styles.spinner} color={accent} /> : null}

      {phase === 'idle' && (
        <Text style={[styles.timerNote, { color: themeColors.textMuted }]}>
          Your exam timer starts now and keeps running during this check.
        </Text>
      )}

      {canStart ? (
        <Pressable style={[styles.btn, { backgroundColor: accent }]} onPress={beginSetup}>
          <Text style={styles.btnText}>{phase === 'error' ? 'Try again' : 'Start identity check'}</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={onCancel} hitSlop={10} style={styles.cancelWrap}>
        <Text style={[styles.cancel, { color: themeColors.textMuted }]}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  cameraBox: { width: 220, height: 220, borderRadius: 110, overflow: 'hidden', backgroundColor: '#000', marginBottom: 22 },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  body: { fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
  spinner: { marginTop: 14 },
  timerNote: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 10, paddingHorizontal: 12 },
  btn: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, marginTop: 18 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  cancelWrap: { marginTop: 16, padding: 4 },
  cancel: { fontSize: 12.5, fontWeight: '700' },
});
