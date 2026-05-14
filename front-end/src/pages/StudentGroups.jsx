import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Search, MessageCircle, ArrowRight, 
  Settings, Hash, BookOpen, Coffee, Award, Zap, X,
  Loader2
} from 'lucide-react';
import { groupsAPI } from '../services/groupsApi';
import { moderateText } from '@/utils/contentModeration';

const ICONS = [
  { name: 'Users', icon: Users },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Coffee', icon: Coffee },
  { name: 'Award', icon: Award },
  { name: 'Zap', icon: Zap },
  { name: 'Hash', icon: Hash },
];

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
  'bg-pink-500', 'bg-orange-500', 'bg-teal-500'
];

const StudentGroups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Form State
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    icon: 'Users',
    color: 'bg-blue-500'
  });
  const [creating, setCreating] = useState(false);
  const [moderationWarning, setModerationWarning] = useState('');

  useEffect(() => {
    fetchGroups();
    
    // Check if we navigated here with intent to create
    if (location.state?.create) {
        setShowCreateModal(true);
        // Clear state so it doesn't reopen on refresh?? 
        // Actually replacing state in history is better UX but optional for MVP
        window.history.replaceState({}, document.title);
    }
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await groupsAPI.getMyGroups();
      if (res.success) {
        setGroups(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    // Check for inappropriate content
    const nameCheck = moderateText(newGroup.name);
    const descCheck = moderateText(newGroup.description || '');

    if (!nameCheck.isClean) {
      setModerationWarning('Group name contains inappropriate language. Please choose a different name.');
      return;
    }

    if (newGroup.description && !descCheck.isClean) {
      setModerationWarning('Group description contains inappropriate language. Please revise before creating.');
      return;
    }

    setModerationWarning('');

    try {
      setCreating(true);
      const res = await groupsAPI.createGroup(newGroup);
      if (res.success) {
        setShowCreateModal(false);
        setNewGroup({ name: '', description: '', icon: 'Users', color: 'bg-blue-500' });
        fetchGroups(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-dark-bg font-sans pb-20 transition-all duration-300 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 mix-blend-multiply opacity-70 animate-blob" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 dark:border-white/5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#002147] dark:text-white mb-2 tracking-tight">My Student Groups</h1>
            <p className="text-gray-500 font-medium">Connect and collaborate with your university peers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#002147] text-white rounded-2xl hover:bg-[#002147]/90 active:scale-95 transition-all shadow-lg shadow-blue-900/20 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Create Group</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#002147] animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-[#002147] dark:text-white mb-2">No Groups Yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              You haven't joined any groups yet. Create one to start collaborating with your peers!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 font-medium hover:underline"
            >
              Create your first group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {groups.map((group) => {
                const Icon = ICONS.find(i => i.name === group.icon)?.icon || Users;
                const colorClass = group.color || 'bg-blue-500';
                
                return (
                  <motion.div
                    key={group._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-white/50 dark:border-white/10 transition-all cursor-pointer group"
                    onClick={() => navigate(`/dashboard/groups/${group._id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${colorClass} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${group.color?.split('-')[1]}-500/30`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {group.isAdmin && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                          Admin
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-[#002147] dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2 min-h-[40px]">
                      {group.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{group.memberCount} members</span>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                        Open <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto max-w-lg h-fit bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 p-6 md:p-8 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#002147] dark:text-white">Create Group</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group Name</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147]/20 dark:focus:ring-blue-500/40 focus:border-[#002147] dark:focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                    placeholder="e.g., CS Study Group"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    rows={3}
                    maxLength={200}
                    value={newGroup.description}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147]/20 dark:focus:ring-blue-500/40 focus:border-[#002147] dark:focus:border-blue-500 transition-all resize-none text-gray-900 dark:text-white"
                    placeholder="What is this group about?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                  <div className="flex flex-wrap gap-3">
                    {ICONS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = newGroup.icon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setNewGroup(prev => ({ ...prev, icon: item.name }))}
                          className={`p-3 rounded-xl border transition-all ${isSelected 
                            ? 'bg-[#002147] border-[#002147] text-white' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => {
                      const isSelected = newGroup.color === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewGroup(prev => ({ ...prev, color }))}
                          className={`w-10 h-10 rounded-full ${color} transition-transform ${isSelected ? 'ring-4 ring-offset-2 ring-[#002147] scale-110' : 'hover:scale-105'}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Moderation Warning */}
                {moderationWarning && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600 font-medium">{moderationWarning}</p>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={creating || !newGroup.name.trim()}
                    className="w-full py-4 bg-[#002147] text-white font-bold rounded-xl hover:bg-[#002147]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Group'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentGroups;
