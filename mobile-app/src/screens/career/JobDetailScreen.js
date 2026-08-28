/**
 * JobDetailScreen — dedicated Job Detail view promoted from CareerScreen's old
 * inline job modal.
 *
 * Receives `job`, `alreadyApplied`, `applying` and `onApply` via route.params.
 * `onApply` is CareerScreen's own `handleApply` closure (unchanged, same
 * endpoint/args/alerts) — this screen never talks to placementsAPI directly,
 * it only renders the richer payload that was already being fetched and
 * calls back into the owner screen to submit.
 *
 * Surfaces fields that were already on every /placements/jobs response but
 * silently discarded by the old modal: company logo/about/website, posted-by
 * vs host-college vs job-fair distinction, eligibility criteria, and the
 * server-computed skill-gap warning (missedMustHaves / matchGapWarning).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
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
import { normalizeJobType } from './CareerScreen';

function AnimatedSection({ children, delay = 0, style }) {
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

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function PressCard({ onPress, style, children, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

function CompanyLogo({ uri, letter, tint, size = 56, radius = 18 }) {
  const [failed, setFailed] = useState(false);
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View
      style={[
        styles.logoFallback,
        { width: size, height: size, borderRadius: radius, backgroundColor: `${tint}18` },
      ]}
    >
      <Text style={[styles.logoFallbackText, { color: tint, fontSize: size * 0.4 }]}>{letter}</Text>
    </View>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;
  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export default function JobDetailScreen({ navigation, route }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';
  const { job, alreadyApplied = false, onApply } = route?.params || {};

  const [localApplying, setLocalApplying] = useState(false);

  const title = job?.displayTitle || job?.title || 'Placement Role';
  const company = job?.displayCompany || job?.company || 'Hiring Partner';
  const companyInit = (company || 'C').charAt(0).toUpperCase();
  const isSmaart = job?.displaySource ? job.displaySource === 'smaart' : job?.sourceCollection === 'smaartjobpostings';
  const jobType = job ? normalizeJobType(job) : 'other';
  const posted = timeAgo(job?.displayCreatedAt || job?.createdAt);
  const deadline = job?.displayDeadline || job?.deadline;
  const salary = job?.displaySalary || job?.ctc;
  const skills = Array.isArray(job?.skills) ? job.skills : [];
  const missedMustHaves = Array.isArray(job?.missedMustHaves) ? job.missedMustHaves : [];
  const hasSkillGap = !!job?.matchGapWarning || missedMustHaves.length > 0;
  const eligibility = job?.eligibility || null;

  const eligibilityRows = useMemo(() => {
    if (!eligibility) return [];
    const rows = [];
    if (eligibility.minCGPA != null && eligibility.minCGPA !== '') {
      rows.push({ icon: 'award', label: 'Minimum CGPA', value: String(eligibility.minCGPA) });
    }
    if (eligibility.noBacklog) {
      rows.push({ icon: 'shield', label: 'Backlogs', value: 'No active backlogs allowed' });
    }
    if (eligibility.hasMin12th && eligibility.min12thPercentage != null) {
      rows.push({ icon: 'book-open', label: 'Minimum 12th %', value: `${eligibility.min12thPercentage}%` });
    }
    if (eligibility.hasMin10th && eligibility.min10thPercentage != null) {
      rows.push({ icon: 'book', label: 'Minimum 10th %', value: `${eligibility.min10thPercentage}%` });
    }
    return rows;
  }, [eligibility]);

  const allowedDegrees = Array.isArray(eligibility?.allowedDegrees) ? eligibility.allowedDegrees.filter(Boolean) : [];
  const allowedBranches = Array.isArray(eligibility?.allowedBranches) ? eligibility.allowedBranches.filter(Boolean) : [];
  const hasEligibilitySection = eligibilityRows.length > 0 || allowedDegrees.length > 0 || allowedBranches.length > 0;

  const metaItems = [
    { icon: 'map-pin', label: 'Location', value: job?.displayLocation || job?.location || 'Remote' },
    { icon: 'briefcase', label: 'Employment Type', value: jobType.replace('-', ' ') },
    salary ? { icon: 'dollar-sign', label: 'Compensation (CTC)', value: String(salary) } : null,
    deadline ? { icon: 'clock', label: 'Apply By', value: new Date(deadline).toLocaleDateString() } : null,
    posted ? { icon: 'calendar', label: 'Posted', value: posted } : null,
    job?.displayPostedBy ? {
      icon: 'user',
      label: job?.displayPostedByType === 'recruiter' ? 'Posted By (Recruiter)' : 'Posted By (College)',
      value: job.displayPostedBy,
    } : null,
    job?.displayHostCollege ? { icon: 'home', label: 'Host College', value: job.displayHostCollege } : null,
  ].filter(Boolean);

  const openWebsite = () => {
    const url = job?.displayCompanyWebsite;
    if (!url) return;
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.openURL(withScheme).catch(() => {});
  };

  const handleApplyPress = async () => {
    if (!onApply || !job || alreadyApplied || localApplying) return;
    setLocalApplying(true);
    try {
      await onApply(job);
    } finally {
      setLocalApplying(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      {/* Aurora Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.auroraBlob, { backgroundColor: '#1478B8', top: -90, right: -80, width: 300, height: 300, borderRadius: 150, opacity: isDark ? 0.1 : 0.05 }]} />
        <View style={[styles.auroraBlob, { backgroundColor: '#8B5CF6', bottom: 40, left: -120, width: 280, height: 280, borderRadius: 140, opacity: isDark ? 0.08 : 0.04 }]} />
      </View>

      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: themeColors.border }]}
        >
          <Feather name="arrow-left" size={19} color={themeColors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>{company}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Company Hero */}
        <AnimatedSection delay={0} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.heroTop}>
            <CompanyLogo uri={job?.displayCompanyLogo} letter={companyInit} tint={themeColors.primaryBright} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.jobTitle, { color: themeColors.text }]} numberOfLines={2}>{title}</Text>
              <Text style={[styles.companyName, { color: themeColors.textMuted }]} numberOfLines={1}>{company}</Text>
              <View style={styles.tagRow}>
                <View style={[styles.sourceTag, { backgroundColor: isSmaart ? '#1E293B' : 'rgba(20, 120, 184, 0.12)' }]}>
                  <Text style={[styles.sourceTagText, { color: isSmaart ? '#FFFFFF' : themeColors.primaryBright }]}>
                    {isSmaart ? 'SMAART' : 'COLLEGE'}
                  </Text>
                </View>
                {job?.displayJobFairTitle ? (
                  <View style={[styles.fairTag, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                    <Feather name="calendar" size={9} color="#F59E0B" />
                    <Text style={styles.fairTagText} numberOfLines={1}>{job.displayJobFairTitle}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {(job?.displayCompanyAbout || job?.displayCompanyWebsite) && (
            <View style={[styles.aboutBlock, { borderTopColor: themeColors.border }]}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>About Company</Text>
              {job?.displayCompanyAbout ? (
                <Text style={[styles.bodyText, { color: themeColors.textMuted }]}>{job.displayCompanyAbout}</Text>
              ) : null}
              {job?.displayCompanyWebsite ? (
                <Pressable onPress={openWebsite} style={styles.websiteRow} hitSlop={6}>
                  <Feather name="external-link" size={12} color={themeColors.primaryBright} />
                  <Text style={[styles.websiteText, { color: themeColors.primaryBright }]} numberOfLines={1}>
                    {job.displayCompanyWebsite}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </AnimatedSection>

        {/* Skill Gap Warning */}
        {hasSkillGap && (
          <AnimatedSection delay={60} style={[styles.card, styles.warningCard, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB', borderColor: 'rgba(245, 158, 11, 0.35)' }]}>
            <View style={styles.warningHeader}>
              <Feather name="alert-triangle" size={15} color="#F59E0B" />
              <Text style={styles.warningTitle}>Skill Gap Detected</Text>
            </View>
            <Text style={[styles.bodyText, { color: themeColors.textMuted, marginTop: 4 }]}>
              Your profile is missing {missedMustHaves.length || 'some'} required skill{missedMustHaves.length === 1 ? '' : 's'} for this role.
            </Text>
            {missedMustHaves.length > 0 && (
              <View style={{ marginTop: 10, gap: 8 }}>
                {missedMustHaves.map((gap, idx) => (
                  <View key={`${gap.name || 'skill'}-${idx}`} style={styles.gapRow}>
                    <Feather name="x-circle" size={12} color="#F59E0B" />
                    <Text style={[styles.gapText, { color: themeColors.text }]}>
                      {gap.name || 'Skill'}
                      {gap.requiredLevel != null ? ` — needs level ${gap.requiredLevel}` : ''}
                      {gap.studentLevel != null ? ` (you: ${gap.studentLevel})` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </AnimatedSection>
        )}

        {/* Description */}
        <AnimatedSection delay={120} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Job Description</Text>
          <Text style={[styles.bodyText, { color: themeColors.textMuted, lineHeight: 20 }]}>
            {job?.description || job?.jobDescription || 'Role details and requirements will be shared by the recruiter.'}
          </Text>
        </AnimatedSection>

        {/* Meta Grid */}
        <AnimatedSection delay={160} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted, marginBottom: 12 }]}>Role Details</Text>
          <View style={styles.metaGrid}>
            {metaItems.map((item) => (
              <View key={item.label} style={styles.metaCell}>
                <View style={styles.metaIconRow}>
                  <Feather name={item.icon} size={11} color={themeColors.primaryBright} />
                  <Text style={[styles.gridLabel, { color: themeColors.textMuted }]}>{item.label}</Text>
                </View>
                <Text style={[styles.gridValue, { color: themeColors.text }]} numberOfLines={2}>{item.value}</Text>
              </View>
            ))}
          </View>
        </AnimatedSection>

        {/* Eligibility Criteria */}
        {hasEligibilitySection && (
          <AnimatedSection delay={200} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.sectionLabel, { color: themeColors.textMuted, marginBottom: 10 }]}>Eligibility Criteria</Text>
            {eligibilityRows.map((row) => (
              <View key={row.label} style={styles.eligRow}>
                <View style={[styles.eligIconWrap, { backgroundColor: themeColors.pillBg }]}>
                  <Feather name={row.icon} size={12} color={themeColors.primaryBright} />
                </View>
                <Text style={[styles.eligLabel, { color: themeColors.textMuted }]}>{row.label}</Text>
                <Text style={[styles.eligValue, { color: themeColors.text }]}>{row.value}</Text>
              </View>
            ))}
            {allowedDegrees.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.gridLabel, { color: themeColors.textMuted, marginBottom: 6 }]}>Eligible Degrees</Text>
                <View style={styles.skillsRow}>
                  {allowedDegrees.map((deg, i) => (
                    <View key={`${deg}-${i}`} style={[styles.skillTag, { backgroundColor: themeColors.pillBg }]}>
                      <Text style={[styles.skillTagText, { color: themeColors.primaryBright }]}>{deg}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {allowedBranches.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.gridLabel, { color: themeColors.textMuted, marginBottom: 6 }]}>Eligible Branches</Text>
                <View style={styles.skillsRow}>
                  {allowedBranches.map((br, i) => (
                    <View key={`${br}-${i}`} style={[styles.skillTag, { backgroundColor: themeColors.pillBg }]}>
                      <Text style={[styles.skillTagText, { color: themeColors.primaryBright }]}>{br}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </AnimatedSection>
        )}

        {/* Required Skills */}
        {skills.length > 0 && (
          <AnimatedSection delay={240} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.sectionLabel, { color: themeColors.textMuted, marginBottom: 10 }]}>Required Skills</Text>
            <View style={styles.skillsRow}>
              {skills.map((skill, index) => (
                <View key={`${skill}-${index}`} style={[styles.skillTag, { backgroundColor: themeColors.border }]}>
                  <Text style={[styles.skillTagText, { color: themeColors.text }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </AnimatedSection>
        )}

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Sticky Apply CTA */}
      <View style={[styles.footer, { backgroundColor: themeColors.bg, borderTopColor: themeColors.border }]}>
        <PressCard
          disabled={alreadyApplied || localApplying}
          onPress={handleApplyPress}
          style={[
            styles.applyBtn,
            { backgroundColor: alreadyApplied ? themeColors.border : themeColors.primaryBright },
            (localApplying) && { opacity: 0.7 },
          ]}
        >
          {localApplying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : alreadyApplied ? (
            <>
              <Feather name="check-circle" size={16} color={themeColors.textMuted} />
              <Text style={[styles.applyBtnText, { color: themeColors.textMuted }]}>Already Applied</Text>
            </>
          ) : (
            <Text style={styles.applyBtnText}>Apply for this Job</Text>
          )}
        </PressCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  auroraBlob: { position: 'absolute' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },

  scroll: { padding: 20, paddingBottom: 30, gap: 14 },

  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#0F1E42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 18,
    elevation: 2,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  logoFallbackText: { fontWeight: '800' },
  jobTitle: { fontSize: 17, fontWeight: '850', letterSpacing: -0.3 },
  companyName: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  sourceTag: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  sourceTagText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3 },
  fairTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, maxWidth: 160 },
  fairTagText: { fontSize: 9, fontWeight: '800', color: '#F59E0B' },

  aboutBlock: { marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  sectionLabel: { fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  bodyText: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
  websiteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  websiteText: { fontSize: 12.5, fontWeight: '700' },

  warningCard: {},
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningTitle: { fontSize: 13.5, fontWeight: '850', color: '#B45309' },
  gapRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gapText: { fontSize: 12.5, fontWeight: '600', flex: 1 },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaCell: { width: '45%' },
  metaIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gridLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  gridValue: { fontSize: 13, fontWeight: '800', marginTop: 3, textTransform: 'capitalize' },

  eligRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  eligIconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  eligLabel: { fontSize: 12, fontWeight: '600', flex: 1 },
  eligValue: { fontSize: 12.5, fontWeight: '800' },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 9 },
  skillTagText: { fontSize: 11.5, fontWeight: '700' },

  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderTopWidth: 1.5 },
  applyBtn: {
    flexDirection: 'row', gap: 8,
    height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '850' },
});
