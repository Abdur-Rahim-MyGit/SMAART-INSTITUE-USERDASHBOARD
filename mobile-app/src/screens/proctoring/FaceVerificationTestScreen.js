import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import ScreenContainer from '../../components/ScreenContainer';
import AppButton from '../../components/AppButton';
import { colors } from '../../theme';
import * as facePipeline from '../../facepipeline/onnxFacePipeline';

/**
 * Standalone test harness for the on-device face-verification pipeline
 * (Phase 3 of the roadmap doc, Section 5.3 — FR-PROC-02/03). Register your
 * face, then verify against it, entirely offline against the local models.
 *
 * Not yet wired to a real proctoring session (registration/verification are
 * scoped server-side to a live exam attempt — see src/api/proctoring.js) —
 * this screen proves the pipeline itself works before that plumbing exists.
 *
 * ⚠️ This screen has not been run on a physical device or emulator (this
 * environment has no Android/iOS SDK) — see mobile-app/README.md's
 * "Known verification gaps" section before treating it as done.
 */
export default function FaceVerificationTestScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput({});
  const cameraRef = useRef(null);

  const [modelState, setModelState] = useState({ loading: false, progress: 0, ready: facePipeline.isReady() });
  const [registration, setRegistration] = useState(null); // { embedding, qualityScore, ... }
  const [status, setStatus] = useState(''); // free-text progress/result line
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null); // last verifyFace() result

  const loadModels = useCallback(async () => {
    setModelState((s) => ({ ...s, loading: true, progress: 0 }));
    try {
      await facePipeline.initPipeline((pct, msg) => {
        setModelState((s) => ({ ...s, progress: pct }));
        if (msg) setStatus(msg);
      });
      setModelState({ loading: false, progress: 100, ready: true });
      setStatus('Models ready.');
    } catch (err) {
      setModelState((s) => ({ ...s, loading: false }));
      setStatus(`Failed to load models: ${err.message}`);
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    const result = await photoOutput.capturePhotoToFile({});
    const path = result.filePath;
    return path.startsWith('file://') ? path : `file://${path}`;
  }, [photoOutput]);

  const handleRegister = useCallback(async () => {
    setBusy(true);
    setStatus('Capturing frames — hold still and face the camera...');
    try {
      const result = await facePipeline.registerFace(capturePhoto, {
        onFrameCaptured: (count, total) => setStatus(`Captured frame ${count}/${total}`),
        onQualityIssue: (issues) => setStatus(issues[0] || 'Adjust position...'),
      });
      setRegistration(result);
      setLastResult(null);
      setStatus(`Registered — quality ${result.qualityScore}/100, confidence ${(result.confidence * 100).toFixed(1)}%`);
    } catch (err) {
      setStatus(`Registration failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }, [capturePhoto]);

  const handleVerify = useCallback(async () => {
    if (!registration) return;
    setBusy(true);
    setStatus('Verifying...');
    try {
      const uri = await capturePhoto();
      const result = await facePipeline.verifyFace(uri, registration.embedding);
      setLastResult(result);
      setStatus(`${result.status} — similarity ${(result.similarity * 100).toFixed(1)}%`);
    } catch (err) {
      setStatus(`Verification failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }, [registration, capturePhoto]);

  if (!hasPermission) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Camera Permission Needed</Text>
        <Text style={styles.subtitle}>
          Proctored assessments verify your identity via the camera (FR-PROC-01). Grant access to continue.
        </Text>
        <AppButton title="Grant Camera Access" onPress={requestPermission} />
      </ScreenContainer>
    );
  }

  if (!device) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>No front camera found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Face Verification Test</Text>
      <Text style={styles.subtitle}>Standalone test of the on-device SCRFD + ArcFace pipeline.</Text>

      <View style={styles.cameraBox}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          isActive={true}
          device={device}
          outputs={[photoOutput]}
        />
      </View>

      {!modelState.ready ? (
        <>
          <AppButton
            title={modelState.loading ? `Loading models... ${modelState.progress}%` : 'Download & Load Models'}
            onPress={loadModels}
            loading={modelState.loading}
          />
          <Text style={styles.hint}>
            First run downloads ~178MB (SCRFD + ArcFace R50) from EXPO_PUBLIC_MODEL_BASE_URL — see .env.example.
          </Text>
        </>
      ) : (
        <>
          <AppButton
            title={registration ? 'Re-register Face (5 frames)' : 'Register Face (5 frames)'}
            onPress={handleRegister}
            loading={busy && !lastResult}
            disabled={busy}
          />
          <AppButton title="Verify Face" onPress={handleVerify} loading={busy} disabled={busy || !registration} variant="secondary" />
        </>
      )}

      {busy ? <ActivityIndicator style={{ marginTop: 12 }} color={colors.navy} /> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}

      {lastResult ? (
        <View style={styles.resultCard}>
          <Text style={[styles.resultStatusText, { color: lastResult.status === 'verified' ? colors.accent : colors.danger }]}>
            {lastResult.status.toUpperCase()}
          </Text>
          <Text style={styles.row}>Similarity: {(lastResult.similarity * 100).toFixed(1)}%</Text>
          <Text style={styles.row}>Threshold: {(facePipeline.VERIFICATION_COSINE_THRESHOLD * 100).toFixed(0)}%</Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: 16 },
  cameraBox: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 16,
  },
  hint: { fontSize: 12, color: colors.muted, marginTop: 4 },
  status: { fontSize: 13, color: colors.text, marginTop: 12, textAlign: 'center' },
  resultCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 10,
    backgroundColor: colors.grey,
    borderWidth: 1,
    borderColor: colors.light,
  },
  row: { fontSize: 14, color: colors.text, marginTop: 4 },
  resultStatusText: { fontSize: 16, fontWeight: '700' },
});
