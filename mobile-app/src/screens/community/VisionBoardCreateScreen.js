/**
 * VisionBoardCreateScreen — plain form to create a new vision board.
 *
 * Web's `VisionBoardGalleryPro` only collects title/description here, then
 * defers the actual create call to the drag-and-drop canvas editor
 * (`VisionBoardEditorPro.jsx`) which flattens the canvas into `collageImage`
 * before POSTing. Mobile has no editor step, so this form collects title,
 * description, and the two goal lists directly and calls
 * `POST /api/vision-board-pro` immediately — no cover-photo picker this pass
 * (expo-image-picker isn't an installed dependency yet; see deferred notes).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
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
import { visionBoardAPI } from '../../api/visionBoard';

const TITLE_LIMIT = 50;
const DESCRIPTION_LIMIT = 250;

function AnimatedSection({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function PressCard({ onPress, disabled, style, children }) {
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

function GoalEditor({ label, icon, goals, setGoals, placeholder, themeColors, isDark }) {
  const updateGoal = (index, value) => {
    setGoals((prev) => prev.map((g, i) => (i === index ? value : g)));
  };
  const removeGoal = (index) => {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  };
  const addGoal = () => {
    setGoals((prev) => [...prev, '']);
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.sectionHead}>
        <Feather name={icon} size={13} color={themeColors.primaryBright} />
        <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{label}</Text>
      </View>

      {goals.map((goal, i) => (
        <View key={i} style={styles.goalRow}>
          <TextInput
            value={goal}
            onChangeText={(v) => updateGoal(i, v)}
            placeholder={placeholder}
            placeholderTextColor={themeColors.textMuted}
            style={[
              styles.goalInput,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                color: themeColors.text,
              },
            ]}
          />
          <Pressable
            onPress={() => removeGoal(i)}
            hitSlop={8}
            style={[styles.removeBtn, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}
          >
            <Feather name="x" size={14} color={themeColors.danger} />
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={addGoal}
        style={[
          styles.addBtn,
          { borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#EAF7FD' },
        ]}
      >
        <Feather name="plus" size={14} color={themeColors.primaryBright} />
        <Text style={[styles.addBtnText, { color: themeColors.primaryBright }]}>Add goal</Text>
      </Pressable>
    </View>
  );
}

export default function VisionBoardCreateScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortTermGoals, setShortTermGoals] = useState(['']);
  const [longTermGoals, setLongTermGoals] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = title.trim().length > 0 && !saving;

  const submit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Give your vision board a title.');
      return;
    }
    if (trimmedTitle.length > TITLE_LIMIT) {
      setError(`Title must be ${TITLE_LIMIT} characters or fewer.`);
      return;
    }
    if (description.trim().length > DESCRIPTION_LIMIT) {
      setError(`Description must be ${DESCRIPTION_LIMIT} characters or fewer.`);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const payload = {
        title: trimmedTitle,
        description: description.trim(),
        shortTermGoals: shortTermGoals.map((g) => g.trim()).filter(Boolean),
        longTermGoals: longTermGoals.map((g) => g.trim()).filter(Boolean),
      };
      const res = await visionBoardAPI.createVisionBoard(payload);
      const newId = res?.data?._id;
      if (newId) {
        navigation.replace('VisionBoardDetail', { id: newId });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      if (err?.data?.maxReached) {
        Alert.alert(
          'Board limit reached',
          err?.data?.message || `You can only save up to ${err?.data?.maxAllowed ?? 3} vision boards. Delete one first.`
        );
      } else {
        setError(err?.data?.message || err?.message || 'Could not create your vision board. Try again.');
      }
    } finally {
      setSaving(false);
    }
  };

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
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Manifest your future</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>New Vision Board</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!!error && (
            <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2' }]}>
              <Feather name="alert-circle" size={14} color={themeColors.danger} />
              <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
            </View>
          )}

          <AnimatedSection delay={0}>
            <View style={{ gap: 8 }}>
              <View style={styles.fieldHead}>
                <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Title</Text>
                <Text style={[styles.charCount, { color: themeColors.iconMuted }]}>
                  {title.length}/{TITLE_LIMIT}
                </Text>
              </View>
              <TextInput
                value={title}
                onChangeText={setTitle}
                maxLength={TITLE_LIMIT}
                placeholder="e.g. My 2027 Vision"
                placeholderTextColor={themeColors.textMuted}
                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
              />
            </View>
          </AnimatedSection>

          <AnimatedSection delay={60}>
            <View style={{ gap: 8, marginTop: 18 }}>
              <View style={styles.fieldHead}>
                <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Description</Text>
                <Text style={[styles.charCount, { color: themeColors.iconMuted }]}>
                  {description.length}/{DESCRIPTION_LIMIT}
                </Text>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                maxLength={DESCRIPTION_LIMIT}
                multiline
                placeholder="What does this vision board represent?"
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textarea,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text },
                ]}
              />
            </View>
          </AnimatedSection>

          <AnimatedSection delay={120}>
            <View style={{ marginTop: 22 }}>
              <GoalEditor
                label="Short-Term Goals"
                icon="zap"
                goals={shortTermGoals}
                setGoals={setShortTermGoals}
                placeholder="e.g. Finish my portfolio site"
                themeColors={themeColors}
                isDark={isDark}
              />
            </View>
          </AnimatedSection>

          <AnimatedSection delay={180}>
            <View style={{ marginTop: 22 }}>
              <GoalEditor
                label="Long-Term Goals"
                icon="flag"
                goals={longTermGoals}
                setGoals={setLongTermGoals}
                placeholder="e.g. Land a role as a data analyst"
                themeColors={themeColors}
                isDark={isDark}
              />
            </View>
          </AnimatedSection>

          <PressCard
            onPress={submit}
            disabled={!canSubmit}
            style={[
              styles.submitBtn,
              { backgroundColor: themeColors.primaryBright, opacity: canSubmit ? 1 : 0.5 },
            ]}
          >
            <Text style={styles.submitText}>{saving ? 'Creating…' : 'Create Vision Board'}</Text>
          </PressCard>
        </ScrollView>
      </KeyboardAvoidingView>
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

  scroll: { padding: 20, paddingBottom: 50 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, padding: 12, marginBottom: 18,
  },
  errorText: { flex: 1, fontSize: 12.5, fontWeight: '600' },

  fieldHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  charCount: { fontSize: 10.5, fontWeight: '700' },

  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontWeight: '600' },
  textarea: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 13.5, minHeight: 100, textAlignVertical: 'top',
  },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13.5, fontWeight: '500' },
  removeBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 11,
  },
  addBtnText: { fontSize: 12.5, fontWeight: '800' },

  submitBtn: { marginTop: 30, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },
});
