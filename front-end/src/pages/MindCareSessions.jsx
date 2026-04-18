import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Star,
  Plus,
  ChevronDown,
  Loader2,
  RefreshCw,
  Inbox,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  User,
  Briefcase,
  BookOpen,
  Brain
} from "lucide-react";
import { apiCall } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

const DOMAINS = [
  { id: "academic", label: "Academic", icon: BookOpen, description: "Get help with studies, assignments, and learning strategies" },
  { id: "career", label: "Career", icon: Briefcase, description: "Career guidance, job preparation, and professional growth" },
  { id: "mental-health", label: "Mental Health", icon: Brain, description: "Support for stress, anxiety, and emotional wellbeing" },
  { id: "personal", label: "Personal Development", icon: User, description: "Life skills, self-improvement, and goal setting" }
];

const STATUS_COLORS = {
  requested: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: AlertCircle },
  scheduled: { bg: "bg-blue-500/20", text: "text-blue-400", icon: Calendar },
  completed: { bg: "bg-green-500/20", text: "text-green-400", icon: CheckCircle },
  cancelled: { bg: "bg-red-500/20", text: "text-red-400", icon: XCircle },
  "no-show": { bg: "bg-gray-500/20", text: "text-gray-400", icon: XCircle }
};

const MindCareSessions = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("sessions"); // sessions | request
  const [sessions, setSessions] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Request form state
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");

  const tabs = [
    { id: "sessions", label: "My Sessions", icon: Calendar },
    { id: "request", label: "Request Session", icon: Plus }
  ];



  // Fetch user's sessions
  const fetchMySessions = async () => {
    if (!user?._id && !user?.id) return;
    setIsLoading(true);
    try {
      const studentId = user._id || user.id;
      const response = await apiCall(`/coachSessions?student=${studentId}`);
      if (response.success) {
        setSessions(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available coaches with Fallback
  const fetchCoaches = async () => {
    try {
      const response = await apiCall(`/coaches?status=active`);
      if (response.success && response.data && response.data.length > 0) {
        setCoaches(response.data);
      } else {
        setCoaches(MOCK_COACHES);
      }
    } catch (error) {
      console.error("Error fetching coaches, using mock data:", error);
      setCoaches(MOCK_COACHES);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMySessions();
      fetchCoaches();
    }
  }, [user]);

  // Submit session request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!selectedDomain) {
      toast.error("Please select a coaching domain");
      return;
    }
    if (!issueDescription.trim()) {
      toast.error("Please describe your issue or requirement");
      return;
    }

    setIsSubmitting(true);
    try {
      const studentId = user?._id || user?.id;
      if (!studentId) {
        toast.error("Please login to request a session");
        return;
      }

      const requestData = {
        student: studentId,
        domain: selectedDomain,
        notes: issueDescription,
        coach: selectedCoach || undefined,
        college: user?.college?._id || user?.college || "000000000000000000000000",
        scheduledDate: preferredDate && preferredTime ? new Date(`${preferredDate}T${preferredTime}`) : undefined,
        status: "requested"
      };

      const response = await apiCall(`/coachSessions`, {
        method: "POST",
        body: JSON.stringify(requestData)
      });

      if (response.success) {
        toast.success("Care session requested successfully!");
        setIssueDescription("");
        setSelectedDomain(null);
        setSelectedCoach("");
        setPreferredDate("");
        setPreferredTime("");
        setActiveTab("sessions");
        fetchMySessions();
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!selectedSession || feedbackRating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/coachSessions/${selectedSession._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentFeedback: {
            rating: feedbackRating,
            comment: feedbackComment
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Feedback submitted successfully!");
        setShowFeedbackModal(false);
        setFeedbackRating(0);
        setFeedbackComment("");
        fetchMySessions();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not scheduled";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen lms-dashboard-bg text-[#1A1A1A] font-sans">
      <main className="p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${activeTab === tab.id
                        ? "bg-[#1a3884] text-white"
                        : "bg-white text-gray-500 hover:text-[#002147] border border-gray-200"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {tab.id === "sessions" && sessions.length > 0 && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? "bg-white/20" : "bg-[#1a3884]/10 text-[#1a3884]"}`}>
                          {sessions.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {/* My Sessions Tab */}
                {activeTab === "sessions" && (
                  <motion.div
                    key="sessions"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Actions Bar */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={fetchMySessions}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-[#002147] hover:border-[#1a3884] transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </button>
                      <button
                        onClick={() => setActiveTab("request")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Request Session
                      </button>
                    </div>

                    {/* Sessions List */}
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[#1a3884] animate-spin mb-3" />
                        <p className="text-gray-500">Loading sessions...</p>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-white border border-gray-200">
                        <Inbox className="w-12 h-12 text-gray-300 mb-3" />
                        <h3 className="text-[#002147] font-medium mb-1">No sessions yet</h3>
                        <p className="text-gray-500 text-sm mb-4">Request a coaching session to get started</p>
                        <button
                          onClick={() => setActiveTab("request")}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a3884] text-white hover:bg-[#1a3884]/90 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Request Session
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sessions.map((session, index) => {
                          const StatusIcon = STATUS_COLORS[session.status]?.icon || AlertCircle;
                          const statusColor = STATUS_COLORS[session.status] || STATUS_COLORS.requested;

                          return (
                            <motion.div
                              key={session._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-4 rounded-xl bg-white border border-gray-200 hover:border-[#1a3884]/50 transition-colors cursor-pointer"
                              onClick={() => setSelectedSession(session)}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 text-xs rounded-lg font-medium capitalize ${statusColor.bg} ${statusColor.text}`}>
                                      <StatusIcon className="w-3 h-3 inline mr-1" />
                                      {session.status}
                                    </span>
                                    <span className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 capitalize">
                                      {session.domain?.replace("-", " ")}
                                    </span>
                                  </div>
                                  <p className="text-[#002147] font-medium truncate">
                                    {session.notes || "Session Request"}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {formatDate(session.scheduledDate || session.requestDate)}
                                    </span>
                                    {session.coach && (
                                      <span className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {session.coach.name || "Assigned Coach"}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  {session.status === "completed" && !session.studentFeedback?.rating && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSession(session);
                                        setShowFeedbackModal(true);
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-[#1a3884]/10 text-[#1a3884] hover:bg-[#1a3884]/20 transition-colors"
                                    >
                                      <Star className="w-4 h-4" />
                                      Give Feedback
                                    </button>
                                  )}
                                  {session.status === "scheduled" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast.info("Video integration coming soon!");
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                                    >
                                      <Video className="w-4 h-4" />
                                      Join
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Request Session Tab */}
                {activeTab === "request" && (
                  <motion.div
                    key="request"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="rounded-2xl bg-white border border-gray-200 p-6">
                      <div className="mb-6">
                        <h2 className="text-xl font-bold text-[#002147] mb-1">Request a Coaching Session</h2>
                        <p className="text-gray-500 text-sm">Select a domain and describe what you need help with</p>
                      </div>

                      <form onSubmit={handleSubmitRequest} className="space-y-6">
                        {/* Domain Selection */}
                        <div>
                          <label className="block text-sm font-medium text-[#002147] mb-3">
                            What area do you need help with? *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {DOMAINS.map((domain) => {
                              const Icon = domain.icon;
                              return (
                                <button
                                  key={domain.id}
                                  type="button"
                                  onClick={() => setSelectedDomain(domain.id)}
                                  className={`p-4 rounded-xl text-left transition-all ${selectedDomain === domain.id
                                    ? "bg-[#1a3884]/10 border-2 border-[#1a3884]"
                                    : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedDomain === domain.id ? "bg-[#1a3884]/20" : "bg-white"}`}>
                                      <Icon className={`w-5 h-5 ${selectedDomain === domain.id ? "text-[#1a3884]" : "text-gray-400"}`} />
                                    </div>
                                    <div>
                                      <p className={`font-medium ${selectedDomain === domain.id ? "text-[#1a3884]" : "text-[#002147]"}`}>
                                        {domain.label}
                                      </p>
                                      <p className="text-xs text-gray-500">{domain.description}</p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Issue Description */}
                        <div>
                          <label className="block text-sm font-medium text-[#002147] mb-2">
                            Describe your issue or requirement *
                          </label>
                          <textarea
                            value={issueDescription}
                            onChange={(e) => setIssueDescription(e.target.value)}
                            placeholder="Please describe what you'd like to discuss in the session..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[#002147] placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors resize-none"
                          />
                        </div>

                        {/* Coach Selection (Optional) */}
                        {coaches.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-[#002147] mb-2">
                              Preferred Coach (Optional)
                            </label>
                            <select
                              value={selectedCoach}
                              onChange={(e) => setSelectedCoach(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[#002147] focus:border-[#1a3884] focus:outline-none transition-colors"
                            >
                              <option value="">Any available coach</option>
                              {coaches.map((coach) => (
                                <option key={coach._id} value={coach._id}>
                                  {coach.name} - {coach.specialization}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Preferred Date/Time (Optional) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#002147] mb-2">
                              Preferred Date (Optional)
                            </label>
                            <input
                              type="date"
                              value={preferredDate}
                              onChange={(e) => setPreferredDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[#002147] focus:border-[#1a3884] focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#002147] mb-2">
                              Preferred Time (Optional)
                            </label>
                            <input
                              type="time"
                              value={preferredTime}
                              onChange={(e) => setPreferredTime(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[#002147] focus:border-[#1a3884] focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setActiveTab("sessions")}
                            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-5 h-5" />
                                Submit Request
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </main>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl"
            >
              <h3 className="text-xl font-bold text-[#002147] mb-2">Rate Your Session</h3>
              <p className="text-gray-500 text-sm mb-6">How was your coaching experience?</p>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= feedbackRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                        }`}
                    />
                  </button>
                ))}
              </div>

              {/* Comment */}
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your experience (optional)..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[#002147] placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors resize-none mb-6"
              />

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackRating === 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/90 transition-colors disabled:opacity-50"
                >
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MindCareSessions;

