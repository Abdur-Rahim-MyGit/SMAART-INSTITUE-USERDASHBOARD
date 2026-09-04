import { useEffect, useState } from 'react';

/**
 * Traceability watermark over the question area.
 *
 * A phone held below the desk can photograph the screen without ever being
 * seen by the webcam, and no detector will catch every such case. What can be
 * done is to make the photo worthless to share: the candidate's name, id and
 * the time are tiled faintly across the paper, so any leaked image identifies
 * who leaked it and when. Standard practice in proctored exams.
 *
 * Faint enough not to hinder reading; dense enough that cropping cannot
 * remove it.
 */
const ExamWatermark = ({ name, studentId, reference }) => {
  const [stamp, setStamp] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setStamp(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const time = stamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = stamp.toLocaleDateString([], { day: '2-digit', month: 'short' });
  const label = [name, studentId, reference, `${date} ${time}`].filter(Boolean).join('  ·  ');

  // A 4 x 6 grid of rotated labels covers any card size without measuring it.
  const cells = Array.from({ length: 24 });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none"
    >
      <div className="grid h-full w-full grid-cols-4 grid-rows-6">
        {cells.map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            <span
              className="whitespace-nowrap text-[11px] font-semibold tracking-wider text-[#072036] opacity-[0.07] dark:text-white dark:opacity-[0.09]"
              style={{ transform: 'rotate(-24deg)' }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamWatermark;
