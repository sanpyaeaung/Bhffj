import React from 'react';

interface HexagonProps {
  x: number;
  y: number;
  value: number | null;
  isGhost?: boolean;
  className?: string;
}

export const Hexagon: React.FC<HexagonProps> = ({ x, y, value, isGhost, className = '' }) => {
  // Pointy topped hexagon points
  const points = "0,-32 27.7,-16 27.7,16 0,32 -27.7,16 -27.7,-16";
  
  const colors: Record<number, string> = {
    2: "fill-green-500",
    4: "fill-teal-500",
    8: "fill-yellow-500",
    16: "fill-red-500",
    32: "fill-purple-500",
    64: "fill-fuchsia-600",
    128: "fill-blue-500",
    256: "fill-indigo-500",
    512: "fill-pink-500",
    1024: "fill-orange-500",
    2048: "fill-rose-600",
  };

  const colorClass = value ? (colors[value] || "fill-gray-700") : "fill-[#222]";
  const opacityClass = isGhost ? "opacity-50" : "opacity-100";

  return (
    <g transform={`translate(${x}, ${y})`} className={className}>
      <polygon 
        points={points} 
        className={`${colorClass} ${opacityClass} stroke-[#0a0a0a] stroke-[4px] transition-colors duration-300`} 
      />
      {value && (
        <text
          x="0"
          y="2"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white font-bold text-2xl select-none pointer-events-none"
          style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.3)' }}
        >
          {value}
        </text>
      )}
    </g>
  );
};
