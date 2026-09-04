/**
 * The auth-flow chrome: slate dark header with a circular back button, then a
 * white sheet with rounded top corners holding the form.
 *
 * Extracted from LoginScreen/OtpVerifyScreen, which had this hand-rolled
 * identically. Every new Phase 1 screen (signup, forgot/reset, change password,
 * onboarding) uses it, so the flow stays visually consistent and there is one
 * place to change the look.
 */
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, shadow } from '../theme';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

export default function AuthScreenLayout({
  title,
  subtitle,
  onBack,
  children,
  scroll = true,
  footer,
}) {
  const body = <View style={styles.formInner}>{children}</View>;

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.navyDark} />

      <View style={styles.topHeader}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>

      <KeyboardAvoidingView
        style={styles.formCard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navyDark },
  topHeader: {
    paddingHorizontal: 24,
    paddingTop: STATUS_BAR_HEIGHT + 14,
    paddingBottom: 28,
    backgroundColor: colors.navyDark,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backSpacer: { height: 10 },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
  },
  formCard: {
    flex: 1,
    backgroundColor: colors.navyDarkest,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    ...shadow.card,
  },
  scrollContent: { paddingBottom: 32 },
  formInner: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
});
