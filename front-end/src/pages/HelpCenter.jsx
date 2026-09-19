import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Headset, ShieldAlert, ShieldCheck, Plus, History, Loader2, Clock,
  MessageSquare, ChevronRight, Inbox, LifeBuoy, CheckCircle, Info,
} from "@/components/icons";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
import TicketForm from "@/components/tickets/TicketForm";
import TicketDetail from "@/components/tickets/TicketDetail";
import GrievanceForm from "@/components/grievances/GrievanceForm";
import GrievanceDetail from "@/components/grievances/GrievanceDetail";
import { getMyTickets } from "@/services/ticketApi";
import { getMyGrievances } from "@/services/grievanceApi";

// Same tokens as Settings / Skills Vault / Courses.
const SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const PANEL =
  "bg-[#F1F5F9] dark:bg-[#072036]/60 border border-[#d7ebf5] dark:border-white/10";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#072036] text-xs font-bold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white";
const EASE = [0.25, 0.1, 0.25, 1];

const TABS = ["support", "grievance"];

const STATUS_STYLE = {
  open: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  "in-progress": "bg-[#EAF7FD] text-[#045C9A] border-[#045C9A]/20 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8] dark:border-[#045C9A]/40",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  closed: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10",
};

const StatusChip = ({ status, t }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${STATUS_STYLE[status] || STATUS_STYLE.closed}`}>
    {t(`support_tickets_page.status_${String(status).replace("-", "_")}`, String(status).replace("-", " "))}
  </span>
);

/** One row in a history list (ticket or grievance). */
const HistoryRow = ({ item, refId, onOpen, t, i18n, anonymous }) => {
  const date = new Date(item.createdAt);
  const dateStr = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(i18n.language || "en-GB", { day: "numeric", month: "short", year: "numeric" });
  const n = item.responses?.length || 0;
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`group flex w-full items-start gap-3.5 rounded-xl px-4 py-3.5 text-left transition-colors hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] dark:hover:bg-[#045C9A]/10 ${PANEL}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#045C9A] shadow-sm dark:bg-[#0d3a5f] dark:text-[#A6D7E8]">
        {anonymous ? <ShieldCheck className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#35566b] dark:text-slate-400">#{refId}</span>
          <StatusChip status={item.status} t={t} />
          {anonymous && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#045C9A]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
              <ShieldCheck className="h-3 w-3" />
              {t("help_center.anonymous", "Anonymous")}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-[13.5px] font-extrabold text-[#072036] dark:text-white">{item.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-[#35566b] dark:text-slate-400">{item.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-[#35566b] dark:text-slate-400">
          {dateStr && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{dateStr}</span>
          )}
          {n > 0 && (
            <span className="inline-flex items-center gap-1 text-[#045C9A] dark:text-[#A6D7E8]">
              <MessageSquare className="h-3.5 w-3.5" />
              {t("help_center.responses", { count: n, defaultValue: `${n} ${n === 1 ? "response" : "responses"}` })}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
};

const EmptyState = ({ icon: Icon, title, desc, cta, onCta }) => (
  <div className={`flex flex-col items-center rounded-xl px-6 py-12 text-center ${PANEL}`}>
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#045C9A] shadow-sm dark:bg-[#0d3a5f] dark:text-[#A6D7E8]">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mt-4 text-sm font-extrabold text-[#072036] dark:text-white">{title}</h3>
    <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#35566b] dark:text-slate-400">{desc}</p>
    <button type="button" onClick={onCta} className={`${BTN_PRIMARY} mt-5 px-4 py-2`}>
      <Plus className="h-3.5 w-3.5" />
      {cta}
    </button>
  </div>
);

const Loading = ({ text }) => (
  <div className={`flex flex-col items-center rounded-xl py-16 ${PANEL}`}>
    <Loader2 className="h-6 w-6 animate-spin text-[#045C9A] dark:text-[#A6D7E8]" />
    <p className="mt-3 text-xs font-semibold text-[#35566b] dark:text-slate-400">{text}</p>
  </div>
);

/** Segmented "New | History" control shown in each tab's header. */
const Segmented = ({ value, onChange, newLabel, historyLabel, idPrefix }) => (
  <div className={`inline-flex rounded-xl p-1 ${PANEL}`} role="tablist" aria-label={`${newLabel} / ${historyLabel}`}>
    {[
      { id: "create", icon: Plus, label: newLabel },
      { id: "history", icon: History, label: historyLabel },
    ].map((opt) => {
      const active = value === opt.id;
      return (
        <button
          key={opt.id}
          id={`${idPrefix}-${opt.id}`}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(opt.id)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            active
              ? "bg-[#072036] text-white shadow-sm dark:bg-[#A6D7E8] dark:text-[#072036]"
              : "text-[#35566b] hover:text-[#072036] dark:text-slate-300 dark:hover:text-white"
          }`}
        >
          <opt.icon className="h-3.5 w-3.5" />
          {opt.label}
        </button>
      );
    })}
  </div>
);

const HelpCenter = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramTab = searchParams.get("tab");
  const activeTab = TABS.includes(paramTab) ? paramTab : "support";
  const setActiveTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "support") next.delete("tab"); else next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const [isDarkTheme, setIsDarkTheme] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  /* ── IT Support ──────────────────────────────────────────────── */
  const conversationData = location.state;
  const [initialDescription, setInitialDescription] = useState("");
  const [supportView, setSupportView] = useState("create");
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (conversationData?.messages) {
      const text = conversationData.messages
        .map((msg) => `**${msg.role === "user" ? "You" : "Support Bot"}:** ${msg.content}`)
        .join("\n\n");
      setInitialDescription(`**Previous Chat Conversation:**\n\n${text}\n\n---\n\n**Additional Information:**\n\n`);
    }
  }, [conversationData]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const response = await getMyTickets({});
      if (response?.success) setTickets(response.data || []);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoadingTickets(false);
    }
  }, []);
  useEffect(() => { if (activeTab === "support" && supportView === "history") fetchTickets(); }, [activeTab, supportView, fetchTickets]);

  const handleTicketSuccess = (ticket) => {
    setSuccessTicket(ticket);
    setSupportView("history");
    fetchTickets();
  };

  /* ── Grievances ──────────────────────────────────────────────── */
  const [grievanceView, setGrievanceView] = useState("create");
  const [grievances, setGrievances] = useState([]);
  const [loadingGrievances, setLoadingGrievances] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const fetchGrievances = useCallback(async () => {
    try {
      setLoadingGrievances(true);
      const response = await getMyGrievances();
      if (response?.success) setGrievances(response.data || []);
    } catch (error) {
      console.error("Failed to fetch grievances", error);
    } finally {
      setLoadingGrievances(false);
    }
  }, []);
  useEffect(() => { if (activeTab === "grievance" && grievanceView === "history") fetchGrievances(); }, [activeTab, grievanceView, fetchGrievances]);

  const handleGrievanceSuccess = () => {
    setGrievanceView("history");
    fetchGrievances();
  };

  const gTotal = grievances.length;
  const gOpen = grievances.filter((g) => g.status === "pending" || g.status === "in-progress").length;
  const gResolved = grievances.filter((g) => g.status === "resolved" || g.status === "closed").length;

  const tabMeta = {
    support: { icon: Headset, label: t("help_center.tab_support", "IT Support"), desc: t("help_center.tab_support_desc", "Technical, account, course and placement issues") },
    grievance: { icon: ShieldAlert, label: t("help_center.tab_grievance", "Grievance Redressal"), desc: t("help_center.tab_grievance_desc", "Formal complaints handled directly by SMAART Admin") },
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-transparent pb-8 transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
          <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
          <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
        </div>

        <main className="relative z-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">
            {/* Back button -- mobile only */}
            <div className="flex items-center sm:hidden">
              <button type="button" onClick={() => navigate("/dashboard")} className="group flex w-fit items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:group-hover:border-[#045C9A]/40">
                  <ArrowLeft className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
                  {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                </span>
              </button>
            </div>

            {/* Hero */}
            <motion.section
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className={`relative w-full overflow-hidden rounded-2xl ${SURFACE}`}
            >
              <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />
              <div className="relative z-10 flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
                <div className="flex items-center gap-4">
                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8] sm:flex">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
                      {t("help_center.title", "Help & Support")}
                    </h1>
                    <p className="mt-0.5 max-w-2xl text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                      {t("help_center.subtitle", "Raise IT support tickets or file a grievance with SMAART Administration, and track every response in one place.")}
                    </p>
                  </div>
                </div>
                {/* Section switcher lives in the hero: IT Support | Grievance Redressal */}
                <div
                  id="help-tabs"
                  role="tablist"
                  aria-label={t("help_center.title", "Help & Support")}
                  className={`flex shrink-0 gap-1 self-start rounded-xl p-1 sm:self-auto ${PANEL}`}
                >
                  {TABS.map((id) => {
                    const meta = tabMeta[id];
                    const active = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        id={`help-tab-${id}`}
                        aria-selected={active}
                        onClick={() => setActiveTab(id)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                          active
                            ? "bg-[#072036] text-white shadow-sm dark:bg-[#A6D7E8] dark:text-[#072036]"
                            : "text-[#35566b] hover:bg-white hover:text-[#072036] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                        }`}
                      >
                        <meta.icon className="h-4 w-4" />
                        <span className="whitespace-nowrap">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.section>

            {/* Panel */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className={`rounded-2xl ${SURFACE}`}
                aria-labelledby={`help-tab-${activeTab}`}
              >
                {activeTab === "support" ? (
                  <>
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d7ebf5] px-5 py-4 dark:border-white/10 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
                          <Headset className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-extrabold leading-tight text-[#072036] dark:text-white">{tabMeta.support.label}</h2>
                          <p className="text-xs text-[#35566b] dark:text-slate-400">{tabMeta.support.desc}</p>
                        </div>
                      </div>
                      <Segmented value={supportView} onChange={setSupportView} idPrefix="support" newLabel={t("help_center.new_ticket", "New Ticket")} historyLabel={t("help_center.my_tickets", "My Tickets")} />
                    </header>

                    <div className="px-5 py-5 sm:px-6">
                      {supportView === "create" ? (
                        <div className="space-y-5">
                          {successTicket?.itsmTicketNumber && (
                            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <div>
                                <p className="text-[13px] font-extrabold text-emerald-800 dark:text-emerald-300">{t("help_center.ticket_created", "Ticket created")}</p>
                                <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                                  {t("help_center.ticket_created_desc", { ref: successTicket.itsmTicketNumber, defaultValue: `Your reference number is ${successTicket.itsmTicketNumber}. Our support agents will respond shortly.` })}
                                </p>
                              </div>
                            </div>
                          )}
                          {conversationData?.messages && (
                            <div className={`flex items-start gap-3 rounded-xl px-4 py-3 ${PANEL}`}>
                              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                              <div>
                                <p className="text-[13px] font-extrabold text-[#072036] dark:text-white">{t("help_center.chat_attached", "Chat transcript attached")}</p>
                                <p className="text-xs text-[#35566b] dark:text-slate-400">{t("help_center.chat_attached_desc", "Your recent conversation with the Support Bot has been pre-filled below to speed up diagnosis.")}</p>
                              </div>
                            </div>
                          )}
                          <TicketForm
                            onSuccess={handleTicketSuccess}
                            onCancel={() => navigate("/dashboard")}
                            initialData={initialDescription ? { description: initialDescription } : undefined}
                          />
                        </div>
                      ) : loadingTickets ? (
                        <Loading text={t("support_tickets_page.loading_tickets", "Loading your tickets...")} />
                      ) : tickets.length === 0 ? (
                        <EmptyState icon={Inbox} title={t("help_center.no_tickets_title", "No support tickets yet")} desc={t("help_center.no_tickets_desc", "Facing a technical or account problem? Open a ticket and our IT team will get back to you.")} cta={t("help_center.new_ticket", "New Ticket")} onCta={() => setSupportView("create")} />
                      ) : (
                        <div id="ticket-list" className="space-y-3">
                          {tickets.map((ticket) => (
                            <HistoryRow key={ticket._id} item={ticket} refId={ticket.ticketId || ticket._id.slice(-6)} onOpen={setSelectedTicket} t={t} i18n={i18n} />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d7ebf5] px-5 py-4 dark:border-white/10 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-extrabold leading-tight text-[#072036] dark:text-white">{tabMeta.grievance.label}</h2>
                          <p className="text-xs text-[#35566b] dark:text-slate-400">{tabMeta.grievance.desc}</p>
                        </div>
                      </div>
                      <Segmented value={grievanceView} onChange={setGrievanceView} idPrefix="grievance" newLabel={t("help_center.new_grievance", "Submit Grievance")} historyLabel={t("help_center.my_grievances", "My Grievances")} />
                    </header>

                    <div className="px-5 py-5 sm:px-6">
                      {grievanceView === "create" ? (
                        <div className="space-y-5">
                          <div className={`flex items-start gap-3 rounded-xl px-4 py-3 ${PANEL}`}>
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                            <div>
                              <p className="text-[13px] font-extrabold text-[#072036] dark:text-white">{t("help_center.confidential", "Confidential")}</p>
                              <p className="text-xs text-[#35566b] dark:text-slate-400">{t("help_center.confidential_desc", "Only SMAART Admin handlers can see grievances. Anonymous mode hides your identity completely.")}</p>
                            </div>
                          </div>
                          <GrievanceForm onSuccess={handleGrievanceSuccess} onCancel={() => navigate("/dashboard")} />
                        </div>
                      ) : loadingGrievances ? (
                        <Loading text={t("grievance.loading", "Loading your grievance history...")} />
                      ) : grievances.length === 0 ? (
                        <EmptyState icon={Inbox} title={t("help_center.no_grievances_title", "No grievances submitted")} desc={t("help_center.no_grievances_desc", "If something serious needs the Administration's attention, submit a grievance here.")} cta={t("help_center.new_grievance", "Submit Grievance")} onCta={() => setGrievanceView("create")} />
                      ) : (
                        <div className="space-y-4">
                          <div id="grievance-stats" className="grid grid-cols-3 gap-3">
                            {[
                              { label: t("help_center.stats_total", "Submitted"), value: gTotal, cls: "text-[#072036] dark:text-white" },
                              { label: t("help_center.stats_open", "Open"), value: gOpen, cls: "text-amber-600 dark:text-amber-300" },
                              { label: t("help_center.stats_resolved", "Resolved"), value: gResolved, cls: "text-emerald-600 dark:text-emerald-300" },
                            ].map((s) => (
                              <div key={s.label} className={`rounded-xl px-4 py-3 ${PANEL}`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#35566b] dark:text-slate-400">{s.label}</p>
                                <p className={`mt-0.5 text-xl font-extrabold tabular-nums ${s.cls}`}>{s.value}</p>
                              </div>
                            ))}
                          </div>
                          <div id="grievance-list" className="space-y-3">
                            {grievances.map((g) => (
                              <HistoryRow key={g._id} item={g} refId={g.grievanceId || g._id.slice(-6)} onOpen={setSelectedGrievance} anonymous={g.isAnonymous} t={t} i18n={i18n} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.section>
            </AnimatePresence>
          </div>
        </main>

        <AnimatePresence>
          {selectedTicket && (
            <TicketDetail
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
              onUpdate={(updated) => {
                setTickets((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
                setSelectedTicket(updated);
              }}
              isAdmin={false}
            />
          )}
          {selectedGrievance && (
            <GrievanceDetail
              grievance={selectedGrievance}
              onClose={() => setSelectedGrievance(null)}
              onUpdate={(updated) => {
                setGrievances((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
                setSelectedGrievance(updated);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default HelpCenter;
