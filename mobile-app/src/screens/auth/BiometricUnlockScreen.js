/**
 * FR-AUTH-09 — Biometric unlock.
 *
 * Shown by RootNavigator when a valid session exists but `isLocked` is true:
 * either the app just relaunched, or it came back to the foreground after being
 * away longer than AuthContext's RELOCK_AFTER_MS.
 *
 * This gate does not authenticate against the server and is not a second way
 * in — the JWT already exists in SecureStore. It decides whether the app will
 * *use* that session without a fresh fingerprint/face check, which is why the
 * escape hatch below is "Sign Out", not "Skip". Anything weaker would let a
 * thief bypass the lock by cancelling the prompt.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import PillButton from '../../components/PillButton';
import Banner from '../../components/Banner';
import { useAuth } from '../../context/AuthContext';
import { getBiometricCapability, promptBiometric } from '../../utils/biometrics';
import { colors, radius, shadow } from '../../theme';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

export default function BiometricUnlockScreen() {
  const { user, unlock, signOut } = useAuth();
  const [capability, setCapability] = useState({ available: false, enrolled: false, label: 'Biometrics' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Guards the auto-prompt so a re-render can't stack two OS dialogs.
  const autoPrompted = useRef(false);

  const attemptUnlock = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const res = await promptBiometric('Unlock SMAART Institute');
      if (res.success) {
        await unlock();
      } else if (res.error !== 'user_cancel' && res.error !== 'system_cancel') {
        setError('Could not verify. Try again, or sign out and use your password.');
      }
    } finally {
      setBusy(false);
    }
  }, [unlock]);

  useEffect(() => {
    (async () => {
      const cap = await getBiometricCapability();
      setCapability(cap);

      // If biometrics stopped working since the student opted in (sensor
      // removed, enrolment cleared, running on web), don't strand them behind a
      // prompt that can never succeed — let the session through.
      if (!cap.available || !cap.enrolled) {
        await unlock();
        return;
      }

      if (!autoPrompted.current) {
        autoPrompted.current = true;
        attemptUnlock();
      }
    })();
  }, [attemptUnlock, unlock]);

  const icon = capability.label.toLowerCase().includes('face') ? 'user-check' : 'unlock';
  const firstName = String(user?.fullName || '').split(' ')[0];

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.navyDark} />

      <View style={styles.content}>
        <View style={styles.iconRing}>
          <Feather name={icon} size={38} color={colors.primaryBright} />
        </View>

        <Text style={styles.title}>{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          Use {capability.label} to unlock your session
        </Text>

        {error ? <Banner variant="error" message={error} style={styles.banner} /> : null}

        <View style={styles.actions}>
          <PillButton
            title={`Unlock with ${capability.label}`}
            icon="unlock"
            onPress={attemptUnlock}
            loading={busy}
          />
          <Pressable onPress={signOut} style={styles.signOutBtn} hitSlop={8}>
            <Text style={styles.signOutText}>Sign out and use password</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navyDark },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: STATUS_BAR_HEIGHT,
  },
  iconRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(59,130,246,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(59,130,246,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    ...shadow.card,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.62)',
    marginTop: 8,
    textAlign: 'center',
  },
  banner: { marginTop: 22, borderRadius: radius.sm, width: '100%' },
  actions: { width: '100%', marginTop: 34 },
  signOutBtn: { alignItems: 'center', paddingVertical: 10 },
  signOutText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '700',
  },
});
