import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Send, Sparkles } from "lucide-react";

const supportiveReplies = [
  "Thanks for opening up. I'm here to listen. What would make today 1% easier?",
  "It sounds like a lot. Try a slow inhale for 4 seconds and exhale for 6. What else could help right now?",
  "You're not alone in this community. Is there a small action that could lighten your load?",
  "I hear the stress. Would sharing one win from this week feel doable?",
  "Taking a short break can reset your mind. What calming activity is accessible to you now?"
];

const EmotionChatbot = ({ studentName = "friend" }) => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: `Hi ${studentName}, I'm your Emotion Coach. Share what's on your mind and I'll suggest calm next steps.`
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const nameOrFriend = useMemo(() => (studentName && studentName.trim() ? studentName : "friend"), [studentName]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const pickReply = (text) => {
    const lowered = text.toLowerCase();
    if (lowered.includes("anx") || lowered.includes("worry")) {
      return "That sounds heavy. Try box breathing (4 in, 4 hold, 4 out, 4 hold). What thought can you park for later?";
    }
    if (lowered.includes("tired") || lowered.includes("burn")) {
      return "Fatigue is real. A 5-minute break, some water, and a stretch can help. What can you pause for now?";
    }
    if (lowered.includes("alone") || lowered.includes("isolat")) {
      return "You deserve support. Would it help to message a friend or mentor after this chat?";
    }
    const random = supportiveReplies[Math.floor(Math.random() * supportiveReplies.length)];
    return random;
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    setTimeout(() => {
      const reply = pickReply(trimmed).replace("friend", nameOrFriend);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      setSending(false);
    }, 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_12px_35px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden">
      <div className="p-5 flex items-center gap-3 bg-gradient-to-r from-[#002147] to-blue-900 text-white">
        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-black text-white/80">Emotion Coach</p>
          <p className="text-sm font-semibold">Here to support you</p>
        </div>
      </div>

      <div ref={listRef} className="p-5 max-h-80 overflow-y-auto space-y-3 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={`${msg.role}-${idx}-${msg.text.slice(0, 8)}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === "bot"
                  ? "bg-blue-50 text-[#002147] border border-blue-100"
                  : "bg-[#002147] text-white"
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type how you're feeling..."
            rows={2}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="self-end p-3 rounded-2xl bg-[#002147] text-white shadow-lg shadow-blue-900/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {sending ? <Heart className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Safe space — not medical advice.</p>
      </div>
    </div>
  );
};

export default EmotionChatbot;
