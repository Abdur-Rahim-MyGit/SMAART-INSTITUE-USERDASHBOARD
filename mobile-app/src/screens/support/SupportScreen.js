/**
 * SupportScreen — IT Support tickets + Grievance Redressal, in one screen.
 *
 * Port of `front-end/src/pages/SupportTicketsPage.jsx` and `GrievancesPage.jsx`
 * against the same `back-end/routes/tickets.js` / `grievances.js` endpoints.
 * Both web pages share the same New/History pill-tab shape, so they're folded
 * into one screen with a top-level IT Support / Grievances switch instead of
 * two separate stack screens — matches the single "Support & Grievances"
 * drawer entry this app already has.
 *
 * Deliberately dropped from the web version: file attachments (no
 * expo-image-picker/expo-document-picker dependency in this app yet — every
 * other new-screen pass in this codebase has made the same cut) and the ITSM
 * reference-number banner. Everything else — categories, priority, the
 * response thread, anonymous grievances, the closed/resolved reply lock —
 * matches the web behavior exactly.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SkeletonBox from '../../components/SkeletonBox';
import { ticketsAPI } from '../../api/tickets';
import { grievancesAPI } from '../../api/grievances';

const TICKET_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'account', label: 'Account' },
  { value: 'course', label: 'Course' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'course & assessment', label: 'Course & Assessment' },
  { value: 'career Direction', label: 'Career Direction' },
  { value: 'placement issue', label: 'Placement' },
  { value: 'certificates & badges issue', label: 'Certificates & Badges' },
  { value: 'billing', label: 'Billing' },
  { value: 'content', label: 'Course Content' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
];

const GRIEVANCE_CATEGORIES = [
  { value: 'placement', label: 'Placement' },
  { value: 'course', label: 'Course' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'badges', label: 'Badges' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'career-direction', label: 'Career Direction' },
  { value: 'skill-passport', label: 'Skill Passport' },
  { value: 'other-suggestion', label: 'Suggestion' },
];

const PRIORITIES = ['low', 'medium', 'high'];

function statusStyle(status, themeColors) {
  if (status === 'resolved') return { bg: `${themeColors.success}22`, fg: themeColors.success };
  if (status === 'in-progress') return { bg: `${themeColors.primaryBright}22`, fg: themeColors.primaryBright };
  if (status === 'open' || status === 'pending') return { bg: `${themeColors.warning}22`, fg: themeColors.warning };
  return { bg: `${themeColors.textMuted}22`, fg: themeColors.textMuted };
}

function StatusPill({ status, themeColors }) {
  const s = statusStyle(status, themeColors);
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.fg }]}>{String(status || '').replace('-', ' ')}</Text>
    </View>
  );
}

function Chips({ options, value, onChange, themeColors }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.chip,
              {
                borderColor: selected ? themeColors.primaryBright : themeColors.border,
                backgroundColor: selected ? `${themeColors.primaryBright}18` : 'transparent',
              },
            ]}
          >
            <Text style={[styles.chipText, { color: selected ? themeColors.primaryBright : themeColors.textMuted }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FieldLabel({ children, themeColors }) {
  return <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>{children}</Text>;
}

function TextField({ themeColors, isDark, ...props }) {
  return (
    <TextInput
      placeholderTextColor={themeColors.textMuted}
      style={[
        styles.input,
        props.multiline && styles.inputMultiline,
        { color: themeColors.text, borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF' },
      ]}
      {...props}
    />
  );
}

export default function SupportScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [section, setSection] = useState('tickets'); // 'tickets' | 'grievances'
  const [mode, setMode] = useState('create'); // 'create' | 'history'

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [grievances, setGrievances] = useState([]);
  const [grievancesLoading, setGrievancesLoading] = useState(false);

  const [ticketForm, setTicketForm] = useState({ title: '', description: '', category: 'technical', priority: 'medium' });
  const [grievanceForm, setGrievanceForm] = useState({ title: '', description: '', category: 'course', isAnonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [detail, setDetail] = useState(null); // { type: 'ticket'|'grievance', item }
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      // The server defaults to limit=10 with pagination this screen doesn't
      // render — request enough to show the full history.
      const res = await ticketsAPI.getMyTickets({ limit: 100 });
      setTickets(res.data || []);
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const loadGrievances = useCallback(async () => {
    setGrievancesLoading(true);
    try {
      const res = await grievancesAPI.getMyGrievances();
      setGrievances(res.data || []);
    } catch {
      setGrievances([]);
    } finally {
      setGrievancesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'history') return;
    if (section === 'tickets') loadTickets();
    else loadGrievances();
  }, [mode, section, loadTickets, loadGrievances]);

  const submitTicket = async () => {
    const title = ticketForm.title.trim();
    const description = ticketForm.description.trim();
    if (title.length < 5) return setFormError('Title needs at least 5 characters.');
    if (description.length < 10) return setFormError('Description needs at least 10 characters.');
    setFormError('');
    setSubmitting(true);
    try {
      await ticketsAPI.createTicket({
        title,
        description,
        category: ticketForm.category,
        priority: ticketForm.priority,
      });
      setTicketForm({ title: '', description: '', category: 'technical', priority: 'medium' });
      setMode('history');
      loadTickets();
    } catch (err) {
      setFormError(err?.data?.error || err?.message || "Couldn't submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitGrievance = async () => {
    const title = grievanceForm.title.trim();
    const description = grievanceForm.description.trim();
    if (!title) return setFormError('Title is required.');
    if (!description) return setFormError('Description is required.');
    setFormError('');
    setSubmitting(true);
    try {
      await grievancesAPI.createGrievance({
        title,
        description,
        category: grievanceForm.category,
        isAnonymous: grievanceForm.isAnonymous,
      });
      setGrievanceForm({ title: '', description: '', category: 'course', isAnonymous: false });
      setMode('history');
      loadGrievances();
    } catch (err) {
      setFormError(err?.data?.error || err?.message || "Couldn't submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (type, item) => {
    setReplyText('');
    setDetail({ type, item });
  };

  const sendReply = async () => {
    const message = replyText.trim();
    if (!message || !detail) return;
    setReplying(true);
    try {
      let updated;
      if (detail.type === 'ticket') {
        const res = await ticketsAPI.addResponse(detail.item._id, message);
        updated = res.data;
        setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      } else {
        const res = await grievancesAPI.respond(detail.item._id, message);
        updated = res.data;
        setGrievances((prev) => prev.map((g) => (g._id === updated._id ? updated : g)));
      }
      setDetail({ type: detail.type, item: updated });
      setReplyText('');
    } catch (err) {
      Alert.alert("Couldn't send", err?.data?.error || err?.message || 'Please try again.');
    } finally {
      setReplying(false);
    }
  };

  const list = section === 'tickets' ? tickets : grievances;
  const listLoading = section === 'tickets' ? ticketsLoading : grievancesLoading;
  const replyLocked = detail?.type === 'ticket' && (detail.item.status === 'closed' || detail.item.status === 'resolved');

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
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
          <Text style={[styles.title, { color: themeColors.text }]}>Support & Grievances</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>We're here to help</Text>
        </View>
      </View>

      <View style={styles.segmentWrap}>
        <View style={[styles.segment, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {[
            { key: 'tickets', label: 'IT Support', icon: 'life-buoy' },
            { key: 'grievances', label: 'Grievances', icon: 'shield' },
          ].map((s) => {
            const selected = section === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => { setSection(s.key); setFormError(''); }}
                style={[styles.segmentBtn, selected && { backgroundColor: themeColors.primaryBright }]}
              >
                <Feather name={s.icon} size={14} color={selected ? '#FFFFFF' : themeColors.textMuted} />
                <Text style={[styles.segmentText, { color: selected ? '#FFFFFF' : themeColors.textMuted }]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tabRow}>
          {[
            { key: 'create', label: section === 'tickets' ? 'New Ticket' : 'Submit', icon: 'plus' },
            { key: 'history', label: 'History', icon: 'clock' },
          ].map((t) => {
            const selected = mode === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => { setMode(t.key); setFormError(''); }}
                style={[styles.tabBtn, { borderColor: themeColors.border }, selected && { borderColor: themeColors.text }]}
              >
                <Feather name={t.icon} size={12} color={selected ? themeColors.text : themeColors.textMuted} />
                <Text style={[styles.tabText, { color: selected ? themeColors.text : themeColors.textMuted }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          mode === 'history' ? (
            <RefreshControl
              refreshing={listLoading}
              onRefresh={section === 'tickets' ? loadTickets : loadGrievances}
              tintColor={themeColors.primaryBright}
              colors={[themeColors.primaryBright]}
            />
          ) : undefined
        }
      >
        {mode === 'create' ? (
          <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            {!!formError && (
              <View style={[styles.errorBanner, { backgroundColor: `${themeColors.danger}18` }]}>
                <Feather name="alert-circle" size={14} color={themeColors.danger} />
                <Text style={[styles.errorText, { color: themeColors.danger }]}>{formError}</Text>
              </View>
            )}

            {section === 'tickets' ? (
              <>
                <FieldLabel themeColors={themeColors}>Title</FieldLabel>
                <TextField
                  themeColors={themeColors}
                  isDark={isDark}
                  value={ticketForm.title}
                  onChangeText={(v) => setTicketForm((f) => ({ ...f, title: v }))}
                  placeholder="Short summary of the issue"
                  maxLength={100}
                />
                <FieldLabel themeColors={themeColors}>Description</FieldLabel>
                <TextField
                  themeColors={themeColors}
                  isDark={isDark}
                  value={ticketForm.description}
                  onChangeText={(v) => setTicketForm((f) => ({ ...f, description: v }))}
                  placeholder="What happened, and what did you expect instead?"
                  multiline
                  maxLength={2000}
                />
                <FieldLabel themeColors={themeColors}>Category</FieldLabel>
                <Chips
                  options={TICKET_CATEGORIES}
                  value={ticketForm.category}
                  onChange={(v) => setTicketForm((f) => ({ ...f, category: v }))}
                  themeColors={themeColors}
                />
                <FieldLabel themeColors={themeColors}>Priority</FieldLabel>
                <Chips
                  options={PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))}
                  value={ticketForm.priority}
                  onChange={(v) => setTicketForm((f) => ({ ...f, priority: v }))}
                  themeColors={themeColors}
                />
                <Pressable
                  onPress={submitTicket}
                  disabled={submitting}
                  style={[styles.submitBtn, { backgroundColor: themeColors.primaryBright, opacity: submitting ? 0.6 : 1 }]}
                >
                  {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.submitText}>Submit Ticket</Text>}
                </Pressable>
              </>
            ) : (
              <>
                <View style={[styles.infoCallout, { backgroundColor: `${themeColors.primaryBright}12` }]}>
                  <Feather name="shield" size={14} color={themeColors.primaryBright} />
                  <Text style={[styles.infoCalloutText, { color: themeColors.textMuted }]}>
                    Grievances go straight to SMAART Administration. Turn on anonymous mode to hide your identity.
                  </Text>
                </View>
                <FieldLabel themeColors={themeColors}>Title</FieldLabel>
                <TextField
                  themeColors={themeColors}
                  isDark={isDark}
                  value={grievanceForm.title}
                  onChangeText={(v) => setGrievanceForm((f) => ({ ...f, title: v }))}
                  placeholder="What's this grievance about?"
                  maxLength={100}
                />
                <FieldLabel themeColors={themeColors}>Description</FieldLabel>
                <TextField
                  themeColors={themeColors}
                  isDark={isDark}
                  value={grievanceForm.description}
                  onChangeText={(v) => setGrievanceForm((f) => ({ ...f, description: v }))}
                  placeholder="Describe the issue in detail"
                  multiline
                  maxLength={2000}
                />
                <FieldLabel themeColors={themeColors}>Category</FieldLabel>
                <Chips
                  options={GRIEVANCE_CATEGORIES}
                  value={grievanceForm.category}
                  onChange={(v) => setGrievanceForm((f) => ({ ...f, category: v }))}
                  themeColors={themeColors}
                />
                <View style={styles.anonRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: themeColors.text, marginBottom: 2 }]}>Submit anonymously</Text>
                    <Text style={[styles.anonHint, { color: themeColors.textMuted }]}>Hides your name from admins reviewing this.</Text>
                  </View>
                  <Switch
                    value={grievanceForm.isAnonymous}
                    onValueChange={(v) => setGrievanceForm((f) => ({ ...f, isAnonymous: v }))}
                    trackColor={{ false: themeColors.border, true: `${themeColors.primaryBright}80` }}
                    thumbColor={grievanceForm.isAnonymous ? themeColors.primaryBright : '#F4F3F4'}
                  />
                </View>
                <Pressable
                  onPress={submitGrievance}
                  disabled={submitting}
                  style={[styles.submitBtn, { backgroundColor: themeColors.primaryBright, opacity: submitting ? 0.6 : 1 }]}
                >
                  {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.submitText}>Submit Grievance</Text>}
                </Pressable>
              </>
            )}
          </View>
        ) : listLoading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <SkeletonBox key={i} width="100%" height={104} borderRadius={16} />
            ))}
          </View>
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIconWrap, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Feather name={section === 'tickets' ? 'life-buoy' : 'inbox'} size={28} color={themeColors.primaryBright} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              {section === 'tickets' ? 'No support tickets yet' : 'No grievances yet'}
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              {section === 'tickets'
                ? "You haven't raised any IT support requests."
                : "You haven't submitted anything to the grievance portal."}
            </Text>
            <Pressable onPress={() => setMode('create')} style={[styles.emptyBtn, { backgroundColor: themeColors.primaryBright }]}>
              <Text style={styles.emptyBtnText}>{section === 'tickets' ? 'Submit a Ticket' : 'Submit a Grievance'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {list.map((item) => {
              const idLabel = section === 'tickets' ? item.ticketId : item.grievanceId;
              return (
                <Pressable
                  key={item._id}
                  onPress={() => openDetail(section === 'tickets' ? 'ticket' : 'grievance', item)}
                  style={[styles.itemCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                >
                  <View style={[styles.itemBar, { backgroundColor: themeColors.primaryBright }]} />
                  <View style={{ flex: 1, paddingLeft: 10 }}>
                    <View style={styles.itemTop}>
                      <Text style={[styles.itemId, { color: themeColors.textMuted }]}>#{idLabel || item._id.slice(-6)}</Text>
                      <StatusPill status={item.status} themeColors={themeColors} />
                    </View>
                    {section === 'grievances' && item.isAnonymous && (
                      <Text style={[styles.anonBadge, { color: themeColors.primaryBright }]}>ANONYMOUS</Text>
                    )}
                    <Text style={[styles.itemTitle, { color: themeColors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.itemDesc, { color: themeColors.textMuted }]} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.itemFooter}>
                      <Text style={[styles.itemMeta, { color: themeColors.textMuted }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                      {item.responses?.length > 0 && (
                        <View style={styles.itemMetaRow}>
                          <Feather name="message-square" size={11} color={themeColors.primaryBright} />
                          <Text style={[styles.itemMeta, { color: themeColors.primaryBright }]}>
                            {item.responses.length} {item.responses.length === 1 ? 'response' : 'responses'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!detail} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalCard, { backgroundColor: themeColors.bg }]}
          >
            {detail && (
              <>
                <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemId, { color: themeColors.textMuted }]}>
                      #{(detail.type === 'ticket' ? detail.item.ticketId : detail.item.grievanceId) || detail.item._id.slice(-6)}
                    </Text>
                    <Text style={[styles.modalTitle, { color: themeColors.text }]}>{detail.item.title}</Text>
                  </View>
                  <StatusPill status={detail.item.status} themeColors={themeColors} />
                  <Pressable onPress={() => setDetail(null)} hitSlop={10} style={{ marginLeft: 12 }}>
                    <Feather name="x" size={20} color={themeColors.text} />
                  </Pressable>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalScroll}>
                  <Text style={[styles.modalDesc, { color: themeColors.textMuted }]}>{detail.item.description}</Text>

                  <Text style={[styles.groupLabel, { color: themeColors.textMuted, marginTop: 18 }]}>
                    {detail.item.responses?.length > 0 ? 'RESPONSES' : 'NO RESPONSES YET'}
                  </Text>
                  <View style={{ gap: 10, marginTop: 8 }}>
                    {(detail.item.responses || []).map((resp, idx) => {
                      // `respondedBy` is populated on list/reply responses; if
                      // it ever arrives as a raw id, fall back to comparing it
                      // against the signed-in user's id.
                      const isYou =
                        resp.respondedBy?.role === 'student' ||
                        String(resp.respondedBy?._id || resp.respondedBy || '') ===
                          String(user?._id || user?.id || '');
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.replyBubble,
                            {
                              backgroundColor: isYou ? `${themeColors.primaryBright}18` : themeColors.card,
                              borderColor: themeColors.border,
                              alignSelf: isYou ? 'flex-end' : 'flex-start',
                            },
                          ]}
                        >
                          <Text style={[styles.replyAuthor, { color: themeColors.textMuted }]}>
                            {isYou ? 'You' : resp.respondedBy?.fullName || 'Support Team'}
                          </Text>
                          <Text style={[styles.replyText, { color: themeColors.text }]}>{resp.message}</Text>
                          <Text style={[styles.replyTime, { color: themeColors.textMuted }]}>
                            {new Date(resp.respondedAt).toLocaleString()}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>

                {replyLocked ? (
                  <View style={[styles.lockedNote, { borderTopColor: themeColors.border }]}>
                    <Feather name="lock" size={12} color={themeColors.textMuted} />
                    <Text style={[styles.lockedText, { color: themeColors.textMuted }]}>
                      This ticket is {detail.item.status} — no further replies.
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.replyRow, { borderTopColor: themeColors.border }]}>
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Write a reply…"
                      placeholderTextColor={themeColors.textMuted}
                      style={[styles.replyInput, { color: themeColors.text, borderColor: themeColors.border }]}
                      multiline
                    />
                    <Pressable
                      onPress={sendReply}
                      disabled={replying || !replyText.trim()}
                      style={[styles.sendBtn, { backgroundColor: themeColors.primaryBright, opacity: replying || !replyText.trim() ? 0.5 : 1 }]}
                    >
                      {replying ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Feather name="send" size={16} color="#FFFFFF" />}
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 1 },

  segmentWrap: { paddingHorizontal: 20, paddingTop: 14, gap: 10 },
  segment: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 11 },
  segmentText: { fontSize: 12.5, fontWeight: '800' },

  tabRow: { flexDirection: 'row', gap: 8 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.2 },
  tabText: { fontSize: 12, fontWeight: '700' },

  scroll: { padding: 20, paddingBottom: 60 },

  formCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  errorBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, padding: 10, marginBottom: 14 },
  errorText: { fontSize: 12, fontWeight: '600', flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 7, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  inputMultiline: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1.2 },
  chipText: { fontSize: 12, fontWeight: '700' },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, marginBottom: 4 },
  anonHint: { fontSize: 11.5, fontWeight: '500' },
  infoCallout: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, padding: 12, marginBottom: 16 },
  infoCalloutText: { flex: 1, fontSize: 11.5, fontWeight: '500', lineHeight: 16 },
  submitBtn: { marginTop: 14, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 30 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyBtn: { marginTop: 10, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },

  itemCard: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 14, overflow: 'hidden' },
  itemBar: { width: 4, borderRadius: 2, marginRight: -4 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemId: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 10.5, fontWeight: '800', textTransform: 'capitalize' },
  anonBadge: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6, marginTop: 4 },
  itemTitle: { fontSize: 15, fontWeight: '800', marginTop: 6, marginBottom: 3 },
  itemDesc: { fontSize: 12.5, fontWeight: '500', lineHeight: 18, marginBottom: 8 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemMeta: { fontSize: 11, fontWeight: '600' },

  groupLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { height: '86%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginTop: 3 },
  modalScroll: { padding: 18, paddingBottom: 30 },
  modalDesc: { fontSize: 13.5, lineHeight: 20, fontWeight: '500' },

  replyBubble: { maxWidth: '85%', borderWidth: 1, borderRadius: 14, padding: 12 },
  replyAuthor: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 3 },
  replyText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  replyTime: { fontSize: 9.5, fontWeight: '600', marginTop: 5 },

  lockedNote: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 16, borderTopWidth: 1 },
  lockedText: { fontSize: 12, fontWeight: '600' },
  replyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 14, borderTopWidth: 1 },
  replyInput: { flex: 1, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, maxHeight: 90 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
