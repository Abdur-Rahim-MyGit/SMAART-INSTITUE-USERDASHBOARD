/**
 * CgpaCalculatorScreen — port of `front-end/src/pages/CGPACalculator.jsx`.
 *
 * The grading formula (GRADE_MAPPING, fail-grade handling, credit-weighted
 * SGPA/CGPA, the Slab / Continuous / Equal-Credit methods, and the Quick
 * Entry credit-weighted overall CGPA) is copied verbatim from the web
 * calculation engine — same constants, same branches, same rounding. Only
 * the "Smart Paste" OCR flow (camera + PaddleOCR/Tesseract) and the
 * `/students/:id/academic-performance` cross-sync for Quick Entry are
 * dropped: both need camera/image-picker work that's out of scope for this
 * pass, and manual entry against `GET/POST /cgpa` already gives a fully
 * working calculator.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import SkeletonBox from '../../components/SkeletonBox';
import { getCgpa, saveCgpa } from '../../api/cgpa';

// --- CONFIG & CONSTANTS (ported verbatim from CGPACalculator.jsx) ---
const GRADE_MAPPING = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5 };
const FAIL_GRADES = ['RA', 'SA', 'AB', 'W', 'U', 'F'];

const METHODS = [
  { id: 'quick', name: 'Quick Entry', badge: 'Semester-wise' },
  { id: 'slab', name: 'Slab-Based', badge: 'Anna University' },
  { id: 'continuous', name: 'Continuous', badge: 'Madras University' },
  { id: 'equal', name: 'Equal-Credit', badge: 'Autonomous' },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

let idSeed = 0;
const nextId = () => {
  idSeed += 1;
  return `${Date.now()}-${idSeed}`;
};

const getEmptySubjects = () => [
  { id: nextId(), code: '', name: '', input: '', credits: '' },
  { id: nextId(), code: '', name: '', input: '', credits: '' },
  { id: nextId(), code: '', name: '', input: '', credits: '' },
  { id: nextId(), code: '', name: '', input: '', credits: '' },
];

// --- CALCULATION ENGINE (ported verbatim) ---
function processSubjects(subjectList, activeMethod, failedSet) {
  let isPending = false;
  const rows = subjectList.map((subject) => {
    const rawInput = (subject.input || '').toString().toUpperCase().trim();
    let gp = 0;
    const credits = parseFloat(subject.credits) || 1;

    if (GRADE_MAPPING[rawInput] !== undefined) {
      if (activeMethod !== 'slab') {
        gp = 0;
        isPending = true;
        failedSet.add(`${subject.name || 'Subject'} (Requires Numbers)`);
      } else {
        gp = GRADE_MAPPING[rawInput];
      }
    } else if (FAIL_GRADES.includes(rawInput) || parseFloat(rawInput) === 0) {
      gp = 0;
      isPending = true;
      failedSet.add(subject.name || 'Unnamed Subject');
    } else {
      gp = parseFloat(rawInput);
      if (Number.isNaN(gp)) gp = 0;
      if (gp > 10) gp = gp / 10; // Normalize marks out of 100 to 10-point scale
      if (gp < 5 && gp > 0) {
        isPending = true;
        failedSet.add(subject.name || 'Unnamed Subject');
      }
    }

    return { ...subject, parsedGP: gp, creditGP: credits * gp };
  });
  return { rows, isPending };
}

function computeStats(processedRows, activeMethod) {
  let gpa = 0;
  let totalPoints = 0;
  let totalCredits = 0;
  const count = processedRows.length;
  if (count === 0) return { gpa, totalPoints, totalCredits, count };

  if (activeMethod === 'equal') {
    totalPoints = processedRows.reduce((sum, row) => sum + row.parsedGP, 0);
    totalCredits = count;
    gpa = totalPoints / count;
  } else {
    totalPoints = processedRows.reduce((sum, row) => sum + row.creditGP, 0);
    totalCredits = processedRows.reduce((sum, row) => sum + (parseFloat(row.credits) || 1), 0);
    gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  }
  return { gpa, totalPoints, totalCredits, count };
}

export default function CgpaCalculatorScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [activeMethod, setActiveMethod] = useState('slab');
  const [activeSemester, setActiveSemester] = useState(1);
  const [semestersData, setSemestersData] = useState({ 1: getEmptySubjects() });

  const [courseDurationYears, setCourseDurationYears] = useState(4);
  const [quickSemesters, setQuickSemesters] = useState(
    Array.from({ length: 8 }, (_, i) => ({ semesterNumber: i + 1, sgpa: '', creditsEarned: '' }))
  );
  const [quickOverallCgpa, setQuickOverallCgpa] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCgpa();
        if (cancelled || !res?.data) return;
        if (res.data.semestersData && Object.keys(res.data.semestersData).length > 0) {
          setSemestersData(res.data.semestersData);
        }
        if (res.data.activeMethod) {
          setActiveMethod(res.data.activeMethod);
        }
      } catch {
        // Best-effort preload — a blank calculator is a fine starting point.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!semestersData[activeSemester]) {
      setSemestersData((prev) => ({ ...prev, [activeSemester]: getEmptySubjects() }));
    }
  }, [activeSemester, semestersData]);

  useEffect(() => {
    if (activeMethod !== 'quick') return;
    let totalP = 0;
    let totalC = 0;
    quickSemesters.forEach((s) => {
      const sg = parseFloat(s.sgpa);
      const cr = parseFloat(s.creditsEarned) || 1;
      if (!Number.isNaN(sg) && sg > 0) {
        totalP += sg * cr;
        totalC += cr;
      }
    });
    setQuickOverallCgpa(totalC > 0 ? Math.round((totalP / totalC) * 100) / 100 : 0);
  }, [quickSemesters, activeMethod]);

  const currentSubjects = semestersData[activeSemester] || [];

  const calculation = useMemo(() => {
    if (activeMethod === 'quick') return null;

    let allValidSubjects = [];
    let currentSemValidSubjects = [];

    Object.entries(semestersData).forEach(([semString, subjects]) => {
      const valid = subjects.filter((s) => (s.input || '').toString().trim() !== '');
      allValidSubjects = allValidSubjects.concat(valid);
      if (parseInt(semString, 10) === activeSemester) currentSemValidSubjects = valid;
    });

    if (allValidSubjects.length === 0) return null;

    const failedSet = new Set();
    const { rows: processedAll, isPending: pendingAll } = processSubjects(allValidSubjects, activeMethod, failedSet);
    const { rows: processedCurrent, isPending: pendingCurrent } = processSubjects(
      currentSemValidSubjects,
      activeMethod,
      failedSet
    );
    const isPending = pendingAll || pendingCurrent;

    if (isPending) {
      return { isPending: true, failedSubjects: Array.from(failedSet), rows: processedCurrent };
    }

    const statsAll = computeStats(processedAll, activeMethod);
    const statsCurrent = computeStats(processedCurrent, activeMethod);

    return {
      isPending: false,
      cgpa: Math.round(statsAll.gpa * 100) / 100,
      sgpa: Math.round(statsCurrent.gpa * 100) / 100,
      percentage: Math.round(statsAll.gpa * 10 * 10) / 10,
      totalPoints: statsAll.totalPoints,
      totalCredits: statsAll.totalCredits,
      totalSubjects: statsAll.count,
      rows: processedCurrent,
    };
  }, [semestersData, activeMethod, activeSemester]);

  const handleDurationChange = (years) => {
    setCourseDurationYears(years);
    const targetSemesters = years * 2;
    setQuickSemesters((prev) => {
      if (prev.length === targetSemesters) return prev;
      if (prev.length > targetSemesters) return prev.slice(0, targetSemesters);
      const next = [...prev];
      for (let i = prev.length; i < targetSemesters; i += 1) {
        next.push({ semesterNumber: i + 1, sgpa: '', creditsEarned: '' });
      }
      return next;
    });
  };

  const handleQuickChange = (index, field, value) => {
    setQuickSemesters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddSubject = () => {
    setSemestersData((prev) => ({
      ...prev,
      [activeSemester]: [...(prev[activeSemester] || []), { id: nextId(), code: '', name: '', input: '', credits: '' }],
    }));
  };

  const handleRemoveSubject = (id) => {
    setSemestersData((prev) => ({
      ...prev,
      [activeSemester]: (prev[activeSemester] || []).filter((s) => s.id !== id),
    }));
  };

  const handleSubjectChange = (id, field, value) => {
    setSemestersData((prev) => ({
      ...prev,
      [activeSemester]: (prev[activeSemester] || []).map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const handleClearSemester = () => {
    Alert.alert('Clear semester?', `All subjects in Semester ${activeSemester} will be reset.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => setSemestersData((prev) => ({ ...prev, [activeSemester]: getEmptySubjects() })),
      },
    ]);
  };

  const handleSave = async () => {
    if (!calculation || calculation.isPending) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveCgpa({
        activeMethod,
        semestersData,
        cgpa: calculation.cgpa,
        percentage: calculation.percentage,
        totalPoints: calculation.totalPoints,
        totalCredits: calculation.totalCredits,
        totalSubjects: calculation.totalSubjects,
      });
      Alert.alert('Saved', 'Your CGPA result has been saved to your profile.');
    } catch (err) {
      setSaveError(err?.data?.message || err?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputLabel = activeMethod === 'slab' ? 'Grade' : 'Marks / GP';
  const inputPlaceholder = activeMethod === 'slab' ? 'e.g. O, A+' : 'e.g. 88';

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
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Academic tools</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>CGPA Calculator</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ gap: 8 }}>
          {METHODS.map((m) => {
            const active = activeMethod === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setActiveMethod(m.id)}
                style={[
                  styles.methodChip,
                  {
                    backgroundColor: active ? themeColors.primaryBright : themeColors.card,
                    borderColor: active ? themeColors.primaryBright : themeColors.border,
                  },
                ]}
              >
                <Text style={[styles.methodChipText, { color: active ? '#FFFFFF' : themeColors.text }]}>{m.name}</Text>
                <Text style={[styles.methodChipBadge, { color: active ? 'rgba(255,255,255,0.8)' : themeColors.textMuted }]}>
                  {m.badge}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            <SkeletonBox width="100%" height={120} borderRadius={18} />
            <SkeletonBox width="100%" height={80} borderRadius={18} />
          </View>
        ) : activeMethod === 'quick' ? (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>COURSE DURATION</Text>
            <View style={styles.durationRow}>
              {[2, 3, 4, 5].map((years) => {
                const active = courseDurationYears === years;
                return (
                  <Pressable
                    key={years}
                    onPress={() => handleDurationChange(years)}
                    style={[
                      styles.durationChip,
                      {
                        backgroundColor: active ? themeColors.primaryBright : themeColors.card,
                        borderColor: active ? themeColors.primaryBright : themeColors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : themeColors.text, fontSize: 12.5, fontWeight: '700' }}>
                      {years}y
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ gap: 10, marginTop: 16 }}>
              {quickSemesters.map((s, idx) => (
                <View
                  key={s.semesterNumber}
                  style={[styles.quickRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                >
                  <Text style={[styles.quickSemLabel, { color: themeColors.text }]}>Sem {s.semesterNumber}</Text>
                  <TextInput
                    value={s.sgpa}
                    onChangeText={(v) => handleQuickChange(idx, 'sgpa', v)}
                    placeholder="SGPA"
                    placeholderTextColor={themeColors.textMuted}
                    keyboardType="decimal-pad"
                    style={[styles.quickInput, { color: themeColors.text, borderColor: themeColors.border }]}
                  />
                  <TextInput
                    value={s.creditsEarned}
                    onChangeText={(v) => handleQuickChange(idx, 'creditsEarned', v)}
                    placeholder="Credits"
                    placeholderTextColor={themeColors.textMuted}
                    keyboardType="numeric"
                    style={[styles.quickInput, { color: themeColors.text, borderColor: themeColors.border }]}
                  />
                </View>
              ))}
            </View>

            <View style={[styles.resultCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: 16 }]}>
              <Text style={[styles.resultLabel, { color: themeColors.textMuted }]}>OVERALL CGPA</Text>
              <Text style={[styles.resultBig, { color: themeColors.primaryBright }]}>
                {quickOverallCgpa.toFixed(2)}
                <Text style={[styles.resultUnit, { color: themeColors.textMuted }]}> /10</Text>
              </Text>
            </View>

            <Text style={[styles.noteText, { color: themeColors.textMuted }]}>
              Quick Entry is calculated on this device only and isn't saved to your profile.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>SEMESTER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
              {SEMESTERS.map((sem) => {
                const active = activeSemester === sem;
                return (
                  <Pressable
                    key={sem}
                    onPress={() => setActiveSemester(sem)}
                    style={[
                      styles.semChip,
                      {
                        backgroundColor: active ? themeColors.primaryBright : themeColors.card,
                        borderColor: active ? themeColors.primaryBright : themeColors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : themeColors.text, fontSize: 12.5, fontWeight: '700' }}>
                      {sem}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ gap: 12, marginTop: 8 }}>
              {currentSubjects.map((subject) => (
                <View
                  key={subject.id}
                  style={[styles.subjectCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                >
                  <View style={styles.subjectTop}>
                    <TextInput
                      value={subject.name}
                      onChangeText={(v) => handleSubjectChange(subject.id, 'name', v)}
                      placeholder="Subject name"
                      placeholderTextColor={themeColors.textMuted}
                      style={[styles.subjectNameInput, { color: themeColors.text }]}
                    />
                    <Pressable onPress={() => handleRemoveSubject(subject.id)} hitSlop={8}>
                      <Feather name="trash-2" size={16} color={themeColors.danger} />
                    </Pressable>
                  </View>
                  <View style={styles.subjectRow}>
                    <TextInput
                      value={subject.code}
                      onChangeText={(v) => handleSubjectChange(subject.id, 'code', v)}
                      placeholder="Code"
                      placeholderTextColor={themeColors.textMuted}
                      autoCapitalize="characters"
                      style={[styles.subjectFieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
                    />
                    <TextInput
                      value={subject.input}
                      onChangeText={(v) => handleSubjectChange(subject.id, 'input', v)}
                      placeholder={inputPlaceholder}
                      placeholderTextColor={themeColors.textMuted}
                      autoCapitalize="characters"
                      style={[styles.subjectFieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
                    />
                    <TextInput
                      value={subject.credits}
                      onChangeText={(v) => handleSubjectChange(subject.id, 'credits', v)}
                      placeholder="Credits"
                      placeholderTextColor={themeColors.textMuted}
                      keyboardType="numeric"
                      style={[styles.subjectFieldInput, { color: themeColors.text, borderColor: themeColors.border, flex: 0.7 }]}
                    />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.subjectActionsRow}>
              <Pressable onPress={handleAddSubject} style={[styles.smallBtn, { borderColor: themeColors.border }]}>
                <Feather name="plus" size={14} color={themeColors.text} />
                <Text style={[styles.smallBtnText, { color: themeColors.text }]}>Add Subject</Text>
              </Pressable>
              <Pressable onPress={handleClearSemester} style={[styles.smallBtn, { borderColor: themeColors.border }]}>
                <Feather name="rotate-ccw" size={14} color={themeColors.danger} />
                <Text style={[styles.smallBtnText, { color: themeColors.danger }]}>Clear</Text>
              </Pressable>
            </View>

            <Text style={[styles.hintText, { color: themeColors.textMuted }]}>
              {inputLabel} field accepts {activeMethod === 'slab' ? 'letter grades (O, A+, A, B+, B, C) or arrear codes (RA, SA, AB, W, U, F)' : 'marks out of 100 or a grade point out of 10'}.
            </Text>

            {calculation?.isPending ? (
              <View style={[styles.warningCard, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', borderColor: themeColors.danger }]}>
                <Feather name="alert-triangle" size={18} color={themeColors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.warningTitle, { color: themeColors.danger }]}>Needs attention</Text>
                  <Text style={[styles.warningText, { color: themeColors.textMuted }]}>
                    {calculation.failedSubjects.slice(0, 4).join(', ')}
                    {calculation.failedSubjects.length > 4 ? `, +${calculation.failedSubjects.length - 4} more` : ''}
                  </Text>
                </View>
              </View>
            ) : calculation ? (
              <View style={[styles.resultRow]}>
                <View style={[styles.resultCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, flex: 1 }]}>
                  <Text style={[styles.resultLabel, { color: themeColors.textMuted }]}>SEM {activeSemester} SGPA</Text>
                  <Text style={[styles.resultBig, { color: themeColors.text, fontSize: 24 }]}>{calculation.sgpa.toFixed(2)}</Text>
                </View>
                <View style={[styles.resultCard, { backgroundColor: themeColors.card, borderColor: themeColors.primaryBright, flex: 1.2 }]}>
                  <Text style={[styles.resultLabel, { color: themeColors.primaryBright }]}>CUMULATIVE CGPA</Text>
                  <Text style={[styles.resultBig, { color: themeColors.primaryBright }]}>
                    {calculation.cgpa.toFixed(2)}
                    <Text style={[styles.resultUnit, { color: themeColors.textMuted }]}> /10</Text>
                  </Text>
                </View>
                <View style={[styles.resultCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, flex: 1 }]}>
                  <Text style={[styles.resultLabel, { color: themeColors.textMuted }]}>PERCENTAGE</Text>
                  <Text style={[styles.resultBig, { color: themeColors.success, fontSize: 24 }]}>{calculation.percentage}%</Text>
                </View>
              </View>
            ) : (
              <View style={styles.empty}>
                <Feather name="percent" size={26} color={themeColors.iconMuted} />
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Enter your grades</Text>
                <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                  Fill in at least one subject's {inputLabel.toLowerCase()} to see your SGPA and CGPA.
                </Text>
              </View>
            )}

            {!!saveError && <Text style={[styles.errorText, { color: themeColors.danger }]}>{saveError}</Text>}

            <Pressable
              onPress={handleSave}
              disabled={!calculation || calculation.isPending || saving}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: themeColors.primaryBright,
                  opacity: !calculation || calculation.isPending || saving ? 0.5 : 1,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="check" size={16} color="#FFFFFF" />
              )}
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save & Sync to Profile'}</Text>
            </Pressable>
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

  scroll: { padding: 20, paddingBottom: 48 },

  chipRow: { flexGrow: 0 },
  methodChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, minWidth: 118 },
  methodChipText: { fontSize: 13, fontWeight: '800' },
  methodChipBadge: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  sectionLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, marginBottom: 4 },

  durationRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  durationChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },

  quickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 10,
  },
  quickSemLabel: { width: 56, fontSize: 12.5, fontWeight: '700' },
  quickInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },

  semChip: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  subjectCard: { borderWidth: 1, borderRadius: 16, padding: 14 },
  subjectTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  subjectNameInput: { flex: 1, fontSize: 14, fontWeight: '700', padding: 0 },
  subjectRow: { flexDirection: 'row', gap: 8 },
  subjectFieldInput: {
    flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12.5,
  },

  subjectActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
  },
  smallBtnText: { fontSize: 12.5, fontWeight: '700' },

  hintText: { fontSize: 11.5, lineHeight: 16, marginTop: 12 },

  warningCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 16,
  },
  warningTitle: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  warningText: { fontSize: 12, lineHeight: 17 },

  resultRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  resultCard: { borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  resultLabel: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6, textAlign: 'center' },
  resultBig: { fontSize: 28, fontWeight: '900' },
  resultUnit: { fontSize: 13, fontWeight: '700' },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, marginTop: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptyText: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },

  errorText: { fontSize: 12.5, fontWeight: '600', marginTop: 14, textAlign: 'center' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14, marginTop: 16,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '800' },

  noteText: { fontSize: 11.5, textAlign: 'center', marginTop: 14, lineHeight: 16 },
});
