import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, AlertCircle, LifeBuoy, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { sendChatMessage } from '@/services/chatbotApi';

const ChatbotModal = ({ isOpen, onClose, onEscalateToTicket }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your SMAART Institute support assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [showEscalation, setShowEscalation] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Get auth token from sessionStorage
      const token = sessionStorage.getItem('token');

      // Send message to chatbot API
      const response = await sendChatMessage(userMessage, conversationId, token);

      if (response.success) {
        // Add bot response to chat
        const botMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);

        // Update conversation ID
        if (!conversationId) {
          setConversationId(response.conversationId);
        }

        // Show escalation option if suggested
        if (response.shouldEscalate) {
          setShowEscalation(true);
        }
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);

      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: error.fallbackMessage || "I'm having trouble connecting right now. Please try creating a support ticket for immediate assistance.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setShowEscalation(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEscalate = () => {
    onEscalateToTicket(conversationId, messages);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl h-[600px] bg-gradient-to-br from-[#001a38] to-[#002447] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#1a3884]/30"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1a3884]/30 bg-[#001a38]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3884] to-[#132c6b] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Support Assistant</h3>
                <p className="text-xs text-gray-400">Powered by AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                      ? 'bg-gradient-to-br from-[#1a3884] to-[#132c6b] text-white'
                      : message.isError
                        ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                        : 'bg-white/10 text-gray-100 border border-white/10'
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1a3884]" />
                    <span className="text-sm text-gray-300">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Escalation Banner */}
          {showEscalation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-2 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-200 mb-2">
                    Need more help? Create a support ticket and our team will assist you directly.
                  </p>
                  <Button
                    onClick={handleEscalate}
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Create Support Ticket
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-[#1a3884]/30 bg-[#001a38]/50">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#1a3884]"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-[#1a3884] to-[#132c6b] hover:from-[#132c6b] hover:to-[#1f6670]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ChatbotModal;


