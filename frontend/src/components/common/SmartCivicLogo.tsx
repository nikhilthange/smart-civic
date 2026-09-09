import React from "react";

interface SmartCivicLogoProps {
  className?: string;
  size?: number;
}

/**
 * Smart Civic AI — Bespoke Municipal CityOS Insignia
 * Handcrafted geometric architectural shield monogram (Interlocking S & C)
 * representing urban infrastructure, digital twin grids, and civic governance.
 */
export const SmartCivicLogo: React.FC<SmartCivicLogoProps> = ({
  className = "w-7 h-7",
  size = 28,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      aria-label="Smart Civic Insignia"
    >
      <defs>
        {/* Deep Slate Shield Gradient */}
        <linearGradient id="scShieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Emerald to Cyan Civic Energy Stream */}
        <linearGradient id="scEnergyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Secondary Gold/Amber Beacon Accent */}
        <linearGradient id="scBeaconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Subtle Inner Glow */}
        <filter id="scGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Hexagonal Shield Body */}
      <path
        d="M 60 8 L 108 24 L 108 72 L 60 112 L 12 72 L 12 24 Z"
        fill="url(#scShieldBg)"
        stroke="#334155"
        strokeWidth="2"
      />

      {/* Shield Bevel Inset Border */}
      <path
        d="M 60 15 L 101 29 L 101 68 L 60 103 L 19 68 L 19 29 Z"
        fill="none"
        stroke="url(#scEnergyGrad)"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />

      {/* Interlocking Monogram - 'S' Wave (Urban Grid Roadway) */}
      <path
        d="M 76 34 C 68 30, 48 30, 40 38 C 32 46, 36 56, 60 58 C 84 60, 88 70, 80 80 C 72 90, 48 90, 38 84"
        fill="none"
        stroke="url(#scEnergyGrad)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#scGlow)"
      />

      {/* Interlocking Monogram - 'C' Architectural Pillar (City Governance) */}
      <path
        d="M 82 46 C 76 38, 64 34, 52 34 C 36 34, 28 46, 28 60 C 28 74, 36 86, 52 86 C 64 86, 76 82, 82 74"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeOpacity="0.95"
      />

      {/* Center Digital Twin Apex Node */}
      <circle cx="60" cy="58" r="4.5" fill="#38bdf8" />
      <circle cx="60" cy="58" r="8" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />

      {/* Top North Star / GPS Geo Beacon */}
      <circle cx="60" cy="22" r="3" fill="#10b981" />
      <line x1="60" y1="17" x2="60" y2="27" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="22" x2="65" y2="22" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export default SmartCivicLogo;
