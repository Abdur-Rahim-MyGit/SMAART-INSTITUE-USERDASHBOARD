import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { big5Explanations } from '../utils/big5Utils';

const Big5RadarChart = ({ scores }) => {
  const [hoveredTrait, setHoveredTrait] = useState(null);

  if (!scores) return null;

  // Define the six traits in order for the hexagon
  const traits = [
    { key: 'openness', label: 'Openness', angle: 0 },
    { key: 'conscientiousness', label: 'Conscientiousness', angle: 60 },
    { key: 'extraversion', label: 'Extraversion', angle: 120 },
    { key: 'agreeableness', label: 'Agreeableness', angle: 180 },
    { key: 'neuroticism', label: 'Neuroticism', angle: 240 },
    { key: 'emotionalStability', label: 'Emotional Stability', angle: 300 },
  ];

  const centerX = 250;
  const centerY = 250;
  const maxRadius = 140;
  const levels = 5;

  const getPointColor = (score) => {
    const percentage = score;
    if (percentage <= 25) return '#ef4444'; // red-500
    if (percentage <= 50) return '#f59e0b'; // amber-500
    if (percentage <= 75) return '#4ade80'; // green-400
    return '#16a34a'; // green-600
  };

  // Calculate point on circle
  const polarToCartesian = (angle, radius) => {
    const angleInRadians = ((angle - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Create background grid (concentric hexagons)
  const gridLevels = [];
  for (let i = 1; i <= levels; i++) {
    const radius = (maxRadius / levels) * i;
    const points = traits
      .map(trait => {
        const point = polarToCartesian(trait.angle, radius);
        return `${point.x},${point.y}`;
      })
      .join(' ');
    gridLevels.push(
      <polygon
        key={i}
        points={points}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="1"
      />
    );
  }

  // Create axis lines
  const axisLines = traits.map(trait => {
    const point = polarToCartesian(trait.angle, maxRadius);
    return (
      <line
        key={trait.key}
        x1={centerX}
        y1={centerY}
        x2={point.x}
        y2={point.y}
        stroke="#e5e7eb"
        strokeWidth="1"
      />
    );
  });

  // Create data polygon
  const dataPoints = traits.map(trait => {
    const score = scores[trait.key]?.raw || 0;
    const normalizedScore = (score / 100) * maxRadius; // Normalize to 0-maxRadius
    return {
      ...polarToCartesian(trait.angle, normalizedScore),
      trait: trait.key,
      score: score,
      level: scores[trait.key]?.level,
      label: trait.label
    };
  });

  const dataPolygonPoints = dataPoints
    .map(point => `${point.x},${point.y}`)
    .join(' ');

  // Create labels
  const labels = traits.map(trait => {
    const labelRadius = maxRadius + 40;
    const point = polarToCartesian(trait.angle, labelRadius);
    const score = scores[trait.key]?.raw || 0;
    const level = scores[trait.key]?.level || '';

    return (
      <g key={trait.key}>
        <text
          x={point.x}
          y={point.y}
          textAnchor="middle"
          className="text-xs font-semibold fill-white"
        >
          {trait.label}
        </text>
      </g>
    );
  });

  return (
    <div className="space-y-4 relative">
      <div id="big5-radar-chart" className="flex items-center justify-center relative">
        <svg width="500" height="500" viewBox="0 0 500 500" className="max-w-full">
          {/* Background grid */}
          {gridLevels}
          {axisLines}

          {/* Data polygon with gradient fill */}
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Animated data polygon */}
          <motion.polygon
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            points={dataPolygonPoints}
            fill="url(#radarGradient)"
            stroke="#10b981"
            strokeWidth="2"
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          />

          {/* Data points */}
          {dataPoints.map((point, index) => (
            <motion.circle
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
              cx={point.x}
              cy={point.y}
              r="6"
              fill={getPointColor(point.score)}
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer hover:fill-emerald-600 transition-colors"
              onMouseEnter={() => setHoveredTrait(point)}
              onMouseLeave={() => setHoveredTrait(null)}
            />
          ))}

          {/* Labels */}
          {labels}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredTrait && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute z-50 bg-white p-4 rounded-xl shadow-xl border border-gray-100 w-64 pointer-events-none"
              style={{
                left: hoveredTrait.x > 250 ? 'auto' : `${hoveredTrait.x}px`,
                right: hoveredTrait.x > 250 ? `${500 - hoveredTrait.x}px` : 'auto',
                top: hoveredTrait.y > 250 ? 'auto' : `${hoveredTrait.y}px`,
                bottom: hoveredTrait.y > 250 ? `${500 - hoveredTrait.y}px` : 'auto',
                // Add some offset to not cover the point
                transform: `translate(${hoveredTrait.x > 250 ? '-10px' : '10px'}, ${hoveredTrait.y > 250 ? '-10px' : '10px'})`
              }}
            >
              <div className="mb-2">
                <h4 className="font-bold text-gray-800">{big5Explanations[hoveredTrait.trait].name}</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {big5Explanations[hoveredTrait.trait][hoveredTrait.level]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Big5RadarChart;
