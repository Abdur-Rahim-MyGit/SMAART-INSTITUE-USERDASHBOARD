import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
  ComposedChart
} from 'recharts';
import {
  TrendingUp, Users, Award, Clock, BookOpen, CheckCircle2,
  ListFilter, ShieldAlert, BarChart2, ShieldCheck, HelpCircle,
  Flame, LogIn, LogOut, Activity, Calendar, Zap, AlertTriangle
} from 'lucide-react';
import { apiCall } from '@/services/api';
import useUser from '@/hooks/useUser';
import { streaksAPI } from '@/services/streaksApi';

// ----------------------------------------------------
// CUSTOM TOOLTIP COMPONENTS
// ----------------------------------------------------
const CustomTooltip = ({ active, payload, label, y1Name = "Progress", y2Name = "Hours Spent" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#002147] p-4 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 text-xs">
        <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {p.value}{p.name.includes('Rate') || p.name.includes('Progress') ? '%' : p.name.includes('Hours') || p.name.includes('Time') ? 'h' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ----------------------------------------------------
// 1. STUDENT ANALYTICS VIEW
// ----------------------------------------------------
export const StudentAnalyticsView = () => {
  const { user } = useUser();
  const [data, setData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [res, streakRes] = await Promise.all([
          apiCall('/analytics/student'),
          streaksAPI.getStatus().catch(() => null)
        ]);
        if (res.success) {
          setData(res);
        }
        if (streakRes && streakRes.success) {
          setStreakData(streakRes.data);
        }
      } catch (err) {
        console.error('Failed fetching student analytics and streaks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#002A5C] rounded-2xl border border-slate-100 dark:border-white/10 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-400 mb-4" />
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">No Student Data Available</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Enroll in courses to begin tracking your progress.</p>
      </div>
    );
  }

  const { metrics, courses, timeline } = data;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Activity Time', value: `${metrics.activityTime || 0} mins`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Daily Usage', value: metrics.dailyUsage ? (metrics.dailyUsage >= 1 ? `${metrics.dailyUsage}h/day` : `${Math.round(metrics.dailyUsage * 60)} mins/day`) : '0 mins/day', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Total Time Spent', value: `${metrics.totalHoursSpent || 0} hours`, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Individual Progress', value: `${metrics.avgProgress || 0}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Progression Chart (Completion % vs Hours/Day) */}
      <div className="bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10">
        <div className="mb-6">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            Progression Over Time
          </h3>
          <p className="text-xs text-slate-400 mt-1">Correlation between completion % and daily usage (hours/day)</p>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeline}>
              <defs>
                <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Completion %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Hours/Day', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Area yAxisId="left" type="monotone" name="Completion %" dataKey="progress" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
              <Bar yAxisId="right" name="Hours/Day" dataKey="hoursSpent" barSize={24} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-white dark:bg-[#002A5C] rounded-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="font-bold text-slate-900 dark:text-white">Active Enrollments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-middle">
            <thead className="bg-[#F8FAFC] dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Total Time</th>
                <th className="px-6 py-4">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {courses.map((enroll, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    {enroll.course?.title || 'Unknown Course'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      enroll.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {enroll.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-200 dark:bg-[#003170] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${enroll.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold">{enroll.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {Math.round((enroll.totalTimeSpent / 60) * 10) / 10} hours
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {enroll.overallScore ? `${enroll.overallScore}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Streaks & Activity Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streak Board */}
        <div className="bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                Active Learning Streaks
              </h3>
              <span className="text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Gamified Learning
              </span>
            </div>

            {/* Streak Counter display */}
            <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-white/5 mb-6">
              <div className="relative flex items-center justify-center bg-gradient-to-tr from-orange-500 to-amber-500 p-4 rounded-2xl shadow-lg shadow-orange-500/20">
                <Flame className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Current Streak</p>
                <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
                  {streakData?.currentStreak || 0} <span className="text-sm font-semibold text-slate-500">Days</span>
                </h4>
              </div>
            </div>

            {/* Longest Streak / Milestones */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">Longest Streak</p>
                <h5 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1 flex justify-center items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-500" /> {streakData?.longestStreak || 0} Days
                </h5>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">Rest Days Policy</p>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                  Sundays rest day 🧘
                </h5>
              </div>
            </div>

            {/* Restoration Vouchers */}
            {streakData?.achievements && streakData.achievements.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Earned Vouchers</p>
                {streakData.achievements.map((ach, idx) => ach.voucher?.status === 'Active' && (
                  <div key={idx} className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl text-xs text-amber-600 dark:text-amber-400">
                    <span className="font-semibold flex items-center gap-1.5"><Award className="w-4 h-4" /> {ach.title}</span>
                    <span className="font-mono bg-white dark:bg-[#002A5C] px-2 py-0.5 rounded border border-amber-500/30 uppercase font-bold text-[10px] tracking-wider">{ach.voucher.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
            Streak records update automatically upon completing a step. Complete a course step daily to keep your streak alive!
          </div>
        </div>

        {/* Audit Activity & Session Logs */}
        <div className="bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Live Student Activity Feed
              </h3>
              <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Audit Trail
              </span>
            </div>

            {/* Activity Logs Timeline */}
            <div className="relative border-l-2 border-slate-100 dark:border-white/10 pl-6 space-y-6">
              {/* Login Event */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white dark:ring-[#002A5C] shadow">
                  <LogIn className="w-2.5 h-2.5 text-white" />
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Session Started (Login Logged)</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Just now'}
                  </p>
                </div>
              </div>

              {/* Course Attendance Event */}
              {courses && courses.length > 0 ? (
                courses.slice(0, 2).map((enroll, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#002A5C] shadow">
                      <BookOpen className="w-2.5 h-2.5 text-white" />
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {enroll.status === 'completed' ? 'Course Completed' : 'Course Lectures Attended'}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Course: <span className="font-semibold">{enroll.course?.title}</span> ({enroll.progress}% progressed)
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Last Active: {enroll.updatedAt ? new Date(enroll.updatedAt).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-slate-400 ring-4 ring-white dark:ring-[#002A5C] shadow">
                    <Calendar className="w-2.5 h-2.5 text-white" />
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">No Course Attendance Logged</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Enroll in a course to begin attendance logging.</p>
                  </div>
                </div>
              )}

              {/* Compliance / Security Checklist */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-purple-500 ring-4 ring-white dark:ring-[#002A5C] shadow">
                  <ShieldCheck className="w-2.5 h-2.5 text-white" />
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Compliance & Proctoring Scorecard</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                    Proctoring Checks: <span className="font-semibold text-emerald-500">Fully Active & Passed ✅</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            Security system captures abnormal activities, tab switching, and minimizes. Keep your proctoring logs clean.
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. COLLEGE ANALYTICS VIEW
// ----------------------------------------------------
export const CollegeAnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollegeData = async () => {
      try {
        const res = await apiCall('/analytics/college');
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed fetching college analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollegeData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#002A5C] rounded-2xl border border-slate-100 dark:border-white/10 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-400 mb-4" />
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">No College Data Available</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">You must be associated with an active college.</p>
      </div>
    );
  }

  const { college, currentStats, trends, leaderboard } = data;

  return (
    <div className="space-y-6">
      {/* College Info & Stats Summary */}
      <div className="bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">College Portal</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{college.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Code: {college.code} | Registered Students: {college.totalStudents}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 min-w-[120px]">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1">GLOBAL RANK</p>
            <h4 className="text-xl font-extrabold text-emerald-500 flex items-center gap-1">
              <Award className="w-5 h-5" /> #{currentStats.rank || 1}
            </h4>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 min-w-[120px]">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1">AVG PROGRESS</p>
            <h4 className="text-xl font-extrabold text-blue-500">
              {currentStats.averageProgress}%
            </h4>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 min-w-[120px]">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1">ACTIVE TODAY</p>
            <h4 className="text-xl font-extrabold text-purple-500">
              {currentStats.activeStudents || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* College Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Student Participation Trends
            </h3>
            <p className="text-xs text-slate-400 mt-1">Daily active students and student participation rate percentage</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorParticipate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Participation Rate (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Active Students', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip y1Name="Participation Rate" y2Name="Active Students" />} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Area yAxisId="left" type="monotone" name="Participation Rate (%)" dataKey="participationRate" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorParticipate)" />
                <Line yAxisId="right" type="monotone" name="Active Students" dataKey="activeStudents" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Trend */}
        <div className="bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Average progress curve
            </h3>
            <p className="text-xs text-slate-400 mt-1">Average syllabus progression of enrolled students</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorAvgProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip y1Name="Average Progress" y2Name="" />} />
                <Area type="monotone" name="Average Progress" dataKey="averageProgress" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAvgProgress)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-[#002A5C] rounded-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Top 10 Active Students (Leaderboard)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-middle">
            <thead className="bg-[#F8FAFC] dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Avg Course Progress</th>
                <th className="px-6 py-4">Learning Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {leaderboard.map((student, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">
                    {student.studentId}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    {student.fullName}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {student.rollNumber || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-[#003170] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${student.avgProgress}%` }} />
                      </div>
                      <span className="text-xs font-bold">{student.avgProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    {student.totalHours || 0} hours
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. ADMIN ANALYTICS VIEW
// ----------------------------------------------------
export const AdminAnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await apiCall('/analytics/admin');
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed fetching admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#002A5C] rounded-2xl border border-slate-100 dark:border-white/10 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-400 mb-4" />
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">No System Data Available</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">You must be logged in as a System Admin.</p>
      </div>
    );
  }

  const { summary, trends, collegeLeaderboard } = data;

  return (
    <div className="space-y-6">
      {/* Admin Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Colleges', value: summary.totalColleges, icon: Award, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Students', value: summary.totalStudents, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Total Teachers', value: summary.totalTeachers, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Total Course Enrollments', value: summary.totalEnrollments, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Global Activity Trend (DAU vs Hours Active) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Global System Activity
            </h3>
            <p className="text-xs text-slate-400 mt-1">Daily active users and cumulative hours spent over the last 30 days</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorDAU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Daily Active Users (DAU)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Hours Active', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip y1Name="DAU" y2Name="Hours Spent" />} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Area yAxisId="left" type="monotone" name="Daily Active Users" dataKey="dailyActiveUsers" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDAU)" />
                <Line yAxisId="right" type="monotone" name="System Active Hours" dataKey="hoursActive" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Completion Speed */}
        <div className="bg-white dark:bg-[#002A5C] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Course Completion Speed
            </h3>
            <p className="text-xs text-slate-400 mt-1">Average days taken to complete a syllabus over time</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Avg Days to Complete', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip y1Name="Avg Days" y2Name="" />} />
                <Area type="monotone" name="Average Speed (Days)" dataKey="averageCourseCompletionSpeed" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSpeed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* College Leaderboard Table */}
      <div className="bg-white dark:bg-[#002A5C] rounded-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Top Colleges Performance Rankings
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-middle">
            <thead className="bg-[#F8FAFC] dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">College Name</th>
                <th className="px-6 py-4">Total Students</th>
                <th className="px-6 py-4">Active Students</th>
                <th className="px-6 py-4">Average Progress</th>
                <th className="px-6 py-4">Participation Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {collegeLeaderboard.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${item.rank}`}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    {item.collegeName}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {item.studentCount}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {item.activeStudents}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-[#003170] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.averageProgress}%` }} />
                      </div>
                      <span className="text-xs font-bold">{item.averageProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-500">
                    {item.participationRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
