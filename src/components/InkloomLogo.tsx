import React from 'react';

interface InkloomLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

export const InkloomLogo: React.FC<InkloomLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
  subtitle = 'Brand Governance',
  onClick,
}) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Bespoke Geometric Inkloom Emblem */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 40 40"
          width={iconSize}
          height={iconSize}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xs"
        >
          <defs>
            {/* Primary Loom Indigo Gradient */}
            <linearGradient id="inkloom-primary" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4338CA" />
              <stop offset="45%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>

            {/* Accent Ink Weft Gradient */}
            <linearGradient id="inkloom-accent" x1="36" y1="6" x2="6" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>

            {/* Core Quill Gradient */}
            <linearGradient id="inkloom-core" x1="20" y1="12" x2="20" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EEF2FF" />
              <stop offset="100%" stopColor="#C7D2FE" />
            </linearGradient>

            {/* Subtle Inner Glow Filter */}
            <filter id="inkloom-glow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Slate Architectural Housing */}
          <rect
            x="2"
            y="2"
            width="36"
            height="36"
            rx="10"
            className="fill-slate-950 transition-colors duration-200 group-hover:fill-slate-900"
          />
          <rect
            x="2.5"
            y="2.5"
            width="35"
            height="35"
            rx="9.5"
            stroke="#334155"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          {/* Interlocking Loom Ribbon 1: Vertical Warp Loop */}
          <path
            d="M14 11C14 8.79086 15.7909 7 18 7H22C24.2091 7 26 8.79086 26 11V16.5C26 18.5 24.5 20 22.5 20H17.5C15.5 20 14 21.5 14 23.5V29C14 31.2091 15.7909 33 18 33H22C24.2091 33 26 31.2091 26 29"
            stroke="url(#inkloom-primary)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interlocking Loom Ribbon 2: Horizontal Weft Thread */}
          <path
            d="M10 20C7.79086 20 6 18.2091 6 16V14C6 11.7909 7.79086 10 10 10H16"
            stroke="url(#inkloom-accent)"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M24 30H30C32.2091 30 34 28.2091 34 26V24C34 21.7909 32.2091 20 30 20H23"
            stroke="url(#inkloom-accent)"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Central Editorial Ink Nib & Loom Intersection Knot */}
          <path
            d="M20 14.5L24 20L20 25.5L16 20L20 14.5Z"
            fill="url(#inkloom-core)"
            className="filter drop-shadow-xs"
          />

          {/* Precise Quill Aperture Dot */}
          <circle cx="20" cy="20" r="1.4" fill="#312E81" />
        </svg>
      </div>

      {/* Wordmark and Subtitle */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5 leading-none">
            <span
              className={`font-bold tracking-tight text-slate-900 font-sans ${
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-[16px]'
              }`}
            >
              Inkloom
            </span>
            <span
              className={`font-semibold text-indigo-600 ${
                size === 'sm' ? 'text-xs' : 'text-sm'
              }`}
            >
              .ai
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
