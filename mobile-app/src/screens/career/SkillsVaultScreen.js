/**
 * SkillsVaultScreen — mobile port of `front-end/src/pages/SkillsVault.jsx`.
 *
 * Only the two tabs that are real, live features on web are built here:
 * Certificates and Badges (both API-backed). Flashcards ships the six static
 * quotient-definition cards web always shows — the dynamic per-course
 * flashcard mining (parsing course.learningFlow/steps/modules/days) is
 * deferred until CoursePlayer/LearningScreen grows its own flashcard step
 * UI, so that logic gets written once and shared instead of forked here.
 *
 * The web page's "Overview" tab is dead code there (no TABS entry ever
 * selects it) and is not ported. The embedded "verify any certificate by
 * ID/QR" widget is a separate lookup feature, not per-owned-certificate
 * verification, and is left as a follow-up.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
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
import { useAuth } from '../../context/AuthContext';
import SkeletonBox from '../../components/SkeletonBox';
import { getMyCertificates } from '../../api/certificates';
import { getEarnedBadges } from '../../api/badges';

const TABS = [
  { id: 'certificates', label: 'Certificates', icon: 'award' },
  { id: 'badges', label: 'Badges', icon: 'star' },
  { id: 'flashcards', label: 'Flashcards', icon: 'zap' },
];

// Mirrors SkillsVault.jsx's `defaultFlashcards` — the six quotient
// definitions shown regardless of enrollment.
const QUOTIENT_FLASHCARDS = [
  { code: 'CRQ', term: 'Cognitive Reasoning (CRQ)', definition: 'The ability to analyze, synthesize, and evaluate information to derive meaningful conclusions and solve complex problems.' },
  { code: 'SRQ', term: 'Self-Regulation (SRQ)', definition: 'The capacity to manage emotions, thoughts, and behaviors effectively across different situations and towards goals.' },
  { code: 'LQ', term: 'Learning Agility (LQ)', definition: 'The willingness and ability to learn from experience and then apply those lessons in new and first-time situations.' },
  { code: 'SIQ', term: 'Social Interaction (SIQ)', definition: 'The skill of navigating social environments with emotional intelligence, empathy, and effective communication.' },
  { code: 'PEQ', term: 'Professional Execution (PEQ)', definition: 'The competence to deliver professional outcomes with accountability, precision, and stakeholder orientation.' },
  { code: 'DAQ', term: 'Digital & AI Literacy (DAQ)', definition: 'The ability to leverage digital tools and artificial intelligence to enhance productivity and innovation.' },
];

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function titleCase(s) {
  if (!s) return '';
  return String(s).split(/[\s-_]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function SkillsVaultScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const userId = user?._id || user?.id;

  const [activeTab, setActiveTab] = useState('certificates');
  const [refreshing, setRefreshing] = useState(false);

  const [certs, setCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [certsError, setCertsError] = useState(null);

  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [badgesError, setBadgesError] = useState(null);
  const [badgeCategory, setBadgeCategory] = useState('all');

  const [flippedIndex, setFlippedIndex] = useState(null);

  const loadCerts = useCallback(async () => {
    try {
      setCertsError(null);
      const res = await getMyCertificates();
      setCerts(res?.certificates || []);
    } catch (err) {
      setCertsError(err?.data?.message || err?.message || 'Could not load certificates.');
    } finally {
      setCertsLoading(false);
    }
  }, []);

  const loadBadges = useCallback(async () => {
    if (!userId) {
      setBadgesLoading(false);
      return;
    }
    try {
      setBadgesError(null);
      const res = await getEarnedBadges(userId);
      setBadges(res?.data || []);
    } catch (err) {
      setBadgesError(err?.data?.message || err?.message || 'Could not load badges.');
    } finally {
      setBadgesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCerts();
    loadBadges();
  }, [loadCerts, loadBadges]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCerts(), loadBadges()]);
    setRefreshing(false);
  }, [loadCerts, loadBadges]);

  const badgeCategories = ['all', ...new Set(badges.map((b) => b.category).filter(Boolean))];
  const filteredBadges = badgeCategory === 'all' ? badges : badges.filter((b) => b.category === badgeCategory);

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
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Skills &amp; growth</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Skills Vault</Text>
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
        {/* Stat tiles */}
        <View style={styles.statsRow}>
          <View style={[styles.statTile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: themeColors.pillBg }]}>
              <Feather name="award" size={15} color={themeColors.primaryBright} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {certsLoading ? '—' : certs.length}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Certificates</Text>
            </View>
          </View>
          <View style={[styles.statTile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
              <Feather name="star" size={15} color="#F59E0B" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {badgesLoading ? '—' : badges.length}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Badges earned</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabBtn,
                  isActive
                    ? { backgroundColor: themeColors.primaryBright }
                    : { backgroundColor: themeColors.card, borderWidth: 1, borderColor: themeColors.border },
                ]}
              >
                <Feather name={tab.icon} size={13} color={isActive ? '#FFFFFF' : themeColors.textMuted} />
                <Text style={[styles.tabText, { color: isActive ? '#FFFFFF' : themeColors.textMuted }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Certificates tab ── */}
        {activeTab === 'certificates' && (
          certsLoading ? (
            <View style={{ gap: 12 }}>
              {[0, 1].map((i) => (
                <SkeletonBox key={i} width="100%" height={168} borderRadius={18} />
              ))}
            </View>
          ) : certsError ? (
            <View style={styles.empty}>
              <Feather name="alert-triangle" size={26} color={themeColors.danger} />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{certsError}</Text>
              <Pressable onPress={loadCerts} style={[styles.retryBtn, { borderColor: themeColors.border }]}>
                <Feather name="refresh-cw" size={13} color={themeColors.text} />
                <Text style={[styles.retryText, { color: themeColors.text }]}>Retry</Text>
              </Pressable>
            </View>
          ) : certs.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="award" size={30} color={themeColors.iconMuted} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No certificates yet</Text>
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                Pass a stage assessment or finish a course to earn your first professional credential — it will
                appear here automatically.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {certs.map((c) => (
                <View
                  key={c.certificateId}
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
                        <View key={`${c.certificateId}-${i}`} style={[styles.skillChip, { borderColor: themeColors.border }]}>
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
                      <Pressable
                        hitSlop={8}
                        onPress={() =>
                          Share.share({
                            message: `${c.certificateTitle || 'My certificate'} — verify at ${c.verificationUrl}`,
                          }).catch(() => {})
                        }
                        style={[styles.iconBtn, { borderColor: themeColors.border }]}
                      >
                        <Feather name="share-2" size={14} color={themeColors.text} />
                      </Pressable>
                      <Pressable
                        onPress={() => c.verificationUrl && Linking.openURL(c.verificationUrl).catch(() => {})}
                        style={[styles.verifyBtn, { backgroundColor: themeColors.primaryBright }]}
                      >
                        <Text style={styles.verifyText}>Verify</Text>
                        <Feather name="external-link" size={12} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        )}

        {/* ── Badges tab ── */}
        {activeTab === 'badges' && (
          badgesLoading ? (
            <View style={styles.badgeGrid}>
              {[0, 1, 2, 3].map((i) => (
                <SkeletonBox key={i} width="47%" height={130} borderRadius={16} />
              ))}
            </View>
          ) : badgesError ? (
            <View style={styles.empty}>
              <Feather name="alert-triangle" size={26} color={themeColors.danger} />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{badgesError}</Text>
              <Pressable onPress={loadBadges} style={[styles.retryBtn, { borderColor: themeColors.border }]}>
                <Feather name="refresh-cw" size={13} color={themeColors.text} />
                <Text style={[styles.retryText, { color: themeColors.text }]}>Retry</Text>
              </Pressable>
            </View>
          ) : badges.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="star" size={30} color={themeColors.iconMuted} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No badges yet</Text>
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                Complete courses, pass assessments, and stay active to start earning achievement badges.
              </Text>
            </View>
          ) : (
            <View>
              {badgeCategories.length > 2 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {badgeCategories.map((cat) => {
                    const isActive = badgeCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setBadgeCategory(cat)}
                        style={[
                          styles.filterChip,
                          isActive
                            ? { backgroundColor: themeColors.primaryBright }
                            : { borderWidth: 1, borderColor: themeColors.border, backgroundColor: themeColors.card },
                        ]}
                      >
                        <Text style={[styles.filterChipText, { color: isActive ? '#FFFFFF' : themeColors.textMuted }]}>
                          {cat === 'all' ? 'All' : titleCase(cat)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <View style={styles.badgeGrid}>
                {filteredBadges.map((b) => (
                  <View
                    key={b._id || b.id}
                    style={[styles.badgeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                  >
                    <View style={[styles.badgeIcon, { backgroundColor: `${b.color || themeColors.primaryBright}22` }]}>
                      <Feather name="award" size={18} color={b.color || themeColors.primaryBright} />
                    </View>
                    <Text style={[styles.badgeTitle, { color: themeColors.text }]} numberOfLines={2}>
                      {b.title}
                    </Text>
                    {!!b.description && (
                      <Text style={[styles.badgeDesc, { color: themeColors.textMuted }]} numberOfLines={2}>
                        {b.description}
                      </Text>
                    )}
                    <View style={styles.badgeFoot}>
                      {!!b.tier && (
                        <View style={[styles.tierPill, { backgroundColor: themeColors.pillBg }]}>
                          <Text style={[styles.tierText, { color: themeColors.primaryBright }]}>{titleCase(b.tier)}</Text>
                        </View>
                      )}
                      {!!b.xp && (
                        <Text style={[styles.xpText, { color: themeColors.textMuted }]}>{b.xp} XP</Text>
                      )}
                    </View>
                    {!!b.earnedDate && (
                      <Text style={[styles.badgeDate, { color: themeColors.textMuted }]}>
                        Earned {formatDate(b.earnedDate)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )
        )}

        {/* ── Flashcards tab ── */}
        {activeTab === 'flashcards' && (
          <View style={styles.flashGrid}>
            {QUOTIENT_FLASHCARDS.map((card, i) => {
              const open = flippedIndex === i;
              return (
                <Pressable
                  key={card.code}
                  onPress={() => setFlippedIndex(open ? null : i)}
                  style={[
                    styles.flashCard,
                    open
                      ? { backgroundColor: themeColors.primaryBright, borderColor: themeColors.primaryBright }
                      : { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  ]}
                >
                  <View style={[styles.flashChip, { backgroundColor: open ? 'rgba(255,255,255,0.16)' : themeColors.pillBg }]}>
                    <Text style={[styles.flashChipText, { color: open ? '#FFFFFF' : themeColors.primaryBright }]}>
                      {card.code}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.flashBody,
                      { color: open ? '#FFFFFF' : themeColors.text, fontWeight: open ? '500' : '800' },
                    ]}
                    numberOfLines={open ? 6 : 3}
                  >
                    {open ? card.definition : card.term}
                  </Text>
                  <View style={styles.flashFoot}>
                    <Feather name={open ? 'rotate-ccw' : 'zap'} size={12} color={open ? 'rgba(255,255,255,0.75)' : themeColors.textMuted} />
                    <Text style={[styles.flashFootText, { color: open ? 'rgba(255,255,255,0.75)' : themeColors.textMuted }]}>
                      {open ? 'Tap to flip back' : 'Tap to reveal'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
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

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statTile: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
  },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', lineHeight: 19 },
  statLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 10,
  },
  tabText: { fontSize: 12, fontWeight: '800' },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4,
  },
  retryText: { fontSize: 12.5, fontWeight: '800' },

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

  filterRow: { gap: 8, paddingBottom: 14 },
  filterChip: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  filterChipText: { fontSize: 11, fontWeight: '800' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '47%', borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  badgeIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  badgeTitle: { fontSize: 13, fontWeight: '800', lineHeight: 17 },
  badgeDesc: { fontSize: 10.5, lineHeight: 14 },
  badgeFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  tierPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  tierText: { fontSize: 9, fontWeight: '800' },
  xpText: { fontSize: 10, fontWeight: '700' },
  badgeDate: { fontSize: 9.5, fontWeight: '600', marginTop: 2 },

  flashGrid: { gap: 12 },
  flashCard: { borderWidth: 1, borderRadius: 18, padding: 18, minHeight: 130, justifyContent: 'space-between' },
  flashChip: { alignSelf: 'center', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  flashChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  flashBody: { fontSize: 14.5, textAlign: 'center', lineHeight: 20, marginVertical: 12 },
  flashFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  flashFootText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
});
