/**
 * ProctoringConsentScreen — the pre-permission explanation (FR-PROC-01).
 *
 * Shown before the OS camera prompt, never after. Two reasons, one ethical and
 * one practical:
 *
 *  - A student is about to be watched during an exam. They are entitled to know
 *    what is recorded, what leaves the device and what happens to a flag,
 *    before they agree rather than after.
 *  - On both platforms the OS permission dialog can only be asked once. A
 *    student who denies it in surprise cannot be re-prompted in-app, only sent
 *    to Settings. Explaining first is what keeps the answer an informed yes.
 *
 * The screen never blocks the attempt. Declining proceeds unproctored and the
 * server sees a session with no face events, which is itself the signal a
 * reviewer needs. Trapping a student who will not enable a camera would turn a
 * privacy choice into a lockout.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { requestCameraPermission } from '../../proctoring/permissions';

const POINTS = [
  {
    icon: 'camera',
    title: 'Your camera stays on for the attempt',
    body: 'It checks that you are present and that it is you. The video stream never leaves your phone — only the result of each check is sent.',
  },
  {
    icon: 'cpu',
    title: 'The matching runs on this device',
    body: 'Your face is compared on the phone itself. What reaches the server is a similarity number and a pass or fail, not your image.',
  },
  {
    icon: 'smartphone',
    title: 'Leaving the app is recorded',
    body: 'Switching away mid-assessment is logged, the same way switching browser tabs is on the web version.',
  },
  {
    icon: 'shield',
    title: 'A flag is not a failure',
    body: 'Flags are collected and reviewed by a person at the end. Nothing is decided automatically against you during the attempt.',
  },
];

export default function ProctoringConsentScreen({ route, navigation }) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const stage = route?.params?.stage || 'T1';

  const [requesting, setRequesting] = useState(false);

  const go = useCallback(
    (proctored) => {
      // `replace`, not `navigate`: the consent screen must not sit on the back
      // stack where a student could swipe back into it mid-exam.
      navigation.replace('AssessmentPlayer', { stage, proctored });
    },
    [navigation, stage]
  );

  const onAllow = useCallback(async () => {
    setRequesting(true);
    try {
      const result = await requestCameraPermission();
      if (result === 'granted') {
        go(true);
        return;
      }
      if (result === 'blocked') {
        Alert.alert(
          'Camera is blocked',
          'Camera access was turned off for this app. You can enable it in Settings, or continue without proctoring.',
          [
            { text: 'Continue anyway', style: 'cancel', onPress: () => go(false) },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      if (result === 'unavailable') {
        // No camera module in this build — the guarded require in
        // proctoring/permissions.js explains when that happens.
        go(false);
        return;
      }
      go(false);
    } finally {
      setRequesting(false);
    }
  }, [go]);

  const onDecline = useCallback(() => {
    Alert.alert(
      'Continue without proctoring?',
      'Your attempt will be recorded as unproctored, which your institution may treat differently when reviewing results.',
      [
        { text: 'Go back', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => go(false) },
      ]
    );
  }, [go]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="arrow-left" size={19} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Before you start</Text>
          <Text style={[styles.title, { color: colors.text }]}>How you are proctored</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {POINTS.map((p) => (
          <View
            key={p.title}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primaryBright}1A` }]}>
              <Feather name={p.icon} size={17} color={colors.primaryBright} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{p.title}</Text>
              <Text style={[styles.cardBody, { color: colors.textMuted }]}>{p.body}</Text>
            </View>
          </View>
        ))}

        <Pressable
          onPress={onAllow}
          disabled={requesting}
          style={[styles.primaryBtn, { backgroundColor: colors.primaryBright, opacity: requesting ? 0.6 : 1 }]}
        >
          {requesting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Allow camera and start</Text>
          )}
        </Pressable>

        <Pressable onPress={onDecline} disabled={requesting} style={styles.declineBtn}>
          <Text style={[styles.declineText, { color: colors.textMuted }]}>
            Continue without proctoring
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontSize: 11.5, fontWeight: '600' },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },

  scroll: { padding: 20, paddingBottom: 40, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderRadius: 16, padding: 15,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14.5, fontWeight: '800' },
  cardBody: { fontSize: 12.5, lineHeight: 18.5, marginTop: 4 },

  primaryBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  declineBtn: { paddingVertical: 14, alignItems: 'center' },
  declineText: { fontSize: 13, fontWeight: '700' },
});
