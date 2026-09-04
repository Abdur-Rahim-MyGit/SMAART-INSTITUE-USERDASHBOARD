import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { colors } from '../../theme';

export default function FaceVerificationTestScreen() {
  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Face Verification (Native Only)</Text>
        <Text style={styles.description}>
          The on-device face verification pipeline utilizes native hardware camera and ML modules 
          (VisionCamera, Skia, and ONNX Runtime).
        </Text>
        <Text style={styles.note}>
          To test camera & face verification on mobile:
          {'\n'}• Run on an Android device or emulator with: npx expo run:android
          {'\n'}• Or build an Expo Dev Client with EAS.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  note: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
});
