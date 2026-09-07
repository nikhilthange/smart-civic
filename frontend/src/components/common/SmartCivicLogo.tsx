import React from "react";

interface SmartCivicLogoProps {
  className?: string;
  size?: number;
}

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
      className={`shrink-0 rounded-lg shadow-sm ${className}`}
      aria-label="Smart Civic Logo"
    >
      <defs>
        <linearGradient id="scEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="scMintAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Background Squircle Container */}
      <rect x="2" y="2" width="96" height="96" rx="26" fill="#022c22" />
      <rect x="2" y="2" width="96" height="96" rx="26" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.25" />

      {/* Precision Geometric 'S + C' Monogram */}
      <g transform="translate(18, 18)">
        {/* Dynamic S Ribbon */}
        <path
          d="M 12 28 
             C 12 14, 22 8, 38 8 
             C 52 8, 60 16, 60 26 
             C 60 38, 46 42, 34 46
             C 22 50, 16 56, 16 64
             C 16 76, 26 84, 42 84
             C 56 84, 62 76, 62 66"
          fill="none"
          stroke="url(#scEmeraldGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interlocking Inner C Pillar */}
        <path
          d="M 38 28
             C 46 28, 48 34, 48 40
             C 48 48, 40 52, 32 54"
          fill="none"
          stroke="url(#scMintAccent)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Keystone Point */}
        <circle cx="48" cy="64" r="4.5" fill="#ffffff" />
      </g>
    </svg>
  );
};

export default SmartCivicLogo;
