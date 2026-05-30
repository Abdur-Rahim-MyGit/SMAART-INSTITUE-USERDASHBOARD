import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Loader2,
  Upload,
  Trash2,
  Edit,
  CheckCircle2,
  FileEdit
} from 'lucide-react';
import { toast } from 'sonner';
import { coursesAPI } from '@/services/api';
import { COURSE_STAGE_TITLES } from '@/utils/courseStages';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionId, setActionId] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await coursesAPI.getAll({ limit: 100 });
      setCourses(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSyncDefaults = async () => {
    setSyncing(true);
    try {
      const res = await coursesAPI.syncDefaults();
      toast.success(res.message || `Synced ${res.count} courses with 7 stages`);
      await fetchCourses();
    } catch (err) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handlePublish = async (id) => {
    setActionId(id);
    try {
      await coursesAPI.publish(id);
      toast.success('Course published with 7 stages');
      await fetchCourses();
    } catch (err) {
      toast.error(err.message || 'Publish failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setActionId(id);
    try {
      await coursesAPI.delete(id);
      toast.success('Course deleted');
      await fetchCourses();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setActionId(null);
    }
  };

  const publishedCount = courses.filter((c) => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#00152E] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#112b6b] dark:text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-[#1a3884]" />
              Course Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create, publish, and sync courses with {COURSE_STAGE_TITLES.length} stages:{' '}
              {COURSE_STAGE_TITLES.join(', ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSyncDefaults}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#112b6b] hover:bg-gray-50 disabled:opacity-60"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Sync dashboard catalog (40)
            </button>
            <Link
              to="/dashboard/admin/courses/create"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3884] text-white rounded-xl text-sm font-bold hover:bg-[#112b6b]"
            >
              <Plus className="w-4 h-4" />
              New course
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-[#002147] rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</p>
            <p className="text-3xl font-black text-[#1a3884]">{courses.length}</p>
          </div>
          <div className="bg-white dark:bg-[#002147] rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Published</p>
            <p className="text-3xl font-black text-emerald-600">{publishedCount}</p>
          </div>
          <div className="bg-white dark:bg-[#002147] rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stages per course</p>
            <p className="text-3xl font-black text-[#112b6b] dark:text-white">{COURSE_STAGE_TITLES.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#002147] rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
            <h2 className="font-bold text-[#112b6b] dark:text-white">All courses</h2>
            <button
              onClick={fetchCourses}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a3884]" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 px-6">
              <p className="text-gray-500 mb-4">No courses in database yet.</p>
              <button
                onClick={handleSyncDefaults}
                className="text-[#1a3884] font-bold text-sm hover:underline"
              >
                Sync the 40 dashboard courses →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/10 max-h-[70vh] overflow-y-auto">
              {courses.map((course) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-[#1a3884] bg-blue-50 px-2 py-0.5 rounded">
                        {course.courseCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          course.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#112b6b] dark:text-white truncate">{course.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{course.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {course.modules?.[0]?.days?.length || 0} stages in DB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {course.status !== 'active' && (
                      <button
                        onClick={() => handlePublish(course._id)}
                        disabled={actionId === course._id}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {actionId === course._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Publish
                      </button>
                    )}
                    <Link
                      to={`/dashboard/admin/courses/edit/${course._id}`}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(course._id, course.title)}
                      disabled={actionId === course._id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          <FileEdit className="w-3 h-3 inline mr-1" />
          Published courses appear on the user dashboard. Empty video URLs use a temporary placeholder until real videos are uploaded.
        </p>
      </div>
    </div>
  );
};

export default AdminCourses;
