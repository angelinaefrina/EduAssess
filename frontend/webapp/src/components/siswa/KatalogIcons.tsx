import React from "react";

export type SvgIconProps = {
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

/* ── Brand Compass ── */
export const IconCompass = ({ size = 20, color = "#FFFFFF", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color} fillOpacity="0.2" />
  </svg>
);

/* ── Search Magnifying Glass ── */
export const IconSearch = ({ size = 18, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/* ── Notification Bell ── */
export const IconBell = ({ size = 18, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

/* ── User Silhouette ── */
export const IconUser = ({ size = 16, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ── Shield / Sync ── */
export const IconShieldSync = ({ size = 16, color = "#006190", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

/* ── Download PDF ── */
export const IconDownload = ({ size = 16, color = "#FFFFFF", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/* ── Building / PTN ── */
export const IconBuilding = ({ size = 20, color = "#006190", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <line x1="8" y1="6" x2="10" y2="6" />
    <line x1="14" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="10" y2="10" />
    <line x1="14" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="10" y2="14" />
    <line x1="14" y1="14" x2="16" y2="14" />
  </svg>
);

/* ── Book / Program Studi ── */
export const IconBook = ({ size = 20, color = "#525E7F", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

/* ── Graduation Cap / Kuota ── */
export const IconGraduationCap = ({ size = 20, color = "#7C5400", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

/* ── Target / Star / Cocok Minat ── */
export const IconTarget = ({ size = 20, color = "#FFFFFF", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);

/* ── Filter Sliders ── */
export const IconSliders = ({ size = 16, color = "#FFFFFF", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

/* ── Chevron Down ── */
export const IconChevronDown = ({ size = 12, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── Chevron Left ── */
export const IconChevronLeft = ({ size = 14, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/* ── Chevron Right ── */
export const IconChevronRight = ({ size = 14, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ── Close / Clear ── */
export const IconClose = ({ size = 12, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ── Checkmark ── */
export const IconCheck = ({ size = 12, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── Location Pin ── */
export const IconLocationPin = ({ size = 12, color = "currentColor", className, style }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/* ── Sparkles / Match ── */
export const IconSparkles = ({ size = 14, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
  </svg>
);

/* ── Lock ── */
export const IconLock = ({ size = 14, color = "#FFFFFF", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ── Bookmark / Compare Scales ── */
export const IconScale = ({ size = 16, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
    <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
    <circle cx="8" cy="12" r="2" />
  </svg>
);

/* ── External Link ── */
export const IconExternalLink = ({ size = 13, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* ── Counselor / Message ── */
export const IconCounselor = ({ size = 15, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

/* ── Compare Double Arrows ── */
export const IconCompare = ({ size = 16, color = "#FFFFFF", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M16 3l4 4-4 4" />
    <path d="M20 7H4" />
    <path d="M8 21l-4-4 4-4" />
    <path d="M4 17h16" />
  </svg>
);

/* ── Arrow Right ── */
export const IconArrowRight = ({ size = 14, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ── Hamburger Menu ── */
export const IconMenu = ({ size = 20, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/* ── Bookmark (filled saat tersimpan) ── */
export const IconBookmark = ({ size = 16, color = "currentColor", className, filled = false }: SvgIconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

/* ── Trending Up ── */
export const IconTrendingUp = ({ size = 16, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

/* ── Wallet / Gaji ── */
export const IconWallet = ({ size = 16, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M16 12h2" />
    <path d="M2 9h20" />
  </svg>
);

/* ── Briefcase / Lapangan Kerja ── */
export const IconBriefcase = ({ size = 16, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

/* ── Flame / Tren ── */
export const IconFlame = ({ size = 14, color = "currentColor", className }: SvgIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

/* ── Campus Illustrated Visual Banners (High Res Vector Graphics) ── */

export const CampusBannerUI = () => (
  <svg width="100%" height="100%" viewBox="0 0 390 176" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ui-sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A89BF" />
        <stop offset="60%" stopColor="#89BCE0" />
        <stop offset="100%" stopColor="#CBE6FF" />
      </linearGradient>
      <linearGradient id="ui-lake" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0B4A6F" />
        <stop offset="100%" stopColor="#003554" />
      </linearGradient>
    </defs>
    <rect width="390" height="176" fill="url(#ui-sky)" />
    {/* Distant Hills & Trees */}
    <path d="M0 130 C60 115 120 125 180 120 C240 115 320 125 390 120 L390 176 L0 176 Z" fill="#2E6B47" opacity="0.6" />
    <path d="M0 138 C80 130 160 135 240 132 C300 128 360 135 390 134 L390 176 L0 176 Z" fill="#1C4B30" />
    {/* UI Depok Lake Danau Kenanga */}
    <path d="M0 148 C100 142 220 144 390 146 L390 176 L0 176 Z" fill="url(#ui-lake)" />
    {/* UI Central Rectorate Building Silhouette */}
    <g transform="translate(140, 48)">
      <rect x="35" y="18" width="40" height="72" rx="3" fill="#D3DCE6" />
      <polygon points="55,0 30,22 80,22" fill="#BA1A1A" />
      <circle cx="55" cy="12" r="4" fill="#F4D03F" />
      <rect x="42" y="26" width="6" height="54" fill="#006190" />
      <rect x="52" y="26" width="6" height="54" fill="#006190" />
      <rect x="62" y="26" width="6" height="54" fill="#006190" />
      {/* Side wings */}
      <rect x="0" y="44" width="38" height="46" rx="2" fill="#E2E8F0" />
      <rect x="72" y="44" width="38" height="46" rx="2" fill="#E2E8F0" />
      <line x1="5" y1="55" x2="33" y2="55" stroke="#94A3B8" strokeWidth="2" />
      <line x1="5" y1="65" x2="33" y2="65" stroke="#94A3B8" strokeWidth="2" />
      <line x1="77" y1="55" x2="105" y2="55" stroke="#94A3B8" strokeWidth="2" />
      <line x1="77" y1="65" x2="105" y2="65" stroke="#94A3B8" strokeWidth="2" />
    </g>
    {/* Trees on sides */}
    <circle cx="45" cy="130" r="28" fill="#2E7D32" opacity="0.9" />
    <circle cx="75" cy="134" r="22" fill="#1B5E20" />
    <circle cx="340" cy="132" r="26" fill="#2E7D32" opacity="0.9" />
    <circle cx="370" cy="136" r="22" fill="#1B5E20" />
    {/* Reflection highlights on water */}
    <line x1="170" y1="156" x2="220" y2="156" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
    <line x1="185" y1="162" x2="210" y2="162" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
  </svg>
);

export const CampusBannerITB = () => (
  <svg width="100%" height="100%" viewBox="0 0 390 176" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="itb-sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B719F" />
        <stop offset="50%" stopColor="#7FA9CE" />
        <stop offset="100%" stopColor="#D9E2FF" />
      </linearGradient>
    </defs>
    <rect width="390" height="176" fill="url(#itb-sky)" />
    {/* Ganesha Forest / Pine trees backdrop */}
    <polygon points="20,135 35,70 50,135" fill="#1B4D3E" />
    <polygon points="40,140 55,60 70,140" fill="#0D3327" />
    <polygon points="320,140 335,65 350,140" fill="#1B4D3E" />
    <polygon points="345,142 360,75 375,142" fill="#0D3327" />
    {/* Ground / Courtyard */}
    <rect x="0" y="132" width="390" height="44" fill="#71717A" />
    <rect x="0" y="142" width="390" height="34" fill="#52525B" />
    {/* Aula Barat ITB Gabled Traditional Roof Architecture */}
    <g transform="translate(105, 38)">
      {/* Wooden tiered roof */}
      <polygon points="90,8 10,48 170,48" fill="#451A03" />
      <polygon points="90,0 20,40 160,40" fill="#78350F" />
      <polygon points="90,32 30,62 150,62" fill="#92400E" />
      {/* Supporting Timber Columns */}
      <rect x="34" y="62" width="112" height="66" fill="#FDE68A" opacity="0.9" />
      <rect x="42" y="62" width="8" height="66" fill="#78350F" />
      <rect x="68" y="62" width="8" height="66" fill="#78350F" />
      <rect x="104" y="62" width="8" height="66" fill="#78350F" />
      <rect x="130" y="62" width="8" height="66" fill="#78350F" />
      {/* Historic Windows */}
      <rect x="53" y="74" width="12" height="24" rx="2" fill="#1E293B" />
      <rect x="79" y="74" width="22" height="34" rx="2" fill="#1E293B" />
      <rect x="115" y="74" width="12" height="24" rx="2" fill="#1E293B" />
    </g>
  </svg>
);

export const CampusBannerPENS = () => (
  <svg width="100%" height="100%" viewBox="0 0 390 176" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pens-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="60%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#0B132B" />
      </linearGradient>
      <linearGradient id="pens-glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
    </defs>
    <rect width="390" height="176" fill="url(#pens-bg)" />
    {/* Tech Circuit Traces */}
    <path d="M20 40 H70 L95 65 H160" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
    <path d="M230 30 H290 L320 60 H380" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
    <circle cx="160" cy="65" r="3" fill="#38BDF8" />
    <circle cx="230" cy="30" r="3" fill="#F59E0B" />
    {/* Robotics / High Tech Lab Building Silhouettes */}
    <rect x="60" y="55" width="270" height="121" rx="6" fill="#334155" />
    <rect x="80" y="70" width="230" height="85" rx="4" fill="#1E293B" />
    {/* Glass Lab Windows with Blue & Amber Glows */}
    <g opacity="0.85">
      <rect x="95" y="82" width="40" height="26" rx="2" fill="#0284C7" opacity="0.5" />
      <rect x="145" y="82" width="40" height="26" rx="2" fill="#0284C7" opacity="0.6" />
      <rect x="205" y="82" width="40" height="26" rx="2" fill="#F59E0B" opacity="0.5" />
      <rect x="255" y="82" width="40" height="26" rx="2" fill="#0284C7" opacity="0.7" />
      {/* Lower windows */}
      <rect x="95" y="118" width="40" height="30" rx="2" fill="#38BDF8" opacity="0.4" />
      <rect x="145" y="118" width="40" height="30" rx="2" fill="#38BDF8" opacity="0.4" />
      <rect x="205" y="118" width="40" height="30" rx="2" fill="#F59E0B" opacity="0.4" />
      <rect x="255" y="118" width="40" height="30" rx="2" fill="#38BDF8" opacity="0.5" />
    </g>
    {/* Entrance canopy */}
    <rect x="170" y="148" width="50" height="28" fill="#F59E0B" opacity="0.9" />
  </svg>
);

export const CampusBannerUGM = () => (
  <svg width="100%" height="100%" viewBox="0 0 390 176" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ugm-sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5A88B5" />
        <stop offset="50%" stopColor="#96BCE0" />
        <stop offset="100%" stopColor="#EFF6FF" />
      </linearGradient>
    </defs>
    <rect width="390" height="176" fill="url(#ugm-sky)" />
    {/* Mt. Merapi distant silhouette */}
    <polygon points="195,30 90,130 300,130" fill="#7193B6" opacity="0.4" />
    {/* Balairung Courtyard Greenery */}
    <rect x="0" y="130" width="390" height="46" fill="#15803D" />
    <path d="M0 145 C130 138 260 138 390 145 L390 176 L0 176 Z" fill="#166534" />
    {/* Iconic Balairung UGM Central Classical Building */}
    <g transform="translate(100, 52)">
      <rect x="15" y="24" width="160" height="58" rx="2" fill="#F8FAFC" />
      {/* Neoclassical Pediment (Triangle Top) */}
      <polygon points="95,0 45,24 145,24" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
      <circle cx="95" cy="14" r="5" fill="#006190" />
      {/* Grand Columns */}
      <rect x="52" y="24" width="6" height="58" fill="#CBD5E1" />
      <rect x="68" y="24" width="6" height="58" fill="#CBD5E1" />
      <rect x="84" y="24" width="6" height="58" fill="#CBD5E1" />
      <rect x="100" y="24" width="6" height="58" fill="#CBD5E1" />
      <rect x="116" y="24" width="6" height="58" fill="#CBD5E1" />
      <rect x="132" y="24" width="6" height="58" fill="#CBD5E1" />
      {/* Front Steps */}
      <rect x="35" y="78" width="120" height="4" fill="#94A3B8" />
      <rect x="25" y="82" width="140" height="4" fill="#64748B" />
    </g>
    {/* Coconut & palm trees */}
    <circle cx="50" cy="120" r="24" fill="#166534" />
    <circle cx="340" cy="120" r="24" fill="#166534" />
  </svg>
);

export const CampusBannerSSN = () => (
  <svg width="100%" height="100%" viewBox="0 0 390 176" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ssn-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="60%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
    </defs>
    <rect width="390" height="176" fill="url(#ssn-bg)" />
    {/* Cyber Matrix Cryptography Grid */}
    <g opacity="0.15" stroke="#38BDF8" strokeWidth="1">
      <line x1="0" y1="20" x2="390" y2="20" />
      <line x1="0" y1="50" x2="390" y2="50" />
      <line x1="0" y1="80" x2="390" y2="80" />
      <line x1="0" y1="110" x2="390" y2="110" />
      <line x1="0" y1="140" x2="390" y2="140" />
      <line x1="60" y1="0" x2="60" y2="176" />
      <line x1="120" y1="0" x2="120" y2="176" />
      <line x1="180" y1="0" x2="180" y2="176" />
      <line x1="240" y1="0" x2="240" y2="176" />
      <line x1="300" y1="0" x2="300" y2="176" />
      <line x1="360" y1="0" x2="360" y2="176" />
    </g>
    {/* Security Operations Center / Command Center Screens */}
    <g transform="translate(70, 42)">
      <rect x="40" y="10" width="170" height="95" rx="6" fill="#1E293B" stroke="#007BB5" strokeWidth="2" />
      <rect x="50" y="20" width="70" height="40" rx="3" fill="#0284C7" opacity="0.4" />
      <rect x="130" y="20" width="70" height="40" rx="3" fill="#059669" opacity="0.4" />
      {/* World Map dots */}
      <circle cx="85" cy="40" r="3" fill="#38BDF8" />
      <circle cx="165" cy="40" r="3" fill="#34D399" />
      {/* Real-time Telemetry charts */}
      <polyline points="55,85 75,70 95,78 115,65" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <polyline points="135,80 155,68 175,74 195,62" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      {/* Shield emblem */}
      <circle cx="125" cy="12" r="14" fill="#006190" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M125 7 L129 11 L125 17 L121 11 Z" fill="#F59E0B" />
    </g>
  </svg>
);

export const CampusBannerUNAIR = () => (
  <svg width="100%" height="100%" viewBox="0 0 390 176" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="unair-sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3874A6" />
        <stop offset="60%" stopColor="#7EAFDA" />
        <stop offset="100%" stopColor="#DCE9FF" />
      </linearGradient>
    </defs>
    <rect width="390" height="176" fill="url(#unair-sky)" />
    {/* Modern Campus Plaza & Lake Danau Kampus C */}
    <rect x="0" y="132" width="390" height="44" fill="#0284C7" />
    <path d="M0 144 C120 138 240 140 390 144 L390 176 L0 176 Z" fill="#0369A1" />
    {/* UNAIR Management / Science Tower (Kampus C Mulyorejo) */}
    <g transform="translate(125, 34)">
      <rect x="40" y="20" width="60" height="84" rx="4" fill="#FFFFFF" />
      {/* Yellow / Gold UNAIR crest stripe */}
      <rect x="40" y="20" width="60" height="6" fill="#F59E0B" />
      {/* Blue reflective glass facade */}
      <g opacity="0.75">
        <rect x="48" y="32" width="18" height="66" fill="#0284C7" rx="1" />
        <rect x="74" y="32" width="18" height="66" fill="#0284C7" rx="1" />
      </g>
      {/* Side wings */}
      <rect x="10" y="48" width="30" height="56" rx="2" fill="#E2E8F0" />
      <rect x="100" y="48" width="30" height="56" rx="2" fill="#E2E8F0" />
      <line x1="16" y1="62" x2="34" y2="62" stroke="#006190" strokeWidth="2" />
      <line x1="16" y1="76" x2="34" y2="76" stroke="#006190" strokeWidth="2" />
      <line x1="106" y1="62" x2="124" y2="62" stroke="#006190" strokeWidth="2" />
      <line x1="106" y1="76" x2="124" y2="76" stroke="#006190" strokeWidth="2" />
    </g>
    {/* Palm trees along promenade */}
    <circle cx="60" cy="132" r="22" fill="#15803D" />
    <circle cx="330" cy="132" r="22" fill="#15803D" />
    <line x1="150" y1="155" x2="240" y2="155" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
  </svg>
);
