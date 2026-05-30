import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { coursesAPI } from '@/services/api';
import { COURSE_STAGE_TITLES } from '@/utils/courseStages';

const emptyStage = (title) => ({
  title,
  description: '',
  videoUrl: ''
});

const AdminCourseForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    courseCode: '',
    title: '',
    description: '',
    category: 'Capacity',
    status: 'draft',
    stages: COURSE_STAGE_TITLES.map(emptyStage),
    microAssessments: [],
    moduleExtras: {},
  });

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await coursesAPI.getById(id);
        const course = res.data;
        const days = course.modules?.[0]?.days || [];
        const module = course.modules?.[0] || {};
        setForm({
          courseCode: course.courseCode || '',
          title: course.title || '',
          description: course.description || '',
          category: course.category || 'Capacity',
          status: course.status || 'draft',
          microAssessments: module.microAssessments || [],
          moduleExtras: {
            days: module.days || [],
          },
          stages: COURSE_STAGE_TITLES.map((defaultTitle, index) => {
            const day = days[index] || {};
            return {
              title: day.moduleDetails?.title || defaultTitle,
              description: day.moduleDetails?.description || day.videoContent?.description || '',
              videoUrl: day.videoContent?.videoUrl || ''
            };
          })
        });
      } catch (err) {
        toast.error(err.message || 'Failed to load course');
        navigate('/dashboard/admin/courses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateStage = (index, field, value) => {
    setForm((prev) => {
      const stages = [...prev.stages];
      stages[index] = { ...stages[index], [field]: value };
      return { ...prev, stages };
    });
  };

  const buildPayload = (publish) => {
    const days = form.stages.map((stage, index) => ({
      dayNumber: index + 1,
      dayType: 'course',
      moduleDetails: {
        title: stage.title || COURSE_STAGE_TITLES[index],
        description: stage.description || `${stage.title} for ${form.title}`
      },
      videoContent: {
        title: `${form.title} - ${stage.title}`,
        description: stage.description,
        videoUrl: stage.videoUrl?.trim() || null,
        duration: 5
      },
      status: 'active'
    }));

    const existingDays = form.moduleExtras?.days || [];
    const mergedDays = days.map((day, index) => {
      const existingDay = existingDays[index];
      if (existingDay?.steps?.length) {
        return { ...existingDay, ...day, steps: existingDay.steps };
      }
      return day;
    });

    return {
      courseCode: form.courseCode.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      duration: 7,
      modules: [
        {
          title: 'Seven Stage Learning Flow',
          description: `Seven-stage flow for ${form.title}`,
          duration: 7,
          sequence: 1,
          status: 'active',
          days: mergedDays,
          ...(form.microAssessments?.length
            ? { microAssessments: form.microAssessments }
            : {}),
        }
      ],
      publish,
      status: publish ? 'active' : form.status
    };
  };

  const handleSubmit = async (publish = false) => {
    if (!form.courseCode || !form.title) {
      toast.error('Course code and title are required');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(publish);
      if (isEdit) {
        if (publish) {
          await coursesAPI.publish(id, payload);
        } else {
          await coursesAPI.update(id, payload);
        }
        toast.success(publish ? 'Course published' : 'Course saved');
      } else {
        await coursesAPI.create(payload);
        toast.success(publish ? 'Course created and published' : 'Course created as draft');
      }
      navigate('/dashboard/admin/courses');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3884]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#00152E] p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/dashboard/admin/courses"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#1a3884] mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to courses
        </Link>

        <h1 className="text-2xl font-extrabold text-[#112b6b] dark:text-white mb-8">
          {isEdit ? 'Edit course' : 'Create course'}
        </h1>

        <div className="space-y-6">
          <section className="bg-white dark:bg-[#002147] rounded-2xl p-6 border border-gray-100 dark:border-white/10 space-y-4">
            <h2 className="font-bold text-[#112b6b] dark:text-white">Course details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold text-gray-500 uppercase">Course code</span>
                <input
                  value={form.courseCode}
                  onChange={(e) => updateField('courseCode', e.target.value)}
                  placeholder="S01"
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-[#001835] dark:border-white/10"
                  disabled={isEdit}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-500 uppercase">Category</span>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-[#001835] dark:border-white/10"
                >
                  {['Capacity', 'Capability', 'Leadership', 'PIQ', 'AIQ', 'SQ'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-gray-500 uppercase">Title</span>
              <input
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-[#001835] dark:border-white/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-gray-500 uppercase">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-[#001835] dark:border-white/10"
              />
            </label>
          </section>

          <section className="bg-white dark:bg-[#002147] rounded-2xl p-6 border border-gray-100 dark:border-white/10 space-y-4">
            <h2 className="font-bold text-[#112b6b] dark:text-white">
              Seven stages ({COURSE_STAGE_TITLES.join(' → ')})
            </h2>
            <p className="text-xs text-gray-500">
              Leave video URL empty to use the temporary placeholder video until real content is ready.
            </p>
            {form.stages.map((stage, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-[#001835]/50"
              >
                <p className="text-xs font-bold text-[#1a3884] mb-3">
                  Stage {index + 1}: {COURSE_STAGE_TITLES[index]}
                </p>
                <div className="space-y-3">
                  <input
                    value={stage.title}
                    onChange={(e) => updateStage(index, 'title', e.target.value)}
                    placeholder="Stage title"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm dark:bg-[#002147] dark:border-white/10"
                  />
                  <textarea
                    value={stage.description}
                    onChange={(e) => updateStage(index, 'description', e.target.value)}
                    placeholder="Stage description"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm dark:bg-[#002147] dark:border-white/10"
                  />
                  <input
                    value={stage.videoUrl}
                    onChange={(e) => updateStage(index, 'videoUrl', e.target.value)}
                    placeholder="Video URL (optional — uses temp video if empty)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm dark:bg-[#002147] dark:border-white/10"
                  />
                </div>
              </div>
            ))}
          </section>

          <div className="flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl font-bold text-sm disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 bg-[#1a3884] text-white rounded-xl font-bold text-sm hover:bg-[#112b6b] disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Publish (7 stages)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCourseForm;
