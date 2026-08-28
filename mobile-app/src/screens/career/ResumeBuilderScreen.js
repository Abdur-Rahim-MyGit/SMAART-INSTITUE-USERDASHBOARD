/**
 * ResumeBuilderScreen — full CRUD against `back-end/routes/resumes.js` /
 * `models/Resume.js`. `ToolkitScreen.js` used to leave Resume Builder off its
 * grid on purpose ("no real mobile destination yet") — this is that
 * destination, wired into `AppStack` and Toolkit's grid in this same pass.
 *
 * `api/resumes.js`'s `exportResume` does NOT render a PDF — its own backend
 * route only registers a verification record and returns a verification URL
 * (metadata: holder name, status, a public verify link), not resume content.
 * The actual PDF web (front-end) app produces client-side via html2canvas,
 * which is exactly the pipeline `api/resumes.js`'s header comment already
 * says mobile isn't replicating. So there is no working "export to PDF"
 * button here — building one against `/export` would silently do nothing
 * useful. Full create/edit/list/delete is real and wired; export is called
 * out below as a known gap rather than faked.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SkeletonBox from '../../components/SkeletonBox';
import { listResumes, createResume, updateResume, deleteResume } from '../../api/resumes';

function blankResume(user) {
  return {
    versionName: 'My Resume',
    personalInfo: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      mobile: '',
      location: '',
      targetRole: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: { technical: '', soft: '', domain: '', ai: '', languages: '' },
    projects: [],
    achievements: [],
  };
}

const EXPERIENCE_FIELDS = [
  { key: 'role', label: 'Role / Title' },
  { key: 'company', label: 'Company' },
  { key: 'duration', label: 'Duration (e.g. Jun 2024 – Present)' },
  { key: 'location', label: 'Location' },
  { key: 'description', label: 'What you did', multiline: true },
];
const EDUCATION_FIELDS = [
  { key: 'degree', label: 'Degree / Program' },
  { key: 'institution', label: 'Institution' },
  { key: 'grade', label: 'Grade / CGPA' },
  { key: 'year', label: 'Year' },
  { key: 'location', label: 'Location' },
];
const PROJECT_FIELDS = [
  { key: 'title', label: 'Project title' },
  { key: 'description', label: 'Description', multiline: true },
  { key: 'link', label: 'Link (optional)' },
];
const ACHIEVEMENT_FIELDS = [
  { key: 'title', label: 'Achievement' },
  { key: 'description', label: 'Details', multiline: true },
  { key: 'link', label: 'Link (optional)' },
];

function Field({ label, themeColors, isDark, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={themeColors.textMuted}
        style={[
          styles.input,
          props.multiline && styles.inputMultiline,
          { color: themeColors.text, borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF' },
        ]}
        {...props}
      />
    </View>
  );
}

function RepeatingSection({ title, icon, items, fields, onChange, addLabel, themeColors, isDark }) {
  const update = (idx, key, value) => onChange(items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  const add = () => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, '']))]);
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Feather name={icon} size={14} color={themeColors.primaryBright} />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
        </View>
        <Pressable onPress={add} hitSlop={8} style={styles.addBtn}>
          <Feather name="plus" size={14} color={themeColors.primaryBright} />
          <Text style={[styles.addBtnText, { color: themeColors.primaryBright }]}>Add {addLabel}</Text>
        </Pressable>
      </View>

      {items.length === 0 && (
        <Text style={[styles.emptyHint, { color: themeColors.textMuted }]}>Nothing added yet.</Text>
      )}

      {items.map((item, idx) => (
        <View key={idx} style={[styles.repeatCard, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}>
          <Pressable onPress={() => remove(idx)} hitSlop={8} style={styles.removeBtn}>
            <Feather name="trash-2" size={13} color={themeColors.danger} />
          </Pressable>
          {fields.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              value={item[f.key] || ''}
              onChangeText={(v) => update(idx, f.key, v)}
              multiline={f.multiline}
              themeColors={themeColors}
              isDark={isDark}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function ResumeBuilderScreen({ navigation }) {
  const { user } = useAuth();
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState('list'); // 'list' | 'edit'
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await listResumes();
      setResumes(res?.data || []);
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (mode === 'list') load();
    }, [mode, load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openNew = () => {
    setCurrent(blankResume(user));
    setMode('edit');
  };

  const openEdit = (resume) => {
    setCurrent(JSON.parse(JSON.stringify(resume)));
    setMode('edit');
  };

  const patch = (key, value) => setCurrent((prev) => ({ ...prev, [key]: value }));
  const patchNested = (section, key, value) =>
    setCurrent((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));

  const save = async () => {
    if (!current.personalInfo?.fullName?.trim()) {
      Alert.alert('Name required', 'Add your full name before saving.');
      return;
    }
    setSaving(true);
    try {
      if (current._id) {
        await updateResume(current._id, current);
      } else {
        await createResume(current);
      }
      setMode('list');
      load();
    } catch (err) {
      Alert.alert("Couldn't save", err?.data?.message || err?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (resume) => {
    Alert.alert('Delete this resume?', `"${resume.versionName || 'Untitled'}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const previous = resumes;
          setResumes((prev) => prev.filter((r) => r._id !== resume._id));
          try {
            await deleteResume(resume._id);
          } catch {
            setResumes(previous);
            Alert.alert("Couldn't delete", 'Please try again.');
          }
        },
      },
    ]);
  };

  if (mode === 'edit' && current) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top', 'bottom']}>
        <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <Pressable
            onPress={() => setMode('list')}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: themeColors.border }]}
          >
            <Feather name="arrow-left" size={19} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
            {current._id ? 'Edit Resume' : 'New Resume'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Field label="Resume name" value={current.versionName} onChangeText={(v) => patch('versionName', v)} themeColors={themeColors} isDark={isDark} placeholder="e.g. Frontend Developer Resume" />

          <Text style={[styles.groupLabel, { color: themeColors.textMuted }]}>PERSONAL INFO</Text>
          <Field label="Full name" value={current.personalInfo.fullName} onChangeText={(v) => patchNested('personalInfo', 'fullName', v)} themeColors={themeColors} isDark={isDark} />
          <Field label="Target role" value={current.personalInfo.targetRole} onChangeText={(v) => patchNested('personalInfo', 'targetRole', v)} themeColors={themeColors} isDark={isDark} placeholder="e.g. Frontend Developer" />
          <Field label="Email" value={current.personalInfo.email} onChangeText={(v) => patchNested('personalInfo', 'email', v)} themeColors={themeColors} isDark={isDark} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Mobile" value={current.personalInfo.mobile} onChangeText={(v) => patchNested('personalInfo', 'mobile', v)} themeColors={themeColors} isDark={isDark} keyboardType="phone-pad" />
          <Field label="Location" value={current.personalInfo.location} onChangeText={(v) => patchNested('personalInfo', 'location', v)} themeColors={themeColors} isDark={isDark} />
          <Field label="LinkedIn URL" value={current.personalInfo.linkedinUrl} onChangeText={(v) => patchNested('personalInfo', 'linkedinUrl', v)} themeColors={themeColors} isDark={isDark} autoCapitalize="none" />
          <Field label="GitHub URL" value={current.personalInfo.githubUrl} onChangeText={(v) => patchNested('personalInfo', 'githubUrl', v)} themeColors={themeColors} isDark={isDark} autoCapitalize="none" />
          <Field label="Portfolio URL" value={current.personalInfo.portfolioUrl} onChangeText={(v) => patchNested('personalInfo', 'portfolioUrl', v)} themeColors={themeColors} isDark={isDark} autoCapitalize="none" />

          <Text style={[styles.groupLabel, { color: themeColors.textMuted }]}>SUMMARY</Text>
          <Field label="Professional summary" value={current.summary} onChangeText={(v) => patch('summary', v)} themeColors={themeColors} isDark={isDark} multiline />

          <RepeatingSection
            title="Experience" icon="briefcase" addLabel="role"
            items={current.experience} fields={EXPERIENCE_FIELDS}
            onChange={(v) => patch('experience', v)} themeColors={themeColors} isDark={isDark}
          />
          <RepeatingSection
            title="Education" icon="book-open" addLabel="entry"
            items={current.education} fields={EDUCATION_FIELDS}
            onChange={(v) => patch('education', v)} themeColors={themeColors} isDark={isDark}
          />

          <Text style={[styles.groupLabel, { color: themeColors.textMuted }]}>SKILLS</Text>
          <Field label="Technical skills" value={current.skills.technical} onChangeText={(v) => patchNested('skills', 'technical', v)} themeColors={themeColors} isDark={isDark} placeholder="Comma-separated" />
          <Field label="Soft skills" value={current.skills.soft} onChangeText={(v) => patchNested('skills', 'soft', v)} themeColors={themeColors} isDark={isDark} placeholder="Comma-separated" />
          <Field label="Domain knowledge" value={current.skills.domain} onChangeText={(v) => patchNested('skills', 'domain', v)} themeColors={themeColors} isDark={isDark} placeholder="Comma-separated" />
          <Field label="AI / tools" value={current.skills.ai} onChangeText={(v) => patchNested('skills', 'ai', v)} themeColors={themeColors} isDark={isDark} placeholder="Comma-separated" />
          <Field label="Languages" value={current.skills.languages} onChangeText={(v) => patchNested('skills', 'languages', v)} themeColors={themeColors} isDark={isDark} placeholder="Comma-separated" />

          <RepeatingSection
            title="Projects" icon="folder" addLabel="project"
            items={current.projects} fields={PROJECT_FIELDS}
            onChange={(v) => patch('projects', v)} themeColors={themeColors} isDark={isDark}
          />
          <RepeatingSection
            title="Achievements" icon="award" addLabel="achievement"
            items={current.achievements} fields={ACHIEVEMENT_FIELDS}
            onChange={(v) => patch('achievements', v)} themeColors={themeColors} isDark={isDark}
          />

          <Pressable
            onPress={save}
            disabled={saving}
            style={[styles.saveBtn, { backgroundColor: themeColors.primaryBright, opacity: saving ? 0.6 : 1 }]}
          >
            {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveBtnText}>Save Resume</Text>}
          </Pressable>

          <Text style={[styles.exportNote, { color: themeColors.textMuted }]}>
            PDF export isn't available from the app yet — the web dashboard renders the printable
            version. Your resume is saved either way and reachable from both.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: themeColors.border }]}
        >
          <Feather name="arrow-left" size={19} color={themeColors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: themeColors.text }]}>Resume Builder</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>Build and manage ATS-friendly resumes</Text>
        </View>
        <Pressable onPress={openNew} hitSlop={10} style={[styles.newBtn, { backgroundColor: themeColors.primaryBright }]}>
          <Feather name="plus" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primaryBright} colors={[themeColors.primaryBright]} />}
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            {[0, 1].map((i) => <SkeletonBox key={i} width="100%" height={90} borderRadius={16} />)}
          </View>
        ) : resumes.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIconWrap, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Feather name="file-text" size={28} color={themeColors.primaryBright} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No resumes yet</Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              Build an ATS-friendly resume from your profile and course achievements.
            </Text>
            <Pressable onPress={openNew} style={[styles.emptyBtn, { backgroundColor: themeColors.primaryBright }]}>
              <Text style={styles.emptyBtnText}>Create your first resume</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {resumes.map((resume) => (
              <Pressable
                key={resume._id}
                onPress={() => openEdit(resume)}
                style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={1}>
                    {resume.versionName || 'Untitled Resume'}
                  </Text>
                  <Text style={[styles.cardMeta, { color: themeColors.textMuted }]} numberOfLines={1}>
                    {resume.personalInfo?.targetRole || 'No target role set'} · Updated{' '}
                    {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}
                  </Text>
                  {typeof resume.atsScore === 'number' && resume.atsScore > 0 && (
                    <View style={[styles.atsPill, { backgroundColor: `${themeColors.primaryBright}18` }]}>
                      <Text style={[styles.atsPillText, { color: themeColors.primaryBright }]}>ATS score {resume.atsScore}</Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={() => remove(resume)} hitSlop={10} style={styles.cardDelete}>
                  <Feather name="trash-2" size={15} color={themeColors.danger} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  newBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  scroll: { padding: 20, paddingBottom: 50 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 30 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyBtn: { marginTop: 10, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },

  card: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 16, padding: 15 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardMeta: { fontSize: 11.5, fontWeight: '600', marginTop: 3 },
  atsPill: { alignSelf: 'flex-start', marginTop: 8, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  atsPillText: { fontSize: 10.5, fontWeight: '800' },
  cardDelete: { padding: 4 },

  groupLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 20, marginBottom: 8 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13.5, fontWeight: '500' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },

  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 13, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 12, fontWeight: '700' },
  emptyHint: { fontSize: 12, fontWeight: '500', fontStyle: 'italic', marginBottom: 8 },
  repeatCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  removeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 4 },

  saveBtn: { marginTop: 26, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },
  exportNote: { fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 14, paddingHorizontal: 10 },
});
