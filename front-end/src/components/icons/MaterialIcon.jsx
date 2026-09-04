import { forwardRef } from "react";

/**
 * Base renderer for Google Material Symbols.
 *
 * Material Symbols is a variable icon *font*, so an icon is a <span> whose text
 * content is the icon's ligature name and whose size is a font-size. The rest of
 * the dashboard was written against Lucide/Tabler components that take Tailwind
 * `w-N h-N` classes, so this component reads those classes back out and turns
 * them into a matching font-size. That keeps every existing call site working
 * unchanged -- only the import line had to move.
 *
 * Do not use this directly. Import a named icon from "@/components/icons",
 * which guarantees the ligature name is one the subsetted font actually ships.
 */

// Tailwind spacing scale -> pixels (Tailwind's unit is 0.25rem = 4px).
const SIZE_SCALE = {
  "2": 8, "2.5": 10, "3": 12, "3.5": 14, "4": 16, "4.5": 18, "5": 20, "6": 24,
  "7": 28, "8": 32, "9": 36, "10": 40, "11": 44, "12": 48, "14": 56,
  "16": 64, "20": 80, "24": 96,
};

const DEFAULT_SIZE = 20;

function resolveSize(className, size) {
  if (typeof size === "number") return size;
  const cls = className || "";

  // Arbitrary value first: w-[18px]. Guard against max-w-[...] / min-w-[...].
  const arbitrary = cls.match(/(?:^|\s)w-\[(\d+(?:\.\d+)?)px\]/);
  if (arbitrary) return parseFloat(arbitrary[1]);

  // Scale value: w-4, w-3.5
  const scale = cls.match(/(?:^|\s)w-(\d+(?:\.\d+)?)(?:\s|$)/);
  if (scale && SIZE_SCALE[scale[1]] !== undefined) return SIZE_SCALE[scale[1]];

  return DEFAULT_SIZE;
}

const MaterialIcon = forwardRef(function MaterialIcon(
  {
    name,
    className = "",
    size,
    // 400 is the Material Symbols standard weight. 300 rendered too thin at
    // sidebar/card sizes -- the strokes washed out against pale chip fills.
    weight = 400,
    fill = 0,
    grade = 0,
    style,
    // Props that Lucide/Tabler accepted but a <span> must not receive.
    strokeWidth,
    absoluteStrokeWidth,
    stroke,
    color,
    ...rest
  },
  ref
) {
  const px = resolveSize(className, size);
  // opsz is only defined over 20..48; clamp so the axis stays in range.
  const opsz = Math.min(48, Math.max(20, px));

  return (
    <span
      ref={ref}
      aria-hidden="true"
      translate="no"
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: `${px}px`,
        width: `${px}px`,
        height: `${px}px`,
        color,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opsz}`,
        ...style,
      }}
      {...rest}
    >
      {name}
    </span>
  );
});

export default MaterialIcon;
