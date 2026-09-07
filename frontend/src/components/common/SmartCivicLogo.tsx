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
        <linearGradient id="scCityGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>

      {/* Vibrant Rounded Emblem Base */}
      <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#scCityGradComp)" />
      <rect x="4" y="4" width="92" height="92" rx="24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.3" />

      {/* Smart City & Civic Architecture */}
      <g fill="#ffffff">
        {/* Left Building with Windows */}
        <rect x="22" y="42" width="14" height="32" rx="2" fill="#ffffff" fillOpacity="0.9" />
        <rect x="25.5" y="47" width="3" height="3" rx="0.5" fill="#065f46" />
        <rect x="30.5" y="47" width="3" height="3" rx="0.5" fill="#065f46" />
        <rect x="25.5" y="54" width="3" height="3" rx="0.5" fill="#065f46" />
        <rect x="30.5" y="54" width="3" height="3" rx="0.5" fill="#065f46" />

        {/* Center Civic Tower with Triangular Roof & Archway */}
        <path d="M 42 74 L 42 34 L 50 24 L 58 34 L 58 74 Z" fill="#ffffff" />
        <path d="M 46.5 74 L 46.5 56 Q 50 51 53.5 56 L 53.5 74 Z" fill="#065f46" />

        {/* Right Building with Windows */}
        <rect x="64" y="46" width="14" height="28" rx="2" fill="#ffffff" fillOpacity="0.9" />
        <rect x="67.5" y="51" width="3" height="3" rx="0.5" fill="#065f46" />
        <rect x="72.5" y="51" width="3" height="3" rx="0.5" fill="#065f46" />
        <rect x="67.5" y="58" width="3" height="3" rx="0.5" fill="#065f46" />
        <rect x="72.5" y="58" width="3" height="3" rx="0.5" fill="#065f46" />

        {/* Municipal Foundation Ground Line */}
        <rect x="18" y="72" width="64" height="4" rx="2" fill="#ffffff" />
      </g>

      {/* Smart AI / GPS Connection Waves above Civic Hall */}
      <path d="M 38 18 Q 50 10 62 18" fill="none" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 42 22 Q 50 16 58 22" fill="none" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="24" r="2.5" fill="#facc15" />
    </svg>
  );
};

export default SmartCivicLogo;
