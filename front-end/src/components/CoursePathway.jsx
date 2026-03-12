import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, ChevronRight } from "lucide-react";

const STEPS = [
  {
    id: 1,
    label: "STEP 01",
    title: "Capacity",
    subtitle: "Level 1: Foundations",
    description: "Build the foundational skills and resources to perform at your best in any environment.",
    active: true,
  },
  {
    id: 2,
    label: "STEP 02",
    title: "Capability",
    subtitle: "Level 2: Intermediate",
    description: "Develop core competencies and technical expertise to excel in your chosen field.",
    active: false,
  },
  {
    id: 3,
    label: "STEP 03",
    title: "Leadership",
    subtitle: "Level 3: Advanced",
    description: "Cultivate the mindset and vision to lead teams and drive meaningful change.",
    active: false,
  },
];

const CoursePathway = ({ onCourseClick }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="w-full select-none">
      {/* ── MY COURSES Header ── */}
      <div style={{
        background: '#1a3884',
        padding: '18px 0 14px',
        textAlign: 'center',
        position: 'relative',
        marginBottom: '0',
      }}>

        <h2 style={{
          color: '#ffffff',
          fontFamily: "'Playfair Display', 'Georgia', serif",
          fontSize: '28px',
          fontWeight: '700',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          My Courses
        </h2>
      </div>

      {/* Thin gold/cream line below header */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #c9a84c, #daa520, #c9a84c)' }} />

      {/* ── Cards Container ── */}
      <div style={{
        background: '#f5f0e8',
        padding: isMobile ? '24px 16px 32px' : '60px 24px 60px',
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '24px' : '28px',
          justifyContent: 'center',
          alignItems: isMobile ? 'center' : 'stretch',
          maxWidth: '960px',
          margin: '0 auto',
        }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              style={{
                flex: isMobile ? 'none' : '1',
                maxWidth: isMobile ? '280px' : '300px',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <BookCard step={step} index={i} onCourseClick={onCourseClick} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Book-Style Card Component ── */
const BookCard = ({ step, index, onCourseClick }) => {
  const [hovered, setHovered] = useState(false);

  const navyBlue = '#1a3884';
  const gold = '#c9a84c';
  const cream = '#faf7f0';
  const creamDark = '#f0ebe0';

  return (
    <motion.div
      whileHover={{ y: step.active ? -6 : 0, scale: step.active ? 1.02 : 1 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={step.active ? "cursor-pointer" : "cursor-not-allowed"}
      onClick={() => step.active && onCourseClick?.(step.id)}
      style={{ perspective: '1000px' }}
    >
      {/* Outer book container */}
      <div style={{
        display: 'flex',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: hovered && step.active
          ? '0 12px 40px rgba(26, 56, 132, 0.35), 0 4px 12px rgba(0,0,0,0.15)'
          : '0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.3s ease',
      }}>
        {/* Book Spine */}
        <div style={{
          width: '32px',
          minHeight: '100%',
          background: `linear-gradient(180deg, ${navyBlue}, #0f2460)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
          padding: '20px 0',
          flexShrink: 0,
          position: 'relative',
        }}>
          {/* Spine decorative lines */}
          <div style={{ width: '14px', height: '2px', background: gold, opacity: 0.7, borderRadius: '1px' }} />
          <div style={{ width: '14px', height: '2px', background: gold, opacity: 0.7, borderRadius: '1px' }} />
          <div style={{ width: '14px', height: '2px', background: gold, opacity: 0.5, borderRadius: '1px' }} />
          <div style={{ width: '14px', height: '2px', background: gold, opacity: 0.7, borderRadius: '1px' }} />
          <div style={{ width: '14px', height: '2px', background: gold, opacity: 0.7, borderRadius: '1px' }} />
        </div>

        {/* Book Page Area */}
        <div style={{
          flex: 1,
          background: cream,
          padding: '4px',
          border: `3px solid ${navyBlue}`,
          borderLeft: 'none',
          position: 'relative',
        }}>
          {/* Inner page with ornate border */}
          <div style={{
            border: `1.5px solid ${gold}55`,
            padding: '28px 20px 24px',
            position: 'relative',
            minHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${cream} 0%, #ffffff 50%, ${cream} 100%)`,
          }}>
            {/* Corner Ornaments - Top Left */}
            <OrnateCorner position="top-left" color={gold} />
            <OrnateCorner position="top-right" color={gold} />
            <OrnateCorner position="bottom-left" color={gold} />
            <OrnateCorner position="bottom-right" color={gold} />

            {/* Course Title */}
            <h3 style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: '28px',
              fontWeight: '700',
              color: navyBlue,
              margin: '0 0 8px 0',
              textAlign: 'center',
              lineHeight: 1.2,
            }}>
              {step.title}
            </h3>

            {/* Subtitle */}
            <p style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: '13px',
              fontWeight: '500',
              color: '#555',
              margin: '0 0 4px 0',
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
              {step.subtitle}
            </p>

            {/* Description */}
            <p style={{
              fontSize: '11px',
              fontWeight: '400',
              color: '#666',
              margin: '0 0 20px 0',
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: '180px',
            }}>
              {step.description}
            </p>

            {/* Lock icon and message for locked courses */}
            {!step.active && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  marginBottom: '8px',
                }}>
                  <svg viewBox="0 0 40 40" width="40" height="40">
                    {/* Lock body */}
                    <rect x="8" y="18" width="24" height="18" rx="2" fill={gold} opacity="0.85" />
                    {/* Lock shackle */}
                    <path d="M13 18 V13 C13 8 17 5 20 5 C23 5 27 8 27 13 V18" fill="none" stroke={gold} strokeWidth="3" opacity="0.85" />
                    {/* Keyhole */}
                    <circle cx="20" cy="27" r="3" fill={cream} />
                    <rect x="19" y="28" width="2" height="4" fill={cream} />
                  </svg>
                </div>
                <p style={{
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontSize: '12px',
                  color: '#777',
                  fontStyle: 'italic',
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  Complete previous<br />to unlock
                </p>
              </div>
            )}

            {/* Start Course button for active course */}
            {step.active && (
              <button
                style={{
                  marginTop: '4px',
                  padding: '8px 24px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: hovered ? '#fff' : navyBlue,
                  background: hovered ? navyBlue : 'transparent',
                  border: `1.5px solid ${navyBlue}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Start Course
                <ChevronRight size={12} />
              </button>
            )}

            {/* Unlocked corner ribbon for active course */}
            {step.active && (
              <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '80px',
                height: '80px',
                overflow: 'hidden',
              }}>
                {/* Gold triangle */}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '0',
                  height: '0',
                  borderStyle: 'solid',
                  borderWidth: '0 0 80px 80px',
                  borderColor: `transparent transparent ${gold} transparent`,
                  opacity: 0.9,
                }} />
                {/* Unlocked text */}
                <span style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '-8px',
                  width: '90px',
                  textAlign: 'center',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center center',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '700',
                  fontStyle: 'italic',
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  letterSpacing: '0.5px',
                }}>
                  Unlocked
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Ornate Corner Decoration ── */
const OrnateCorner = ({ position, color }) => {
  const size = 28;
  const styles = {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    opacity: 0.45,
  };

  const posMap = {
    'top-left': { top: '4px', left: '4px' },
    'top-right': { top: '4px', right: '4px', transform: 'scaleX(-1)' },
    'bottom-left': { bottom: '4px', left: '4px', transform: 'scaleY(-1)' },
    'bottom-right': { bottom: '4px', right: '4px', transform: 'scale(-1, -1)' },
  };

  return (
    <div style={{ ...styles, ...posMap[position] }}>
      <svg viewBox="0 0 30 30" width={size} height={size}>
        {/* Corner flourish */}
        <path d="M2 2 L2 14 C2 8 8 2 14 2 L2 2Z" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M2 2 Q8 2 8 8" fill="none" stroke={color} strokeWidth="1.2" />
        <path d="M4 2 Q10 2 10 4" fill="none" stroke={color} strokeWidth="0.8" />
        <circle cx="4" cy="4" r="1.2" fill={color} />
        {/* Curly element */}
        <path d="M2 10 C5 10 7 8 8 5" fill="none" stroke={color} strokeWidth="0.8" />
        <path d="M10 2 C10 5 8 7 5 8" fill="none" stroke={color} strokeWidth="0.8" />
      </svg>
    </div>
  );
};

export default CoursePathway;
