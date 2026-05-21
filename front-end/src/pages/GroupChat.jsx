import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Users, ChevronLeft, MoreVertical,
  UserPlus, LogOut, Search, Loader2, Info,
  MessageCircle, X, Paperclip, Image as ImageIcon,
  UserMinus, Shield, ShieldOff, ChevronRight,
  Play, Video, BarChart2, TrendingUp, Plus,
  CheckCircle2, Calendar, Clock, Pin
} from 'lucide-react';
import { groupsAPI } from '../services/groupsApi';
import { communityAPI } from '../services/communityApi';
import { useAuth } from '../hooks/useAuth';
import { moderateText } from '@/utils/contentModeration';
import MentionInput from '@/components/MentionInput';

const GroupChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]); // In MVP, messages are part of group object, but we'll separate for logic if needed
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Media Upload State
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const [moderationWarning, setModerationWarning] = useState('');
  const [viewerMedia, setViewerMedia] = useState(null);

  // Message Search State
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');

  // Media Gallery State
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  // Poll Editor State
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''], expiresAt: '' });
  const [votingId, setVotingId] = useState(null);
  const [reactingTo, setReactingTo] = useState(null);
  const longPressTimer = useRef(null);
  const [longPressMsgId, setLongPressMsgId] = useState(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reactingTo && !e.target.closest('.emoji-picker-container')) {
        setReactingTo(null);
        setLongPressMsgId(null);
      }
    };

    if (reactingTo) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [reactingTo]);

  useEffect(() => {
    fetchGroupDetails();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchGroupDetails, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!viewerMedia) {
      scrollToBottom();
    }
  }, [group?.messages?.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupDetails = async () => {
    try {
      if (!group) setLoading(true); // Only show spinner on first load
      const res = await groupsAPI.getGroup(id);
      if (res.success) {
        setGroup(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch group:', error);
      if (!group) navigate('/dashboard/groups');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render message content with mentions
  const renderMessageContent = (content) => {
    if (!content) return null;

    const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add mention as highlighted span
      parts.push(
        <span key={match.index} className="text-blue-400 font-bold bg-blue-500/20 px-2 py-0.5 rounded">
          @{match[1]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-yellow-400', 'ring-offset-2');
      setTimeout(() => element.classList.remove('ring-2', 'ring-yellow-400', 'ring-offset-2'), 2000);
    }
  };

  const isAdmin = group?.admins?.some(a => (a._id || a).toString() === user?._id?.toString());

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const pollToSend = (showPollEditor && pollData.question.trim() && pollData.options.filter(o => o.trim()).length >= 2)
      ? {
        question: pollData.question,
        options: pollData.options.filter(o => o.trim()).map(o => ({ text: o, voters: [] })),
        expiresAt: pollData.expiresAt ? new Date(pollData.expiresAt) : null
      }
      : null;

    if (!messageInput.trim() && !selectedMedia && !pollToSend) return;

    // Check for inappropriate content
    if (messageInput.trim()) {
      const contentCheck = moderateText(messageInput);
      if (!contentCheck.isClean) {
        setModerationWarning('Your message contains inappropriate language. Please revise before sending.');
        return;
      }
    }

    setModerationWarning('');

    try {
      setSending(true);
      const res = await groupsAPI.sendMessage(
        id,
        messageInput,
        mediaType === 'image' ? selectedMedia : null,
        mediaType === 'video' ? selectedMedia : null,
        pollToSend
      );
      if (res.success) {
        setMessageInput('');
        setSelectedMedia(null);
        setMediaType(null);
        setPreviewUrl('');
        setShowPollEditor(false);
        setPollData({ question: '', options: ['', ''], expiresAt: '' });
        fetchGroupDetails(); // Immediate update
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleVote = async (messageId, optionIndex) => {
    if (!user?._id || votingId) return;

    try {
      setVotingId(messageId);
      const res = await groupsAPI.voteInPoll(id, messageId, optionIndex);
      if (res.success) {
        // Optimistic update or just fetch details
        fetchGroupDetails();
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      alert(error.message || 'Failed to vote');
    } finally {
      setVotingId(null);
    }
  };

  const handleSearchStudents = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const res = await groupsAPI.searchStudents(query);
      // Filter out existing members
      const validResults = res.data.filter(s => !group.members.includes(s._id));
      setSearchResults(validResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (studentId) => {
    try {
      await groupsAPI.addMember(id, studentId);
      setShowAddMember(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchGroupDetails();
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member. They might belong to a different university.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const limit = isVideo ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
      const limitMB = isVideo ? 5 : 2;

      if (file.size > limit) {
        alert(`File size too large. Please select an ${isVideo ? 'video' : 'image'} under ${limitMB}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia(reader.result);
        setMediaType(isVideo ? 'video' : 'image');
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setMediaType(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Media Viewer Navigation
  const chatMedia = group?.messages?.filter(m => m.image || m.video).map(m => ({
    url: m.image || m.video,
    type: m.video ? 'video' : 'image'
  })) || [];

  const handlePrevMedia = (e) => {
    e?.stopPropagation();
    const currentIndex = chatMedia.findIndex(m => m.url === viewerMedia?.url);
    if (currentIndex > 0) {
      setViewerMedia(chatMedia[currentIndex - 1]);
    }
  };

  const handleNextMedia = (e) => {
    e?.stopPropagation();
    const currentIndex = chatMedia.findIndex(m => m.url === viewerMedia?.url);
    if (currentIndex < chatMedia.length - 1) {
      setViewerMedia(chatMedia[currentIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewerMedia) return;
      if (e.key === 'ArrowLeft') handlePrevMedia();
      if (e.key === 'ArrowRight') handleNextMedia();
      if (e.key === 'Escape') setViewerMedia(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerMedia, chatMedia]);

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await groupsAPI.leaveGroup(id);
      navigate('/dashboard/groups');
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this group?`)) return;
    try {
      const res = await groupsAPI.removeMember(id, memberId);
      if (res.success) {
        fetchGroupDetails();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert(error.message || 'Failed to remove member. They might be the last admin.');
    }
  };

  const handlePromoteToAdmin = async (memberId, memberName) => {
    if (!window.confirm(`Promote ${memberName} to admin?`)) return;
    try {
      const res = await groupsAPI.promoteToAdmin(id, memberId);
      if (res.success) {
        fetchGroupDetails();
      }
    } catch (error) {
      console.error('Failed to promote member:', error);
      alert(error.message || 'Failed to promote member.');
    }
  };

  const handleDemoteFromAdmin = async (memberId, memberName) => {
    if (!window.confirm(`Remove admin privileges from ${memberName}?`)) return;
    try {
      const res = await groupsAPI.demoteFromAdmin(id, memberId);
      if (res.success) {
        fetchGroupDetails();
      }
    } catch (error) {
      console.error('Failed to demote admin:', error);
      alert(error.message || 'Failed to demote admin. They might be the last admin.');
    }
  };

  if (loading && !group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#002147] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 bg-white/80 backdrop-blur-xl sticky top-0 z-10 border-b border-gray-200/50 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/dashboard/groups')}
              className="p-3 bg-[#F8FAFC] hover:bg-gray-100 text-gray-500 rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Back</span>
            </button>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-semibold text-xl text-white shadow-lg ${group.type === 'student' ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-100' : 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-100'}`}>
                {group.name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#002147] tracking-tight flex items-center gap-2 leading-none">
                  {group.name}
                  <div className={`w-2 h-2 rounded-full animate-pulse ${group.type === 'student' ? 'bg-green-500' : 'bg-blue-500'}`} />
                </h1>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mt-1">
                  {group.memberDetails?.length || 0} members • {group.description}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowMsgSearch(!showMsgSearch);
                if (!showMsgSearch) setMsgSearchQuery('');
              }}
              className={`p-3 rounded-2xl transition-all ${showMsgSearch ? 'bg-[#1a3884] text-white shadow-lg shadow-blue-200' : 'hover:bg-[#F8FAFC] text-gray-400'}`}
              title="Search Messages"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setShowMediaGallery(!showMediaGallery);
                if (showMembers) setShowMembers(false);
              }}
              className={`p-3 rounded-2xl transition-all ${showMediaGallery ? 'bg-[#1a3884] text-white shadow-lg shadow-blue-200' : 'hover:bg-[#F8FAFC] text-gray-400'}`}
              title="Media Gallery"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setShowMembers(!showMembers);
                if (showMediaGallery) setShowMediaGallery(false);
              }}
              className={`p-3 rounded-2xl transition-all ${showMembers ? 'bg-[#1a3884] text-white shadow-lg shadow-blue-200' : 'hover:bg-[#F8FAFC] text-gray-400'}`}
            >
              <Users className="w-5 h-5" />
            </button>
            <div className="w-[1px] h-6 bg-gray-100 mx-2" />
            <button
              onClick={handleLeaveGroup}
              className="p-3 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-2xl transition-all group"
              title="Leave Group"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </header>

        {/* Search Bar UI */}
        <AnimatePresence>
          {showMsgSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white border-b border-gray-100 group/search"
            >
              <div className="px-6 py-3 flex items-center gap-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Find in this chat..."
                  value={msgSearchQuery}
                  onChange={(e) => setMsgSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400"
                />
                {msgSearchQuery && (
                  <button
                    onClick={() => setMsgSearchQuery('')}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMsgSearch(false);
                    setMsgSearchQuery('');
                  }}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pinned Messages Banner */}
        {group.pinnedMessages && group.pinnedMessages.length > 0 && (
          <div
            onClick={() => scrollToMessage(group.pinnedMessages[0])}
            className="bg-yellow-50/80 backdrop-blur-sm border-b border-yellow-100 px-6 py-3 flex items-start gap-3 relative z-10 cursor-pointer hover:bg-yellow-50 transition-colors"
          >
            <div className="p-1.5 bg-yellow-100 rounded-lg mt-0.5">
              <Pin className="w-3.5 h-3.5 text-yellow-700 fill-yellow-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">Pinned Message</h3>
              <div className="text-sm text-gray-700 line-clamp-1">
                {group.messages?.find(m => m._id === group.pinnedMessages[0])?.content || 'Message not found'}
              </div>
            </div>
            {group.pinnedMessages.length > 1 && (
              <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                +{group.pinnedMessages.length - 1}
              </span>
            )}
          </div>
        )}


        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {(() => {
            const filteredMessages = group.messages?.filter(msg =>
              !msgSearchQuery ||
              (msg.content && msg.content.toLowerCase().includes(msgSearchQuery.toLowerCase())) ||
              (msg.senderName && msg.senderName.toLowerCase().includes(msgSearchQuery.toLowerCase()))
            ) || [];

            if (filteredMessages.length === 0) {
              return (
                <div className="text-center py-20 opacity-50">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>{msgSearchQuery ? `No messages found for "${msgSearchQuery}"` : 'No messages yet. Start the conversation!'}</p>
                </div>
              );
            }

            return filteredMessages.map((msg, idx) => {
              const isMe = msg.sender === user?._id;
              const isSequential = idx > 0 && group.messages[idx - 1].sender === msg.sender;

              return (
                <div key={idx} id={`msg-${msg._id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg relative`}>
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {!isMe && !isSequential && (
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide ml-4 mb-0.5">
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={`relative px-6 py-3.5 shadow-sm break-words transition-all duration-300 select-none ${isMe
                          ? 'bg-[#002147] text-white rounded-[2rem] rounded-br-[0.5rem]'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-[2rem] rounded-bl-[0.5rem]'
                        }`}
                      onMouseDown={() => {
                        longPressTimer.current = setTimeout(() => {
                          setLongPressMsgId(msg._id);
                          setReactingTo(msg._id);
                        }, 500);
                      }}
                      onMouseUp={() => {
                        if (longPressTimer.current) {
                          clearTimeout(longPressTimer.current);
                          longPressTimer.current = null;
                        }
                      }}
                      onMouseLeave={() => {
                        if (longPressTimer.current) {
                          clearTimeout(longPressTimer.current);
                          longPressTimer.current = null;
                        }
                      }}
                      onTouchStart={() => {
                        longPressTimer.current = setTimeout(() => {
                          setLongPressMsgId(msg._id);
                          setReactingTo(msg._id);
                        }, 500);
                      }}
                      onTouchEnd={() => {
                        if (longPressTimer.current) {
                          clearTimeout(longPressTimer.current);
                          longPressTimer.current = null;
                        }
                      }}
                    >
                      {/* Message Actions - Absolute Position */}
                      <div className={`absolute top-2 right-2 flex items-center gap-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                        {isAdmin && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await groupsAPI.pinMessage(id, msg._id);
                              fetchGroupDetails();
                            }}
                            className="p-1 hover:bg-black/10 rounded-full transition-colors"
                            title={msg.isPinned ? "Unpin Message" : "Pin Message"}
                          >
                            <Pin className={`w-3.5 h-3.5 ${group.pinnedMessages?.includes(msg._id) ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>
                      {msg.image && (
                        <div
                          className="mb-3 rounded-[1.5rem] overflow-hidden cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02]"
                          onClick={() => setViewerMedia({ url: msg.image, type: 'image' })}
                        >
                          <img src={msg.image} alt="Shared" className="max-w-xs max-h-72 object-cover" loading="lazy" />
                        </div>
                      )}
                      {msg.video && (
                        <div
                          className="mb-3 rounded-[1.5rem] overflow-hidden cursor-pointer group/vid hover:scale-[1.02] transition-all"
                          onClick={() => setViewerMedia({ url: msg.video, type: 'video' })}
                        >
                          <div className="relative">
                            <video src={msg.video} className="max-w-xs max-h-72 object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/vid:bg-black/40 transition-colors">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {msg.content && <p className="text-[15px] leading-relaxed font-medium">{renderMessageContent(msg.content)}</p>}

                      {msg.poll && msg.poll.question && (
                        <div className={`mt-3 p-5 rounded-[2.5rem] border ${isMe
                            ? 'bg-gradient-to-br from-white/20 to-white/5 border-white/20 backdrop-blur-sm shadow-inner'
                            : 'bg-gradient-to-br from-blue-50/80 to-white border-blue-100 shadow-sm'
                          }`}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-2xl ${isMe ? 'bg-white/20' : 'bg-blue-100/50'}`}>
                              <TrendingUp className={`w-5 h-5 ${isMe ? 'text-blue-200' : 'text-blue-600'}`} />
                            </div>
                            <h4 className={`text-base font-semibold tracking-tight leading-tight ${isMe ? 'text-white' : 'text-[#002147]'}`}>
                              {msg.poll.question}
                            </h4>
                          </div>

                          <div className="space-y-2.5">
                            {msg.poll.options.map((option, idx) => {
                              const totalVotes = msg.poll.options.reduce((acc, opt) => acc + (opt.voters?.length || 0), 0);
                              const optionVotes = option.voters?.length || 0;
                              const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                              const hasVoted = msg.poll.options.some(opt => opt.voters?.some(vId => vId.toString() === user?._id?.toString()));
                              const myVote = option.voters?.some(vId => vId.toString() === user?._id?.toString());
                              const isExpired = msg.poll.expiresAt && new Date() > new Date(msg.poll.expiresAt);

                              return (
                                <button
                                  key={idx}
                                  disabled={isExpired || hasVoted || votingId === msg._id}
                                  onClick={() => handleVote(msg._id, idx)}
                                  className={`group/opt relative w-full text-left p-4 rounded-[1.25rem] border-2 transition-all duration-300 overflow-hidden ${myVote
                                      ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                      : hasVoted || isExpired
                                        ? 'border-gray-100/50 bg-gray-50/20 cursor-default grayscale-[0.2]'
                                        : isMe
                                          ? 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                          : 'border-blue-50/50 bg-blue-50/30 hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5'
                                    }`}
                                >
                                  {/* Glassy Progress Bar */}
                                  {(hasVoted || isExpired) && (
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 1, ease: "circOut" }}
                                      className={`absolute inset-0 opacity-20 ${isMe ? 'bg-white' : 'bg-[#1a3884]'}`}
                                    />
                                  )}

                                  <div className="relative z-10 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <span className={`text-sm font-medium tracking-tight ${isMe ? 'text-white' : 'text-gray-800'}`}>
                                        {option.text}
                                      </span>
                                      {myVote && <CheckCircle2 className="w-4 h-4 text-blue-500 animate-in zoom-in spin-in-90 duration-500" />}
                                    </div>
                                    {(hasVoted || isExpired) && (
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span className={`text-xs font-semibold ${isMe ? 'text-blue-200' : 'text-blue-600'}`}>
                                          {percentage}%
                                        </span>
                                        <span className={`text-[8px] font-medium uppercase tracking-wide opacity-40 ${isMe ? 'text-white' : 'text-gray-500'}`}>
                                          {optionVotes} votes
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className={`mt-5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide ${isMe ? 'text-white/40' : 'text-gray-400'}`}>
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 opacity-60" />
                              <span>{msg.poll.options.reduce((acc, opt) => acc + (opt.voters?.length || 0), 0)} participants</span>
                            </div>
                            {msg.poll.expiresAt && (
                              <div className={`flex items-center gap-2 ${new Date() > new Date(msg.poll.expiresAt) ? 'text-red-400 opacity-100' : ''}`}>
                                <Clock className="w-3.5 h-3.5 opacity-60" />
                                <span>
                                  {new Date() > new Date(msg.poll.expiresAt) ? 'Poll Closed' : `Ends ${new Date(msg.poll.expiresAt).toLocaleDateString()}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Shared Post Display */}
                      {msg.sharedPost && (msg.sharedPost.title || msg.sharedPost.content || (msg.sharedPost.poll && msg.sharedPost.poll.question)) && (
                        <div className={`mt-3 p-5 rounded-[2.5rem] border ${isMe
                            ? 'bg-gradient-to-br from-white/20 to-white/5 border-white/20 backdrop-blur-sm shadow-inner'
                            : 'bg-gradient-to-br from-teal-50/80 to-white border-teal-100 shadow-sm'
                          }`}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-2xl ${isMe ? 'bg-white/20' : 'bg-teal-100/50'}`}>
                              <MessageCircle className={`w-5 h-5 ${isMe ? 'text-teal-200' : 'text-teal-600'}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className={`text-sm font-bold tracking-tight leading-tight ${isMe ? 'text-white' : 'text-[#002147]'}`}>
                                Shared from Community
                              </h4>
                              {msg.sharedPost.category && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-white/60' : 'text-teal-600'}`}>
                                  {msg.sharedPost.category}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Post Preview */}
                          <div className={`p-4 rounded-2xl ${isMe ? 'bg-white/10' : 'bg-white/50'}`}>
                            <h5 className={`font-bold text-sm mb-2 line-clamp-2 ${isMe ? 'text-white' : 'text-[#002147]'}`}>
                              {msg.sharedPost.title}
                            </h5>
                            <p className={`text-xs leading-relaxed line-clamp-3 mb-3 ${isMe ? 'text-white/80' : 'text-gray-600'}`}>
                              {msg.sharedPost.content}
                            </p>

                            {/* Media Thumbnail */}
                            {msg.sharedPost.media && msg.sharedPost.media.url && (
                              <div className="mb-3 rounded-xl overflow-hidden">
                                {msg.sharedPost.media.type === 'video' ? (
                                  <div
                                    className="relative w-full h-32 bg-black rounded-lg cursor-pointer group/vid overflow-hidden"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewerMedia({ url: msg.sharedPost.media.url, type: 'video' });
                                    }}
                                  >
                                    <video
                                      src={msg.sharedPost.media.url}
                                      className="w-full h-full object-cover opacity-80 group-hover/vid:opacity-60 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover/vid:scale-110 transition-transform">
                                        <Play className="w-5 h-5 text-white fill-current translate-x-0.5" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={msg.sharedPost.media.url}
                                    alt="Post media"
                                    className="w-full h-32 object-cover bg-gray-100"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                              </div>
                            )}

                            {/* Shared Poll Display */}
                            {msg.sharedPost.poll && (
                              <div className={`mb-3 p-3 rounded-xl ${isMe ? 'bg-white/10' : 'bg-[#F8FAFC]'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className={`w-4 h-4 ${isMe ? 'text-white/70' : 'text-blue-500'}`} />
                                  <span className={`text-xs font-bold ${isMe ? 'text-white/90' : 'text-gray-700'}`}>
                                    Poll: {msg.sharedPost.poll.question}
                                  </span>
                                </div>
                                <div className="space-y-1.5 pl-6">
                                  {msg.sharedPost.poll.options.slice(0, 3).map((opt, i) => (
                                    <div key={i} className={`text-[10px] px-2 py-1 rounded-lg border ${isMe ? 'border-white/20 text-white/70' : 'border-gray-200 text-gray-600'
                                      }`}>
                                      {opt.text}
                                    </div>
                                  ))}
                                  {msg.sharedPost.poll.options.length > 3 && (
                                    <div className={`text-[10px] italic ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                                      + {msg.sharedPost.poll.options.length - 3} more options
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}





                            {/* Author Info */}
                            <div className={`flex items-center gap-2 text-[10px] ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
                              <span className="font-medium">{msg.sharedPost?.author?.name || msg.sharedPost?.author?.fullName || 'Unknown'}</span>
                              <span>•</span>
                              <span>{new Date(msg.sharedPost.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* View in Community Button */}
                          <button
                            onClick={() => navigate(`/dashboard/community`)}
                            className={`mt-4 w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${isMe
                                ? 'bg-white/20 text-white hover:bg-white/30'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                              }`}
                          >
                            View in Community →
                          </button>
                        </div>
                      )}

                      {/* Emoji Picker - Shows below message on long press */}
                      {reactingTo === msg._id && (
                        <div className="emoji-picker-container mt-3 p-2 bg-white rounded-xl shadow-lg border border-gray-100 flex gap-1 z-50">
                          {['👍', '❤️', '😂', '😮', '😢', '🎉'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Check if user already has a reaction on this message
                                const existingReaction = msg.reactions?.find(r => r.user === user?._id || r.userId === user?._id);
                                if (existingReaction) {
                                  // If clicking same emoji, remove it (toggle off)
                                  if (existingReaction.emoji === emoji) {
                                    await groupsAPI.removeReaction(id, msg._id);
                                  } else {
                                    // Replace with new emoji
                                    await groupsAPI.removeReaction(id, msg._id);
                                    await groupsAPI.addReaction(id, msg._id, emoji);
                                  }
                                } else {
                                  // Add new reaction
                                  await groupsAPI.addReaction(id, msg._id, emoji);
                                }
                                setReactingTo(null);
                                setLongPressMsgId(null);
                                fetchGroupDetails();
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg text-xl transition-transform hover:scale-110"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Display Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(
                            msg.reactions.reduce((acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Toggle: remove if user already reacted with this emoji
                                const existingReaction = msg.reactions?.find(r => r.user === user?._id || r.userId === user?._id);
                                if (existingReaction && existingReaction.emoji === emoji) {
                                  await groupsAPI.removeReaction(id, msg._id);
                                } else {
                                  // Remove any existing reaction first, then add new one
                                  if (existingReaction) {
                                    await groupsAPI.removeReaction(id, msg._id);
                                  }
                                  await groupsAPI.addReaction(id, msg._id, emoji);
                                }
                                fetchGroupDetails();
                              }}
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${isMe
                                  ? 'bg-white/20 text-white'
                                  : 'bg-white border border-gray-200 text-gray-700 shadow-sm'
                                }`}
                            >
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] mt-1 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-gray-100/50 shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.05)]">
          {/* Moderation Warning */}
          {moderationWarning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-4 p-4 bg-red-50 border border-red-100 rounded-[1.5rem]"
            >
              <p className="text-xs text-red-600 font-medium uppercase tracking-wide leading-loose">{moderationWarning}</p>
            </motion.div>
          )}

          {previewUrl && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 relative w-fit group/preview"
            >
              {mediaType === 'video' ? (
                <div className="h-24 w-40 rounded-2xl border-2 border-dashed border-gray-200 bg-[#002147] flex items-center justify-center overflow-hidden">
                  <Video className="w-10 h-10 text-white opacity-50" />
                </div>
              ) : (
                <img src={previewUrl} alt="Preview" className="h-24 w-auto rounded-2xl border-2 border-gray-100 shadow-lg object-cover" loading="lazy" />
              )}
              <button
                onClick={removeMedia}
                className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-110 active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-4 items-center bg-gray-50/50 p-2 rounded-[2.5rem] border border-gray-100 focus-within:bg-white focus-within:border-blue-200 focus-within:shadow-[0_8px_32px_-12px_rgba(59,130,246,0.15)] transition-all">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="flex items-center gap-1 pl-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-full transition-all group/btn"
                disabled={sending}
                title="Attach Media"
              >
                <Paperclip className="w-5.5 h-5.5 group-hover/btn:rotate-12 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => setShowPollEditor(true)}
                className={`p-3.5 transition-all rounded-full ${showPollEditor ? 'bg-[#1a3884] text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50/50'}`}
                disabled={sending}
                title="Create Poll"
              >
                <BarChart2 className="w-5.5 h-5.5" />
              </button>
            </div>
            <MentionInput
              value={messageInput}
              onChange={setMessageInput}
              onSearch={async (query) => {
                const result = await communityAPI.searchUsers(query);
                return result.success ? result.data : [];
              }}
              placeholder="Message group... (Type @ to mention)"
              className="flex-1 px-4 py-3.5 bg-transparent border-none outline-none text-[15px] font-medium text-gray-800 placeholder:text-gray-300"
            />
            <button
              type="submit"
              disabled={sending || (!messageInput.trim() && !selectedMedia)}
              className="w-12 h-12 flex items-center justify-center bg-[#002147] text-white rounded-full hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-lg shadow-blue-900/20 group/send"
            >
              {sending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar (Members or Media) */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-gray-200 bg-white flex flex-col h-full"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-[#002147]">Members</h3>
              {group.isAdmin && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="p-1.5 bg-[#002147]/10 text-[#002147] rounded-lg hover:bg-[#002147]/20 transition-colors"
                  title="Add Member"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {group.memberDetails?.map((member) => {
                const isMemberAdmin = group.admins?.map(a => a.toString()).includes(member._id.toString());
                const isLastAdmin = isMemberAdmin && group.admins?.length === 1;

                return (
                  <div key={member._id} className="flex items-center gap-3 group/member">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden font-bold text-xs text-gray-500">
                      {member.profileImage ? (
                        <img src={member.profileImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        member.fullName?.charAt(0) || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.fullName} {member._id === user?._id && '(You)'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{member.role || 'Student'}</p>
                    </div>
                    {isMemberAdmin && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Admin</span>
                    )}

                    {/* Admin Controls */}
                    {group.isAdmin && member._id !== user?._id && (
                      <div className="relative">
                        <div className="flex gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity">
                          {/* Remove Member */}
                          <button
                            onClick={() => handleRemoveMember(member._id, member.fullName)}
                            disabled={isMemberAdmin}
                            className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={isMemberAdmin ? "Remove admin status first" : "Remove member"}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>

                          {/* Promote/Demote Admin */}
                          {isMemberAdmin ? (
                            <button
                              onClick={() => handleDemoteFromAdmin(member._id, member.fullName)}
                              disabled={isLastAdmin}
                              className="p-1 text-orange-500 hover:bg-orange-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={isLastAdmin ? "Cannot demote last admin" : "Remove admin"}
                            >
                              <ShieldOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePromoteToAdmin(member._id, member.fullName)}
                              className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                              title="Make admin"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {showMediaGallery && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-gray-200 bg-white flex flex-col h-full"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-[#002147]">Media Gallery</h3>
              <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                {chatMedia.length} items
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {chatMedia.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <p className="text-sm">No media shared yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {chatMedia.map((media, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100 relative group/thumb shadow-sm border border-gray-200"
                      onClick={() => setViewerMedia(media)}
                    >
                      {media.type === 'video' ? (
                        <>
                          <video src={media.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/thumb:bg-black/40 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                              <Play className="w-4 h-4 text-white fill-current" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img src={media.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/5 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poll Editor Modal */}
      <AnimatePresence>
        {showPollEditor && (
          <div className="fixed inset-0 bg-[#002147]/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,33,71,0.25)] border border-white"
            >
              <div className="relative p-10 pb-0">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse-slow">
                      <BarChart2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-semibold text-[#002147] tracking-tight">Create Poll</h2>
                      <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mt-1">Get group feedback</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPollEditor(false)}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all group"
                  >
                    <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="group/field relative">
                    <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3 block px-1">Question</label>
                    <input
                      type="text"
                      value={pollData.question}
                      onChange={(e) => setPollData(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="What's on your mind?"
                      className="w-full px-8 py-5 bg-blue-50/30 border-2 border-transparent rounded-[2rem] text-xl font-medium text-[#002147] placeholder:text-gray-300 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner hover:bg-blue-50/50"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1 block px-1">Options</label>
                    {pollData.options.map((option, idx) => (
                      <div key={idx} className="flex gap-3 animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...pollData.options];
                            newOptions[idx] = e.target.value;
                            setPollData(prev => ({ ...prev, options: newOptions }));
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-6 py-4 bg-[#F8FAFC] border-2 border-transparent rounded-2xl text-[#002147] font-medium placeholder:text-gray-300 focus:bg-white focus:border-blue-200 outline-none transition-all"
                        />
                        {pollData.options.length > 2 && (
                          <button
                            onClick={() => setPollData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }))}
                            className="p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {pollData.options.length < 5 && (
                      <button
                        onClick={() => setPollData(prev => ({ ...prev, options: [...prev.options, ''] }))}
                        className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-sm font-medium text-gray-400 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 group"
                      >
                        <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" />
                        Add another option
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 p-8 bg-[#F8FAFC] rounded-[2.5rem]">
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3 block px-1">Poll Expiry</label>
                      <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                        <input
                          type="datetime-local"
                          value={pollData.expiresAt}
                          onChange={(e) => setPollData(prev => ({ ...prev, expiresAt: e.target.value }))}
                          className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent rounded-2xl text-gray-600 font-medium focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="flex-[0.8] flex items-end">
                      <button
                        onClick={() => {
                          if (pollData.question.trim() && pollData.options.filter(o => o.trim()).length >= 2) {
                            handleSendMessage({ preventDefault: () => { } });
                          } else {
                            alert('Please enter a question and at least 2 options.');
                          }
                        }}
                        className="w-full py-5 bg-[#002147] text-white font-semibold text-sm uppercase tracking-wide rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,33,71,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,33,71,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 overflow-hidden relative group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        Send Poll
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-10" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowAddMember(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-white rounded-2xl shadow-xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#002147]">Add Member</h3>
                <button onClick={() => setShowAddMember(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => handleSearchStudents(e.target.value)}
                  placeholder="Search students by name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]/20 text-gray-900"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searching ? (
                  <div className="text-center py-4 text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(student => (
                    <button
                      key={student._id}
                      onClick={() => handleAddMember(student._id)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">
                        {student.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </button>
                  ))
                ) : searchQuery.length > 1 ? (
                  <p className="text-center py-4 text-gray-500 text-sm">No students found</p>
                ) : (
                  <p className="text-center py-4 text-gray-400 text-sm">Type to search within your university</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Full Media Viewer Overlay */}
      <AnimatePresence>
        {viewerMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10"
            onClick={() => setViewerMedia(null)}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-colors z-[210]"
              onClick={() => setViewerMedia(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navigation Arrows */}
            {chatMedia.length > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={chatMedia.findIndex(m => m.url === viewerMedia.url) === 0}
                  className="absolute left-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed z-[210]"
                  onClick={handlePrevMedia}
                >
                  <ChevronLeft className="w-8 h-8" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={chatMedia.findIndex(m => m.url === viewerMedia.url) === chatMedia.length - 1}
                  className="absolute right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed z-[210]"
                  onClick={handleNextMedia}
                >
                  <ChevronRight className="w-8 h-8" />
                </motion.button>

                {/* Counter */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-black tracking-widest uppercase">
                  {chatMedia.findIndex(m => m.url === viewerMedia.url) + 1} / {chatMedia.length}
                </div>
              </>
            )}

            {viewerMedia.type === 'video' ? (
              <motion.video
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                key={viewerMedia.url}
                src={viewerMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain select-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                key={viewerMedia.url}
                src={viewerMedia.url}
                alt="Full size"
                className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain select-none"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupChat;
