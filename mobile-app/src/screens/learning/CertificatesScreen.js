/**
 * CertificatesScreen — earned certificates (FR-LRN-07).
 *
 * Port of the certificate list in `front-end/src/pages/Certificate.jsx`, minus
 * its canvas/QR rendering pipeline. The server already returns a
 * `verificationUrl` for the public web page, so "Verify" opens that instead of
 * redrawing the certificate natively — one canonical verification surface,
 * and no html2canvas equivalent to maintain on mobile.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SkeletonBox from '../../components/SkeletonBox';
import { getMyCertificates } from '../../api/certificates';

function AnimatedSection({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function PressScale({ onPress, style, children, hitSlop }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} hitSlop={hitSlop}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CertificatesScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getMyCertificates();
      setCerts(res?.certificates || []);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not load certificates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              borderColor: themeColors.border,
            },
          ]}
        >
          <Feather name="arrow-left" size={19} color={themeColors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Your achievements</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Certificates</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primaryBright}
            colors={[themeColors.primaryBright]}
          />
        }
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            {[0, 1].map((i) => (
              <SkeletonBox key={i} width="100%" height={168} borderRadius={18} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Feather name="alert-triangle" size={26} color={themeColors.danger} />
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{error}</Text>
          </View>
        ) : certs.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="award" size={30} color={themeColors.iconMuted} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No certificates yet</Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              Complete a stage assessment or finish a course to earn your first one.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {certs.map((c, idx) => (
              <AnimatedSection key={c.certificateId} delay={Math.min(idx * 60, 300)}>
              <View
                style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.seal, { backgroundColor: themeColors.pillBg }]}>
                    <Feather name="award" size={19} color={themeColors.primaryBright} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.certTitle, { color: themeColors.text }]} numberOfLines={2}>
                      {c.certificateTitle || c.certificateType}
                    </Text>
                    <Text style={[styles.certMeta, { color: themeColors.textMuted }]}>
                      Issued {formatDate(c.issueDate)}
                      {c.stage ? ` · ${c.stage}` : ''}
                    </Text>
                  </View>
                </View>

                {!!c.readinessBand && (
                  <View style={[styles.bandPill, { backgroundColor: themeColors.pillBg }]}>
                    <Text style={[styles.bandText, { color: themeColors.primaryBright }]}>{c.readinessBand}</Text>
                  </View>
                )}

                {Array.isArray(c.validatedSkills) && c.validatedSkills.length > 0 && (
                  <View style={styles.skills}>
                    {c.validatedSkills.slice(0, 6).map((s, i) => (
                      <View
                        key={`${c.certificateId}-${i}`}
                        style={[styles.skillChip, { borderColor: themeColors.border }]}
                      >
                        <Text style={[styles.skillText, { color: themeColors.textMuted }]}>
                          {typeof s === 'string' ? s : s?.name || s?.skill || ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={[styles.cardFoot, { borderTopColor: themeColors.border }]}>
                  <Text style={[styles.certId, { color: themeColors.textMuted }]} numberOfLines={1}>
                    {c.certificateId}
                  </Text>

                  <View style={styles.actions}>
                    <PressScale
                      hitSlop={8}
                      onPress={() =>
                        Share.share({
                          message: `${c.certificateTitle || 'My certificate'} — verify at ${c.verificationUrl}`,
                        }).catch(() => {})
                      }
                      style={[styles.iconBtn, { borderColor: themeColors.border }]}
                    >
                      <Feather name="share-2" size={14} color={themeColors.text} />
                    </PressScale>

                    <PressScale
                      onPress={() => c.verificationUrl && Linking.openURL(c.verificationUrl).catch(() => {})}
                      style={[styles.verifyBtn, { backgroundColor: themeColors.primaryBright }]}
                    >
                      <Text style={styles.verifyText}>Verify</Text>
                      <Feather name="external-link" size={12} color="#FFFFFF" />
                    </PressScale>
                  </View>
                </View>
              </View>
              </AnimatedSection>
            ))}
          </View>
        )}
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

  scroll: { padding: 20, paddingBottom: 40 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  seal: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  certTitle: { fontSize: 15.5, fontWeight: '800', lineHeight: 21 },
  certMeta: { fontSize: 11.5, fontWeight: '600', marginTop: 3 },

  bandPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4, marginTop: 12 },
  bandText: { fontSize: 11, fontWeight: '800' },

  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  skillChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  skillText: { fontSize: 10.5, fontWeight: '600' },

  cardFoot: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, marginTop: 14, paddingTop: 12,
  },
  certId: { flex: 1, fontSize: 10.5, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  verifyText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
