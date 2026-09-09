import React from "react";

interface SmartCivicLogoProps {
  className?: string;
  size?: number;
}

/**
 * Smart Civic AI — Interlocking S-C Precision Ribbon
 * Continuous mathematical 3D ribbon weaving 'S' & 'C' with
 * luminous emerald, cyan, and indigo gradient sweeps, glass sheen highlights,
 * and ambient lighting depth.
 */
export const SmartCivicLogo: React.FC<SmartCivicLogoProps> = ({
  className = "w-7 h-7",
  size = 28,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      aria-label="Smart Civic Logo"
    >
      <defs>
        {/* Primary Emerald Gradient */}
        <linearGradient id="scGradEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Secondary Cyan-to-Cobalt Gradient */}
        <linearGradient id="scGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>

        {/* Interlocking Spine Gradient */}
        <linearGradient id="scGradBlend" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="35%" stopColor="#10b981" />
          <stop offset="70%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        {/* Specular Glass Sheen Gradient */}
        <linearGradient id="scGlassSheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Ambient Soft Glow Filter */}
        <filter id="scRibbonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#059669" floodOpacity="0.3" />
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284c7" floodOpacity="0.22" />
        </filter>
      </defs>

      <g filter="url(#scRibbonGlow)">
        {/* Layer 1: Civic 'C' Base Arch */}
        <path
          d="M 52 18 
             C 74 18, 88 32, 88 50
             C 88 70, 72 84, 52 84
             C 38 84, 26 76, 20 64
             C 18 60, 22 56, 27 57
             C 32 58, 35 63, 40 69
             C 44 73, 48 75, 52 75
             C 65 75, 76 65, 76 50
             C 76 36, 65 27, 52 27
             C 44 27, 37 31, 32 36
             L 24 28
             C 31 22, 41 18, 52 18 Z"
          fill="url(#scGradCyan)"
        />

        {/* Layer 2: Smart 'S' Upper Arch */}
        <path
          d="M 48 16
             C 30 16, 14 30, 14 46
             C 14 56, 20 64, 28 68
             L 34 59
             C 29 55, 24 51, 24 46
             C 24 35, 34 26, 48 26
             C 58 26, 68 32, 72 40
             L 81 33
             C 74 22, 62 16, 48 16 Z"
          fill="url(#scGradEmerald)"
        />

        {/* Layer 3: Interlocking Weaving S-Spine */}
        <path
          d="M 72 40
             C 66 48, 55 56, 42 62
             C 32 67, 24 74, 24 82
             C 24 87, 28 90, 34 90
             C 46 90, 60 82, 70 72
             L 76 80
             C 63 93, 46 98, 32 98
             C 18 98, 14 88, 14 78
             C 14 68, 24 60, 38 54
             C 52 48, 64 40, 72 32
             Z"
          fill="url(#scGradBlend)"
        />

        {/* Layer 4: Glass Specular Highlights */}
        <path
          d="M 48 18
             C 32 18, 18 31, 16 46
             C 21 37, 33 28, 48 28
             C 60 28, 70 33, 76 41
             L 80 34
             C 73 24, 61 18, 48 18 Z"
          fill="url(#scGlassSheen)"
        />

        {/* Layer 5: Glass Edge Highlight on Center Ribbon */}
        <path
          d="M 70 34
             C 63 42, 51 50, 38 56
             C 26 61, 17 68, 16 76
             C 17 71, 27 63, 40 57
             C 54 51, 65 43, 72 36
             Z"
          fill="#ffffff"
          opacity="0.4"
        />

        {/* Layer 6: Center Precision Civic Spark Diamond */}
        <polygon
          points="50,45 55,50 50,55 45,50"
          fill="#ffffff"
        />
        <circle cx="50" cy="50" r="1.6" fill="#06b6d4" />
      </g>
    </svg>
  );
};

export default SmartCivicLogo;
