import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const AIChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Add welcome message
        setMessages([{
            role: 'assistant',
            content: "👋 Hello! I'm your AI Career Coach. I'm here to help you with:\n\n• Career guidance and advice\n• Skill development strategies\n• Resume and interview tips\n• Career transition planning\n• Professional growth insights\n\nWhat would you like to discuss today?",
            timestamp: new Date()
        }]);
    }, []);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await aiCareerCoachApi.sendChatMessage(inputMessage, sessionId);

            if (response.success) {
                // Update session ID if it's a new session
                if (!sessionId && response.sessionId) {
                    setSessionId(response.sessionId);
                }

                const aiMessage = {
                    role: 'assistant',
                    content: response.response,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, aiMessage]);
            } else {
                toast.error(response.message || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Failed to send message. Please try again.');

            // Add error message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date(),
                isError: true
            }]);
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

    const suggestedQuestions = [
        "How do I transition into data science?",
        "What skills should I learn for my career?",
        "How can I improve my resume?",
        "What are the best career paths for me?",
        "How do I prepare for job interviews?"
    ];

    const handleSuggestionClick = (question) => {
        setInputMessage(question);
    };

    return (
        <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] transition-colors duration-300">
            <DashboardSidebar />

            <div className="min-h-screen transition-all duration-300">
                <DashboardHeader />

                <main className="w-full relative py-8 px-4 md:px-0">
                    <div className="max-w-5xl mx-auto pb-12">

                        {/* Header */}
                        <div className="mb-6 px-4">
                            <button
                                onClick={() => navigate('/dashboard/smaart-toolkit')}
                                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="font-semibold">Back to SMAART Toolkit</span>
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">AI Career Chat</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Your 24/7 career guidance assistant</p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Container */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">

                            {/* Messages Area */}
                            <div className="h-[600px] overflow-y-auto p-6 space-y-4">
                                <AnimatePresence>
                                    {messages.map((message, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            {/* Avatar */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                                ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                                                : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                                }`}>
                                                {message.role === 'user' ? (
                                                    <User className="w-5 h-5 text-white" />
                                                ) : (
                                                    <Bot className="w-5 h-5 text-white" />
                                                )}
                                            </div>

                                            {/* Message Bubble */}
                                            <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                <div className={`inline-block px-4 py-3 rounded-2xl ${message.role === 'user'
                                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white'
                                                    : message.isError
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                    }`}>
                                                    {message.role === 'user' ? (
                                                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                                    ) : (
                                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                                            <ReactMarkdown
                                                                components={{
                                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                                    strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                                                    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                                                                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                                                                    h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2" {...props} />,
                                                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1" {...props} />,
                                                                    code: ({ node, inline, ...props }) =>
                                                                        inline ? (
                                                                            <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                                                                        ) : (
                                                                            <code className="block bg-slate-200 dark:bg-slate-700 p-2 rounded text-xs font-mono overflow-x-auto" {...props} />
                                                                        ),
                                                                    a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} target="_blank" rel="noopener noreferrer" />
                                                                }}
                                                            >
                                                                {message.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 px-2">
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Loading Indicator */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                                <span className="text-slate-600 dark:text-slate-400">Thinking...</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggested Questions (show when no messages) */}
                            {messages.length <= 1 && (
                                <div className="px-6 pb-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                        Suggested Questions
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedQuestions.map((question, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestionClick(question)}
                                                className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                            >
                                                {question}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex gap-3">
                                    <textarea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask me anything about your career..."
                                        rows={1}
                                        className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-slate-800 dark:text-white placeholder-slate-400"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                <span className="hidden sm:inline">Send</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Powered by AI • Press Enter to send</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default AIChat;
