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
      className={`shrink-0 rounded-xl shadow-sm ${className}`}
      aria-label="Smart Civic Logo"
    >
      <defs>
        <linearGradient id="scGradFinal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Rounded Emerald Emblem */}
      <rect x="6" y="6" width="88" height="88" rx="22" fill="url(#scGradFinal)" />
      <rect x="6" y="6" width="88" height="88" rx="22" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.25" />

      {/* Civic Location Pin (Reporting) */}
      <path
        d="M 50 18 C 36.5 18 26 28.5 26 42 C 26 56.5 44 72 49 76.8 C 49.5 77.3 50.5 77.3 51 76.8 C 56 72 74 56.5 74 42 C 74 28.5 63.5 18 50 18 Z"
        fill="#ffffff"
      />

      {/* Issue Resolution Checkmark (Action & SLA) */}
      <path
        d="M 39 42.5 L 46.5 50 L 61 35.5"
        fill="none"
        stroke="#047857"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Smart AI Sparkle (Intelligence & Speed) */}
      <path
        d="M 73 13 Q 73 20 80 20 Q 73 20 73 27 Q 73 20 66 20 Q 73 20 73 13 Z"
        fill="#fde047"
      />
    </svg>
  );
};

export default SmartCivicLogo;
