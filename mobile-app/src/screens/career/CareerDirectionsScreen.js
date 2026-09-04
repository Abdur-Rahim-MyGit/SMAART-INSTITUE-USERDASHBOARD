/**
 * CareerDirectionsScreen — the first mobile implementation of the Career
 * Agent's direction-lock flow (FR-CAR "Career Directions" sidebar item, which
 * previously mis-opened the generic Placement tab).
 *
 * Gate logic mirrors the web dashboard (`front-end/src/pages/CareerAgent/*`):
 *   1. `getDirectionLockStatus()` never throws — `found:false` means the
 *      student hasn't run the intake yet, so we show a scoped-down onboarding
 *      form instead of the web's 6-step / 3-tier wizard (which needs assets
 *      and endpoints this client doesn't have — see IMPLEMENTATION_MAP.md).
 *   2. `found:true` (a `primaryCareerPath` exists) renders the dashboard:
 *      direction overview + core roles (`getDirectionRoles`), a role
 *      narrative (`getRoleProfile`), and a read-only skill roadmap grouped
 *      into Foundational / Specialization / Edge tiers exactly like the web's
 *      `CareerRoadmap.jsx` (`getRoadmap`, server-aggregated by job family).
 *
 * Deliberately out of scope for this pass (see structured output "deferred"):
 * market intelligence, interview prep, resume tools, certifications, the
 * curated cascading direction selector, and the secondary/tertiary tabs.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

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
import { useAuth } from '../../context/AuthContext';
import SkeletonBox from '../../components/SkeletonBox';
import {
  getDirectionLockStatus,
  submitOnboarding,
  getDirectionRoles,
  getRoleProfile,
  getRoadmap,
  getCareerRoleNames,
} from '../../api/careerAgent';
import { getRegistration } from '../../api/profile';

const CTC_OPTIONS = ['0-3 LPA', '3-5 LPA', '5-8 LPA', '8-12 LPA', '12-18 LPA', '18-25 LPA', '25+ LPA'];
const ORG_OPTIONS = [
  'Startup',
  'Scale-up / High-growth',
  'SME',
  'Large Corporate',
  'MNC',
  'Government / Public Sector',
  'Non-Profit / NGO',
  'Any organization type',
];
const STEPS = ['You', 'Target Role', 'Review'];

function errMessage(err, fallback) {
  return err?.data?.error || err?.data?.message || err?.message || fallback;
}

export default function CareerDirectionsScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();

  // ── Gate ───────────────────────────────────────────────────────────────
  const [gateLoading, setGateLoading] = useState(true);
  const [gateError, setGateError] = useState(null);
  const [lockStatus, setLockStatus] = useState(null);

  const loadGate = useCallback(async () => {
    setGateError(null);
    try {
      const status = await getDirectionLockStatus();
      setLockStatus(status);
    } catch (err) {
      setGateError(errMessage(err, 'Could not check your career direction status.'));
    } finally {
      setGateLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGate();
  }, [loadGate]);

  const hasDirection = !!(lockStatus?.found && lockStatus?.primaryCareerPath);

  if (gateLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
        <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
        <HeaderBar
          themeColors={themeColors}
          eyebrow="Career direction"
          title="Loading…"
          onBack={() => navigation.goBack()}
        />
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonBox width="100%" height={90} borderRadius={20} style={{ marginBottom: 14 }} />
          <SkeletonBox width="100%" height={140} borderRadius={20} style={{ marginBottom: 14 }} />
          <SkeletonBox width="100%" height={200} borderRadius={20} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (gateError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
        <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
        <HeaderBar
          themeColors={themeColors}
          eyebrow="Career direction"
          title="Career Directions"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.empty}>
          <Feather name="alert-triangle" size={26} color={themeColors.danger} />
          <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{gateError}</Text>
          <Pressable
            onPress={() => {
              setGateLoading(true);
              loadGate();
            }}
            style={[styles.retryBtn, { backgroundColor: themeColors.primaryBright }]}
          >
            <Feather name="refresh-cw" size={13} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return hasDirection ? (
    <DirectionDashboard
      navigation={navigation}
      themeColors={themeColors}
      isDark={isDark}
      lockStatus={lockStatus}
      onRefreshGate={loadGate}
    />
  ) : (
    <OnboardingGate
      navigation={navigation}
      themeColors={themeColors}
      isDark={isDark}
      user={user}
      onDone={loadGate}
    />
  );
}

// ── Shared header ────────────────────────────────────────────────────────

function HeaderBar({ themeColors, eyebrow, title, onBack, right }) {
  const isDark = themeColors.theme === 'dark';
  return (
    <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
      <Pressable
        onPress={onBack}
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
        <Text style={[styles.eyebrow, { color: themeColors.textMuted }]} numberOfLines={1}>
          {eyebrow}
        </Text>
        <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right || null}
    </View>
  );
}

function SectionLabel({ themeColors, icon, children }) {
  return (
    <View style={styles.sectionLabelRow}>
      {icon ? <Feather name={icon} size={12} color={themeColors.primaryBright} /> : null}
      <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{children}</Text>
    </View>
  );
}

// ── Onboarding gate (scoped-down intake) ────────────────────────────────

function OnboardingGate({ navigation, themeColors, isDark, user, onDone }) {
  const [step, setStep] = useState(0);
  const [prefilling, setPrefilling] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(null); // 423 payload, or null

  // Step 0 — identity
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [degree, setDegree] = useState('');
  const [specialisation, setSpecialisation] = useState('');

  // Step 1 — target role
  const [targetRole, setTargetRole] = useState('');
  const [roleNames, setRoleNames] = useState([]);
  const [roleNamesLoading, setRoleNamesLoading] = useState(false);
  const [roleSuggestOpen, setRoleSuggestOpen] = useState(false);
  const [ctc, setCtc] = useState('');
  const [location, setLocation] = useState('');
  const [orgType, setOrgType] = useState('');

  // Prefill from the existing registration record, same source ProfileCompletionScreen uses.
  useEffect(() => {
    if (!user?.email) {
      setPrefilling(false);
      return;
    }
    (async () => {
      try {
        const existing = await getRegistration(user.email);
        if (existing) {
          setFullName((v) => existing.fullName || v);
          const he = Array.isArray(existing.higherEducation) ? existing.higherEducation[0] : existing.higherEducation;
          if (he) {
            setDegree((v) => he.degree || v);
            setSpecialisation((v) => he.specialization || v);
          }
        }
      } catch {
        // A missing record is normal for a brand-new account.
      } finally {
        setPrefilling(false);
      }
    })();
  }, [user?.email]);

  // Fetch the DB role pool once the target-role step is reached.
  useEffect(() => {
    if (step !== 1 || roleNames.length > 0 || roleNamesLoading) return;
    setRoleNamesLoading(true);
    getCareerRoleNames()
      .then((names) => setRoleNames(Array.isArray(names) ? names : []))
      .catch(() => setRoleNames([]))
      .finally(() => setRoleNamesLoading(false));
  }, [step, roleNames.length, roleNamesLoading]);

  const roleSuggestions = useMemo(() => {
    const q = targetRole.trim().toLowerCase();
    const pool = q ? roleNames.filter((r) => r.toLowerCase().includes(q)) : roleNames;
    return pool.slice(0, 8);
  }, [roleNames, targetRole]);

  const goBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      return;
    }
    navigation.goBack();
  };

  const validateStep = () => {
    setError('');
    if (step === 0 && !fullName.trim()) {
      setError('Enter your full name.');
      return false;
    }
    if (step === 1 && !targetRole.trim()) {
      setError('Enter or pick the role you want to target.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        personalDetails: {
          name: fullName.trim(),
          email: user?.email || '',
          department: degree.trim(),
          specialisation: specialisation.trim(),
        },
        education: degree.trim()
          ? [
              {
                degree: degree.trim(),
                degreeGroup: degree.trim(),
                specialisation: specialisation.trim() ? [specialisation.trim()] : [],
              },
            ]
          : [],
        skills: [],
        experience: [],
        preferences: {
          primary: {
            role: targetRole.trim(),
            salary: ctc,
            type: 'Full-Time',
            locations: location.trim() ? [location.trim()] : [],
            location: location.trim(),
            orgTypes: orgType ? [orgType] : [],
          },
        },
      };
      await submitOnboarding(payload);
      await onDone();
    } catch (err) {
      if (err?.status === 423) {
        setLocked(err.data || { error: err.message });
      } else {
        setError(errMessage(err, 'Could not submit your career direction. Please try again.'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (prefilling) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
        <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
        <HeaderBar themeColors={themeColors} eyebrow="Career direction" title="Get started" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonBox width="100%" height={200} borderRadius={20} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (locked) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
        <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
        <HeaderBar themeColors={themeColors} eyebrow="Career direction" title="Locked" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Feather name="lock" size={28} color={themeColors.warning} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Career direction is locked</Text>
          <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
            {locked.error || 'Your career direction window has closed and can no longer be changed from here.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
      <HeaderBar
        themeColors={themeColors}
        eyebrow={`Career direction · Step ${step + 1} of ${STEPS.length}`}
        title={STEPS[step]}
        onBack={goBack}
      />

      <View style={styles.stepper}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                i === step && { backgroundColor: themeColors.pillBg, borderColor: themeColors.primaryBright },
                i < step && { backgroundColor: themeColors.success, borderColor: themeColors.success },
              ]}
            >
              {i < step ? (
                <Feather name="check" size={12} color="#FFFFFF" />
              ) : (
                <Text style={[styles.stepNum, { color: i === step ? themeColors.primaryBright : themeColors.textMuted }]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: i === step ? themeColors.primaryBright : themeColors.textMuted },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <AnimatedSection delay={0}>
            <Field label="Full Name" icon="user" themeColors={themeColors}>
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Your full name"
                placeholderTextColor={themeColors.textMuted}
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
              />
            </Field>
            <Field label="Email" icon="mail" themeColors={themeColors} muted>
              <Text style={[styles.input, { color: themeColors.textMuted }]} numberOfLines={1}>
                {user?.email || '—'}
              </Text>
            </Field>
            <Field label="Degree" icon="book" themeColors={themeColors}>
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="e.g. B.Tech, B.Sc, MBA"
                placeholderTextColor={themeColors.textMuted}
                value={degree}
                onChangeText={setDegree}
              />
            </Field>
            <Field label="Specialisation (optional)" icon="award" themeColors={themeColors}>
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="e.g. Computer Science"
                placeholderTextColor={themeColors.textMuted}
                value={specialisation}
                onChangeText={setSpecialisation}
              />
            </Field>
          </AnimatedSection>
        ) : null}

        {step === 1 ? (
          <AnimatedSection delay={0}>
            <Field label="Target Role" icon="target" themeColors={themeColors}>
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Type or search a job role…"
                placeholderTextColor={themeColors.textMuted}
                value={targetRole}
                onChangeText={(v) => {
                  setTargetRole(v);
                  setRoleSuggestOpen(true);
                }}
                onFocus={() => setRoleSuggestOpen(true)}
              />
            </Field>

            {roleSuggestOpen && (roleNamesLoading || roleSuggestions.length > 0) ? (
              <View style={[styles.suggestBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                {roleNamesLoading ? (
                  <Text style={[styles.suggestEmpty, { color: themeColors.textMuted }]}>Loading roles…</Text>
                ) : (
                  roleSuggestions.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => {
                        setTargetRole(r);
                        setRoleSuggestOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.suggestRow,
                        pressed && { backgroundColor: themeColors.pillBg },
                      ]}
                    >
                      <Text style={[styles.suggestText, { color: themeColors.text }]} numberOfLines={1}>
                        {r}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}

            <Text style={[styles.fieldLabel, { color: themeColors.textMuted, marginTop: 4 }]}>
              Expected CTC (optional)
            </Text>
            <View style={styles.chipRow}>
              {CTC_OPTIONS.map((opt) => {
                const selected = ctc === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setCtc(selected ? '' : opt)}
                    style={[
                      styles.chip,
                      { borderColor: themeColors.border, backgroundColor: themeColors.card },
                      selected && { borderColor: themeColors.primaryBright, backgroundColor: themeColors.pillBg },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: selected ? themeColors.primaryBright : themeColors.textMuted }]}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Field label="Preferred Location (optional)" icon="map-pin" themeColors={themeColors}>
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="e.g. Chennai"
                placeholderTextColor={themeColors.textMuted}
                autoCapitalize="words"
                value={location}
                onChangeText={setLocation}
              />
            </Field>

            <Text style={[styles.fieldLabel, { color: themeColors.textMuted, marginTop: 4 }]}>
              Organization Type (optional)
            </Text>
            <View style={styles.chipRow}>
              {ORG_OPTIONS.map((opt) => {
                const selected = orgType === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setOrgType(selected ? '' : opt)}
                    style={[
                      styles.chip,
                      { borderColor: themeColors.border, backgroundColor: themeColors.card },
                      selected && { borderColor: themeColors.primaryBright, backgroundColor: themeColors.pillBg },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: selected ? themeColors.primaryBright : themeColors.textMuted }]}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </AnimatedSection>
        ) : null}

        {step === 2 ? (
          <AnimatedSection delay={0}>
            <View style={[styles.reviewCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <ReviewRow label="Name" value={fullName} themeColors={themeColors} />
              <ReviewRow label="Degree" value={degree || '—'} themeColors={themeColors} />
              <ReviewRow label="Specialisation" value={specialisation || '—'} themeColors={themeColors} />
              <ReviewRow label="Target Role" value={targetRole} highlight themeColors={themeColors} />
              <ReviewRow label="Expected CTC" value={ctc || '—'} themeColors={themeColors} />
              <ReviewRow label="Location" value={location || '—'} themeColors={themeColors} />
              <ReviewRow label="Org Type" value={orgType || '—'} themeColors={themeColors} last />
            </View>

            <View style={[styles.infoNote, { backgroundColor: themeColors.pillBg, borderColor: themeColors.primaryBright }]}>
              <Feather name="info" size={15} color={themeColors.primaryBright} />
              <Text style={[styles.infoNoteText, { color: themeColors.text }]}>
                Submitting builds your AI career analysis and starts a 14-day window during which you can
                refine your direction up to 5 times. After that, it locks in permanently.
              </Text>
            </View>
          </AnimatedSection>
        ) : null}

        {!!error && (
          <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2' }]}>
            <Feather name="alert-circle" size={16} color={themeColors.danger} />
            <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          </View>
        )}

        <PressCard
          onPress={handleNext}
          disabled={saving}
          style={[styles.primaryBtn, { backgroundColor: themeColors.primaryBright }, saving && { opacity: 0.6 }]}
        >
          <Text style={styles.primaryBtnText}>
            {saving ? 'Submitting…' : step === STEPS.length - 1 ? 'Submit & Build My Roadmap' : 'Continue'}
          </Text>
          {!saving && <Feather name={step === STEPS.length - 1 ? 'check' : 'arrow-right'} size={16} color="#FFFFFF" />}
        </PressCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, icon, themeColors, children, muted }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: muted ? themeColors.bgSecondary : themeColors.card, borderColor: themeColors.border },
        ]}
      >
        {icon ? <Feather name={icon} size={16} color={themeColors.iconMuted} style={{ marginRight: 10 }} /> : null}
        {children}
      </View>
    </View>
  );
}

function ReviewRow({ label, value, themeColors, highlight, last }) {
  return (
    <View style={[styles.reviewRow, !last && { borderBottomColor: themeColors.border, borderBottomWidth: 1 }]}>
      <Text style={[styles.reviewLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <Text
        style={[
          styles.reviewValue,
          { color: highlight ? themeColors.primaryBright : themeColors.text },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Dashboard (direction already locked/chosen) ─────────────────────────

function DirectionDashboard({ navigation, themeColors, isDark, lockStatus, onRefreshGate }) {
  const directionName = lockStatus.primaryCareerPath;

  const [refreshing, setRefreshing] = useState(false);

  const [directionLoading, setDirectionLoading] = useState(true);
  const [directionError, setDirectionError] = useState(null);
  const [directionData, setDirectionData] = useState(null);

  const [selectedRole, setSelectedRole] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState(null);

  const [roadmap, setRoadmap] = useState([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const loadDirection = useCallback(async () => {
    setDirectionLoading(true);
    setDirectionError(null);
    try {
      const d = await getDirectionRoles(directionName);
      setDirectionData(d);
      const roles = Array.isArray(d?.roles) ? d.roles.map((r) => r.role).filter(Boolean) : [];
      setSelectedRole(roles[0] || directionName);
    } catch (err) {
      setDirectionError(errMessage(err, 'Could not load this career direction.'));
    } finally {
      setDirectionLoading(false);
    }
  }, [directionName]);

  useEffect(() => {
    loadDirection();
  }, [loadDirection]);

  useEffect(() => {
    if (!selectedRole) return undefined;
    let cancelled = false;
    (async () => {
      setRoleLoading(true);
      setRoleError(null);
      setRoadmap([]);
      try {
        const profile = await getRoleProfile(selectedRole);
        if (cancelled) return;
        setRoleProfile(profile);
        if (profile?.jobFamily) {
          setRoadmapLoading(true);
          try {
            const rm = await getRoadmap(profile.jobFamily);
            if (!cancelled) setRoadmap(Array.isArray(rm) ? rm : []);
          } catch {
            if (!cancelled) setRoadmap([]);
          } finally {
            if (!cancelled) setRoadmapLoading(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setRoleProfile(null);
          setRoleError(errMessage(err, 'No detailed profile found for this role yet.'));
        }
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRole]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([onRefreshGate(), loadDirection()]);
    setRefreshing(false);
  }, [onRefreshGate, loadDirection]);

  const roles = useMemo(
    () => (Array.isArray(directionData?.roles) ? directionData.roles.map((r) => r.role).filter(Boolean) : []),
    [directionData]
  );

  const foundational = useMemo(() => roadmap.filter((s) => s.overlapPercentage >= 70), [roadmap]);
  const specialization = useMemo(
    () => roadmap.filter((s) => s.overlapPercentage >= 30 && s.overlapPercentage < 70),
    [roadmap]
  );
  const edge = useMemo(() => roadmap.filter((s) => s.overlapPercentage < 30), [roadmap]);

  const lockLine = lockStatus.isLocked
    ? 'Locked · this is your final direction'
    : `${lockStatus.remainingAttempts ?? 0} of ${lockStatus.maxAttempts ?? 5} refinements left · ${
        lockStatus.remainingDays ?? 0
      }d remaining`;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
      <HeaderBar
        themeColors={themeColors}
        eyebrow="Your career direction"
        title={directionName}
        onBack={() => navigation.goBack()}
      />

      <View style={[styles.lockLine, { borderBottomColor: themeColors.border }]}>
        <Feather
          name={lockStatus.isLocked ? 'lock' : 'unlock'}
          size={12}
          color={lockStatus.isLocked ? themeColors.warning : themeColors.textMuted}
        />
        <Text style={[styles.lockLineText, { color: themeColors.textMuted }]}>{lockLine}</Text>
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
        {directionLoading ? (
          <View style={{ gap: 14 }}>
            <SkeletonBox width="100%" height={120} borderRadius={20} />
            <SkeletonBox width="100%" height={80} borderRadius={20} />
            <SkeletonBox width="100%" height={220} borderRadius={20} />
          </View>
        ) : directionError ? (
          <View style={styles.empty}>
            <Feather name="alert-triangle" size={26} color={themeColors.danger} />
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{directionError}</Text>
            <Pressable
              onPress={loadDirection}
              style={[styles.retryBtn, { backgroundColor: themeColors.primaryBright }]}
            >
              <Feather name="refresh-cw" size={13} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Direction overview */}
            <AnimatedSection delay={0} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.overviewHead}>
                <View style={[styles.overviewIcon, { backgroundColor: themeColors.pillBg }]}>
                  <Feather name="compass" size={18} color={themeColors.primaryBright} />
                </View>
                <Text style={[styles.overviewTitle, { color: themeColors.text }]} numberOfLines={2}>
                  {directionData?.directionName || directionName}
                </Text>
              </View>
              <Text style={[styles.overviewText, { color: themeColors.textMuted }]}>
                {directionData?.overview ||
                  'A detailed direction overview isn’t available for this specific target yet — your role roadmap below is still generated from live data.'}
              </Text>
            </AnimatedSection>

            {/* Core roles */}
            {roles.length > 0 ? (
              <AnimatedSection delay={60} style={{ marginTop: 20 }}>
                <SectionLabel themeColors={themeColors} icon="briefcase">
                  Core Roles
                </SectionLabel>
                <View style={styles.chipRow}>
                  {roles.map((role) => {
                    const selected = role === selectedRole;
                    return (
                      <PressCard
                        key={role}
                        onPress={() => setSelectedRole(role)}
                        style={[
                          styles.chip,
                          { borderColor: themeColors.border, backgroundColor: themeColors.card },
                          selected && { borderColor: themeColors.primaryBright, backgroundColor: themeColors.primaryBright },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : themeColors.textMuted, fontWeight: '800' }]}>
                          {role}
                        </Text>
                      </PressCard>
                    );
                  })}
                </View>
              </AnimatedSection>
            ) : null}

            {/* Role narrative */}
            <AnimatedSection delay={120} style={{ marginTop: 20 }}>
              <SectionLabel themeColors={themeColors} icon="user">
                {selectedRole || 'Role'}
              </SectionLabel>

              {roleLoading ? (
                <View style={{ gap: 12 }}>
                  <SkeletonBox width="100%" height={90} borderRadius={18} />
                  <SkeletonBox width="100%" height={90} borderRadius={18} />
                </View>
              ) : roleError ? (
                <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, alignItems: 'center', paddingVertical: 26 }]}>
                  <Feather name="info" size={20} color={themeColors.iconMuted} />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted, marginTop: 8 }]}>{roleError}</Text>
                </View>
              ) : roleProfile ? (
                <View style={{ gap: 12 }}>
                  {(roleProfile.aiExposureLevel || roleProfile.salaryYear0_1) && (
                    <View style={styles.badgeRow}>
                      {roleProfile.aiExposureLevel ? (
                        <View style={[styles.badge, { backgroundColor: themeColors.pillBg }]}>
                          <Feather name="zap" size={11} color={themeColors.primaryBright} />
                          <Text style={[styles.badgeText, { color: themeColors.primaryBright }]}>
                            AI exposure: {roleProfile.aiExposureLevel}
                          </Text>
                        </View>
                      ) : null}
                      {roleProfile.salaryYear0_1 ? (
                        <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }]}>
                          <Feather name="dollar-sign" size={11} color={themeColors.success} />
                          <Text style={[styles.badgeText, { color: themeColors.success }]}>
                            Entry: {roleProfile.salaryYear0_1}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  <NarrativeBox
                    themeColors={themeColors}
                    icon="compass"
                    title="What This Role Does"
                    text={roleProfile.whatRoleDoes}
                  />
                  <NarrativeBox
                    themeColors={themeColors}
                    icon="users"
                    title="Who Should Consider This"
                    text={roleProfile.whoShouldConsider}
                  />
                  {roleProfile.howAiChanging ? (
                    <NarrativeBox
                      themeColors={themeColors}
                      icon="cpu"
                      title="How AI Is Changing This Role"
                      text={roleProfile.howAiChanging}
                    />
                  ) : null}
                  {roleProfile.careerGrowthPath ? (
                    <NarrativeBox
                      themeColors={themeColors}
                      icon="trending-up"
                      title="Career Growth Path"
                      text={roleProfile.careerGrowthPath}
                    />
                  ) : null}
                </View>
              ) : null}
            </AnimatedSection>

            {/* Skill roadmap */}
            <AnimatedSection delay={180} style={{ marginTop: 20, marginBottom: 12 }}>
              <SectionLabel themeColors={themeColors} icon="map">
                Skill Roadmap
              </SectionLabel>

              {roadmapLoading ? (
                <SkeletonBox width="100%" height={180} borderRadius={20} />
              ) : roadmap.length === 0 ? (
                <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, alignItems: 'center', paddingVertical: 26 }]}>
                  <Feather name="layers" size={22} color={themeColors.iconMuted} />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted, marginTop: 8 }]}>
                    We couldn’t aggregate enough skills for this role’s job family yet.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  <SkillTier
                    themeColors={themeColors}
                    isDark={isDark}
                    icon="check-circle"
                    color={themeColors.success}
                    title="Foundational"
                    hint="Needed across almost every role in this family"
                    skills={foundational}
                  />
                  <SkillTier
                    themeColors={themeColors}
                    isDark={isDark}
                    icon="layers"
                    color={themeColors.warning}
                    title="Specialization"
                    hint="Common, but differentiates candidates"
                    skills={specialization}
                  />
                  <SkillTier
                    themeColors={themeColors}
                    isDark={isDark}
                    icon="zap"
                    color={themeColors.primaryBright}
                    title="Edge"
                    hint="Rarer skills that stand out"
                    skills={edge}
                  />
                </View>
              )}
            </AnimatedSection>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NarrativeBox({ themeColors, icon, title, text }) {
  if (!text) return null;
  return (
    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <View style={styles.narrativeHead}>
        <Feather name={icon} size={14} color={themeColors.primaryBright} />
        <Text style={[styles.narrativeTitle, { color: themeColors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.narrativeText, { color: themeColors.textMuted }]}>{text}</Text>
    </View>
  );
}

function SkillTier({ themeColors, isDark, icon, color, title, hint, skills }) {
  if (skills.length === 0) return null;
  return (
    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <View style={styles.tierHead}>
        <View style={[styles.tierIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
          <Feather name={icon} size={14} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tierTitle, { color: themeColors.text }]}>
            {title} <Text style={{ color: themeColors.textMuted, fontWeight: '600' }}>· {skills.length}</Text>
          </Text>
          <Text style={[styles.tierHint, { color: themeColors.textMuted }]}>{hint}</Text>
        </View>
      </View>
      <View style={styles.tierSkillList}>
        {skills.map((s) => (
          <View key={s.skillName} style={[styles.skillRow, { borderTopColor: themeColors.border }]}>
            <Text style={[styles.skillName, { color: themeColors.text }]} numberOfLines={1}>
              {s.skillName}
            </Text>
            <View style={[styles.overlapBadge, { backgroundColor: `${color}22` }]}>
              <Text style={[styles.overlapText, { color }]}>{s.overlapPercentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
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
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },

  scroll: { padding: 20, paddingBottom: 48 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, marginTop: 6,
  },
  retryText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },

  card: { borderWidth: 1, borderRadius: 18, padding: 16 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Stepper
  stepper: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: 5,
  },
  stepNum: { fontSize: 10.5, fontWeight: '800' },
  stepLabel: { fontSize: 10, fontWeight: '700' },

  // Fields
  fieldLabel: {
    fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginBottom: 7,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 50,
    borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 14, fontWeight: '600', paddingVertical: 12 },

  suggestBox: {
    borderWidth: 1, borderRadius: 14, marginTop: -8, marginBottom: 16, overflow: 'hidden',
  },
  suggestRow: { paddingHorizontal: 14, paddingVertical: 11 },
  suggestText: { fontSize: 13, fontWeight: '600' },
  suggestEmpty: { fontSize: 12, fontWeight: '600', padding: 14 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  chipText: { fontSize: 11.5, fontWeight: '700' },

  reviewCard: { borderWidth: 1, borderRadius: 18, padding: 4, marginBottom: 16 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  reviewLabel: { fontSize: 12, fontWeight: '700' },
  reviewValue: { fontSize: 13, fontWeight: '800', flexShrink: 1, textAlign: 'right' },

  infoNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 8,
  },
  infoNoteText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 26, marginTop: 4,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },

  // Dashboard
  lockLine: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1,
  },
  lockLineText: { fontSize: 11.5, fontWeight: '700' },

  overviewHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  overviewIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overviewTitle: { flex: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  overviewText: { fontSize: 13, lineHeight: 20, fontWeight: '500' },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },

  narrativeHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  narrativeTitle: { fontSize: 13, fontWeight: '800' },
  narrativeText: { fontSize: 13, lineHeight: 20, fontWeight: '500' },

  tierHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  tierIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tierTitle: { fontSize: 13.5, fontWeight: '800' },
  tierHint: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  tierSkillList: { marginTop: 6 },
  skillRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, paddingVertical: 10, gap: 10,
  },
  skillName: { flex: 1, fontSize: 13, fontWeight: '700' },
  overlapBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  overlapText: { fontSize: 11, fontWeight: '800' },
});
