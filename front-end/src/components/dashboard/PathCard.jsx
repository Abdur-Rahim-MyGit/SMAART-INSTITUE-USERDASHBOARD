import { memo } from "react";
import { Code, Database, Cloud, BookOpen } from "lucide-react";
import { COLORS, COURSE_COLORS } from "@/constants/dashboard";
import { useNavigate } from "react-router-dom";

const PathCard = memo(({ path }) => {
  const navigate = useNavigate();
  const IconComponent = { Code, Database, Cloud, BookOpen }[path.icon] || BookOpen;
  
  const getIconColor = (color) => {
    switch (color) {
      case 'blue': return COLORS.PRIMARY;
      case 'indigo': return COLORS.INDIGO_600;
      case 'amber': return COLORS.AMBER_600;
      default: return COLORS.PRIMARY;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm group hover:shadow-md transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
          <IconComponent className={`w-5 h-5 ${getIconColor(path.color)}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{path.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{path.subtitle}</p>
        </div>
      </div>

      <button
        onClick={() => navigate('/dashboard/courses')}
        className="w-full text-white py-2.5 rounded-lg text-sm font-semibold transition-all"
        style={{ backgroundColor: COLORS.PRIMARY }}
        onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.PRIMARY_DARK}
        onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.PRIMARY}
      >
        {path.btnText}
      </button>
    </div>
  );
});

export default PathCard;
