// SVG Icon components — used across the Beranda Siswa dashboard
// All sizes follow the Figma spec; use width/height props to override.

import React from "react";

type IconProps = {
  size?: number;
  color?: string;
  className?: string;
};

/* ── Brand / navigation ── */
export const IconCompass = ({ size = 18, color = "#FFFFFF", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="9" cy="9" r="7.5" stroke={color} strokeWidth="1.5" />
    <path d="M12.5 5.5L10.2 10.2L5.5 12.5L7.8 7.8L12.5 5.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="9" cy="9" r="1" fill={color} />
  </svg>
);

export const IconBookOpen = ({ size = 17, color = "#006190", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M8.5 14.5C8.5 14.5 2.5 11.5 2.5 6V2.5L8.5 4.5L14.5 2.5V6C14.5 11.5 8.5 14.5 8.5 14.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8.5 4.5V14.5" stroke={color} strokeWidth="1.5" />
  </svg>
);

export const IconTarget = ({ size = 17, color = "#006190", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="8.5" cy="8.5" r="6.5" stroke={color} strokeWidth="1.5" />
    <circle cx="8.5" cy="8.5" r="3.5" stroke={color} strokeWidth="1.5" />
    <circle cx="8.5" cy="8.5" r="1" fill={color} />
    <path d="M8.5 2V4M8.5 13V15M2 8.5H4M13 8.5H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ── Check / verified ── */
export const IconCheck = ({ size = 12, color = "#006190", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M2 6L5 9L10 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCheckCircle = ({ size = 12, color = "#006190", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="6" cy="6" r="5" stroke={color} strokeWidth="1.2" />
    <path d="M3.5 6L5 7.5L8.5 4" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCheckMuted = ({ size = 10, color = "#6F7881", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="5" cy="5" r="4" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

/* ── Trend / arrow ── */
export const IconTrendUp = ({ size = 13, color = "#006190", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M1.5 9.5L5 6L7.5 8.5L11.5 3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.5 3.5H11.5V6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconTrendDown = ({ size = 3, color = "#7C5400", className }: IconProps) => (
  <svg width={size} height={13} viewBox="0 0 3 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="0.5" y="0.5" width="2" height="12" rx="1" fill={color} />
  </svg>
);

export const IconArrowRight = ({ size = 9, color = "#006190", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M1.5 4.5H7.5M7.5 4.5L5 2M7.5 4.5L5 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconChevronRight = ({ size = 5, color = "#006190", className }: IconProps) => (
  <svg width={size} height={8} viewBox="0 0 5 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M1 1L4 4L1 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Building / location ── */
export const IconBuilding = ({ size = 15, color = "#3F4850", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="1.5" y="3.5" width="12" height="10" rx="1" stroke={color} strokeWidth="1.3" />
    <path d="M5 13.5V9.5H10V13.5" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M1.5 6.5H13.5" stroke={color} strokeWidth="1.3" />
    <rect x="4" y="4.5" width="2" height="2" rx="0.3" fill={color} />
    <rect x="9" y="4.5" width="2" height="2" rx="0.3" fill={color} />
  </svg>
);

export const IconSchool = ({ size = 17, color = "#006190", className }: IconProps) => (
  <svg width={size} height={14} viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M8.5 1L16 5L8.5 9L1 5L8.5 1Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M4 7V11C4 11 5.5 13 8.5 13C11.5 13 13 11 13 11V7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M16 5V9" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* ── Notification / bell ── */
export const IconBell = ({ size = 14, color = "#3F4850", className }: IconProps) => (
  <svg width={size} height={17} viewBox="0 0 14 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M7 1C7 1 3.5 2.5 3.5 7V12L2 13.5H12L10.5 12V7C10.5 2.5 7 1 7 1Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M5.5 13.5C5.5 14.3 6.2 15 7 15C7.8 15 8.5 14.3 8.5 13.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* ── Search / magnifier ── */
export const IconSearch = ({ size = 14, color = "#3F4850", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="6" cy="6" r="4.5" stroke={color} strokeWidth="1.4" />
    <path d="M9.5 9.5L12.5 12.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* ── User / person ── */
export const IconUser = ({ size = 12, color = "#FFFFFF", className }: IconProps) => (
  <svg width={size} height={12} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="6" cy="4" r="2.5" stroke={color} strokeWidth="1.3" />
    <path d="M1.5 11C1.5 8.5 3.5 7 6 7C8.5 7 10.5 8.5 10.5 11" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/* ── Upload ── */
export const IconUpload = ({ size = 14, color = "#FFFFFF", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M7 1.5V9.5M7 1.5L4 4.5M7 1.5L10 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.5 10.5V12.5H12.5V10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Calendar ── */
export const IconCalendar = ({ size = 12, color = "#FFFFFF", className }: IconProps) => (
  <svg width={size} height={14} viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="1" y="2.5" width="10" height="10" rx="1.5" stroke={color} strokeWidth="1.3" />
    <path d="M1 6H11" stroke={color} strokeWidth="1.3" />
    <path d="M4 1V4M8 1V4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="4" cy="9" r="0.8" fill={color} />
    <circle cx="6" cy="9" r="0.8" fill={color} />
    <circle cx="8" cy="9" r="0.8" fill={color} />
  </svg>
);

/* ── Download ── */
export const IconDownload = ({ size = 11, color = "#3F4850", className }: IconProps) => (
  <svg width={size} height={11} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M5.5 1V7M5.5 7L3 4.5M5.5 7L8 4.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1 9H10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* ── Star / award ── */
export const IconStar = ({ size = 13, color = "#006190", className }: IconProps) => (
  <svg width={size} height={12} viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M6.5 1L8.1 4.3L11.8 4.9L9.2 7.4L9.7 11.1L6.5 9.5L3.3 11.1L3.8 7.4L1.2 4.9L4.9 4.3L6.5 1Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

/* ── Map pin / location ── */
export const IconMapPin = ({ size = 13, color = "#3F4850", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M6.5 1C4.3 1 2.5 2.8 2.5 5C2.5 7.5 6.5 12 6.5 12C6.5 12 10.5 7.5 10.5 5C10.5 2.8 8.7 1 6.5 1Z" stroke={color} strokeWidth="1.3" />
    <circle cx="6.5" cy="5" r="1.5" fill={color} />
  </svg>
);

/* ── Message / chat ── */
export const IconMessage = ({ size = 13, color = "#006190", className }: IconProps) => (
  <svg width={size} height={12} viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M1.5 1H11.5V8.5H7.5L4.5 11V8.5H1.5V1Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

/* ── Chart bars ── */
export const IconBarChart = ({ size = 17, color = "#006190", className }: IconProps) => (
  <svg width={size} height={10} viewBox="0 0 17 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="0.5" y="4.5" width="3" height="5" rx="0.5" fill={color} />
    <rect x="5.5" y="2" width="3" height="7.5" rx="0.5" fill={color} />
    <rect x="10.5" y="0.5" width="3" height="9" rx="0.5" fill={color} />
    <rect x="15.5" y="3" width="1" height="6.5" rx="0.5" fill={color} opacity="0.5" />
  </svg>
);

/* ── Layers ── */
export const IconLayers = ({ size = 17, color = "#006190", className }: IconProps) => (
  <svg width={size} height={17} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M1.5 6L8.5 2L15.5 6L8.5 10L1.5 6Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M1.5 10L8.5 14L15.5 10" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Grid / recommended ── */
export const IconGrid = ({ size = 17, color = "#006190", className }: IconProps) => (
  <svg width={size} height={17} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4" />
    <rect x="9.5" y="1.5" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4" />
    <rect x="1.5" y="9.5" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4" />
    <rect x="9.5" y="9.5" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4" />
  </svg>
);

/* ── Clock / countdown ── */
export const IconClock = ({ size = 12, color = "#FFFFFF", className }: IconProps) => (
  <svg width={size} height={14} viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="6" cy="8" r="5" stroke={color} strokeWidth="1.3" />
    <path d="M6 5.5V8L7.5 9.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 1.5H8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M6 1.5V3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/* ── Shield / verified ── */
export const IconShield = ({ size = 12, color = "#FFFFFF", className }: IconProps) => (
  <svg width={size} height={15} viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M6 1L11 3.5V7.5C11 10.5 6 14 6 14C6 14 1 10.5 1 7.5V3.5L6 1Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M3.5 7.5L5.5 9.5L8.5 5.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Diploma/scroll ── */
export const IconDiploma = ({ size = 16, color = "#006190", className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="1.5" y="1.5" width="13" height="10" rx="1.5" stroke={color} strokeWidth="1.3" />
    <path d="M4 5.5H12M4 8H9" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M9.5 11.5V14.5L11 13.5L12.5 14.5V11.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="11" cy="10" r="2" stroke={color} strokeWidth="1.2" />
  </svg>
);
