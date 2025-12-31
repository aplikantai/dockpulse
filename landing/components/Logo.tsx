
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textSize?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = false, textSize = "text-2xl" }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-full h-full aspect-square shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Hexagon Shape with 3D feel */}
          <path 
            d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" 
            fill="url(#cubeGrad)"
            className="drop-shadow-lg"
          />
          
          {/* Shading for 3D effect */}
          <path d="M50 50 L85 30 L50 10 Z" fill="rgba(255,255,255,0.1)" />
          <path d="M50 50 L85 70 L85 30 Z" fill="rgba(0,0,0,0.1)" />
          <path d="M50 50 L50 90 L85 70 Z" fill="rgba(0,0,0,0.15)" />
          <path d="M50 50 L15 70 L50 90 Z" fill="rgba(0,0,0,0.05)" />

          {/* Pulse line through the center */}
          <g filter="url(#glow)">
            <path 
              d="M10 45 H35 L42 25 L50 75 L58 25 L65 45 H90" 
              stroke="#22d3ee" 
              strokeWidth="4" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {/* End points dots */}
            <circle cx="10" cy="45" r="3.5" fill="#22d3ee" />
            <circle cx="90" cy="45" r="3.5" fill="#22d3ee" />
          </g>
        </svg>
      </div>
      {showText && (
        <span className={`font-bold tracking-tight text-[#1e293b] ${textSize}`}>
          dock<span className="text-[#06b6d4]">pulse</span><span className="text-[#06b6d4]">.com</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
