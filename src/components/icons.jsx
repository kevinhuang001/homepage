/* 轻量 SVG 图标集：统一 24 视窗线性描边风格（活动栏），16 视窗用于状态栏/小控件 */
import React from 'react';

const S = ({ size = 16, view = 24, className = '', children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${view} ${view}`}
    className={`icon ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={view === 24 ? 1.7 : 1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

/* ---------- 通用 UI 小图标 ---------- */
export const ChevronRight = ({ size }) => (
  <S size={size} view={16}>
    <path d="M6.5 3.5L11 8l-4.5 4.5" />
  </S>
);
export const ChevronDown = ({ size }) => (
  <S size={size} view={16}>
    <path d="M3.5 6.5L8 11l4.5-4.5" />
  </S>
);
export const Close = ({ size }) => (
  <S size={size} view={16}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </S>
);
export const More = ({ size }) => (
  <S size={size} view={16}>
    <circle cx="4.4" cy="8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="11.6" cy="8" r="1.1" fill="currentColor" stroke="none" />
  </S>
);
export const NewFile = ({ size }) => (
  <S size={size} view={16}>
    <path d="M8 2.5v8M4 6.5h8" />
  </S>
);
export const Refresh = ({ size }) => (
  <S size={size} view={16}>
    <path d="M13 4.2A5.3 5.3 0 1 0 13.9 9" />
    <path d="M13 1.8v2.4h-2.4" />
  </S>
);
export const CollapseAll = ({ size }) => (
  <S size={size} view={16}>
    <path d="M3 9l5-4.5L13 9" />
    <path d="M3 13l5-4.5L13 13" />
  </S>
);
export const ExpandAll = ({ size }) => (
  <S size={size} view={16}>
    <path d="M3 7l5 4.5L13 7" />
  </S>
);

/* ---------- 文件夹 ---------- */
export const FolderClosed = ({ size = 16, color = '#c09553' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M1.6 3.3a.9.9 0 0 1 .9-.9h3.2l1.5 1.6h6.3a.9.9 0 0 1 .9.9v.9H1.6V3.3z"
      fill={color}
    />
    <path
      d="M1.6 6H14.4a.9.9 0 0 1 .9.9v5.3a.9.9 0 0 1-.9.9H2.5a.9.9 0 0 1-.9-.9V6z"
      fill={color}
      opacity="0.72"
    />
  </svg>
);
export const FolderOpen = ({ size = 16, color = '#c09553' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M1.6 3.3a.9.9 0 0 1 .9-.9h3.2l1.5 1.6h6.3a.9.9 0 0 1 .9.9v.4H4.5L3.4 13H2.5a.9.9 0 0 1-.9-.9V3.3z"
      fill={color}
      opacity="0.85"
    />
    <path d="M4.6 7h10a.9.9 0 0 1 .9 1.1L14.4 13H3.4z" fill={color} opacity="0.72" />
  </svg>
);

/* ---------- 文件类型图标（仿 seti 彩色风格） ---------- */
const FILE_TYPE_STYLE = {
  md: { bg: '#519aba', fg: '#fff', label: 'MD' },
  pdf: { bg: '#ec5149', fg: '#fff', label: 'PDF' },
  txt: { bg: '#6d9d50', fg: '#fff', label: 'TXT' },
};

export function FileTypeIcon({ kind = 'md', size = 16 }) {
  if (kind === 'image') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <rect x="0.8" y="0.8" width="14.4" height="14.4" rx="2.4" fill="#7c8fd1" />
        <rect x="3" y="4.6" width="10" height="6.8" rx="1" fill="none" stroke="#ffffff" strokeWidth="1.1" />
        <circle cx="6.1" cy="7.1" r="1" fill="#ffffff" />
        <path
          d="M3.4 10.4l2.5-2.3 2 1.8 2.7-2.7 2.4 2.4"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const style = FILE_TYPE_STYLE[kind] || { bg: '#848484', fg: '#fff', label: '·' };
  const fs = style.label.length > 2 ? 5.6 : 7;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="0.8" y="0.8" width="14.4" height="14.4" rx="2.4" fill={style.bg} />
      <text
        x="8"
        y="10.4"
        textAnchor="middle"
        fontSize={fs}
        fontWeight="700"
        fill={style.fg}
        fontFamily="'Segoe UI', 'Microsoft YaHei', sans-serif"
      >
        {style.label}
      </text>
    </svg>
  );
}

/* ---------- 活动栏大图标（24 视窗） ---------- */
export const ActivityFiles = ({ size = 24 }) => (
  <S size={size}>
    <path d="M5 3.5h8.6L19 8.9v11.6H5z" />
    <path d="M13.5 3.5V9H19" />
    <path d="M8.4 13h6.6M8.4 16.4h4.6" />
  </S>
);
export const ActivitySearch = ({ size = 24 }) => (
  <S size={size}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="M15.5 15.5L20 20" />
    <path d="M8.2 10.8h5.2M10.8 8.2v5.2" opacity="0" />
  </S>
);
export const ActivityScm = ({ size = 24 }) => (
  <S size={size}>
    <circle cx="7" cy="6" r="2.6" />
    <circle cx="17" cy="18" r="2.6" />
    <path d="M7 8.6v6.2a3.2 3.2 0 0 0 3.2 3.2h3.6" />
    <path d="M7 8.6a3.4 3.4 0 0 1 3.4-3.4" />
  </S>
);
export const ActivityRun = ({ size = 24 }) => (
  <S size={size}>
    <path d="M8 5.2v13.6L19 12z" />
  </S>
);
export const ActivityExtensions = ({ size = 24 }) => (
  <S size={size}>
    <rect x="4.5" y="4.5" width="6" height="6" rx="1.4" />
    <rect x="13.5" y="4.5" width="6" height="6" rx="1.4" />
    <rect x="4.5" y="13.5" width="6" height="6" rx="1.4" />
    <rect x="13.5" y="13.5" width="6" height="6" rx="1.4" />
  </S>
);
export const ActivitySettings = ({ size = 24 }) => {
  const spokes = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    const r1 = 5.6;
    const r2 = 8.6;
    spokes.push(
      <path
        key={i}
        d={`M${12 + r1 * Math.cos(a)} ${12 + r1 * Math.sin(a)}L${12 + r2 * Math.cos(a)} ${
          12 + r2 * Math.sin(a)
        }`}
      />,
    );
  }
  return (
    <S size={size}>
      <circle cx="12" cy="12" r="3.6" />
      {spokes}
    </S>
  );
};
export const ActivityAccount = ({ size = 24 }) => (
  <S size={size}>
    <circle cx="12" cy="9" r="3.4" />
    <path d="M5.6 20c1-3.4 3.6-5 6.4-5s5.4 1.6 6.4 5" />
  </S>
);
export const AccountInitials = ({ text = '张', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <rect width="20" height="20" rx="5" fill="#5f6b7a" />
    <text
      x="10"
      y="13.6"
      textAnchor="middle"
      fontSize="10.5"
      fontWeight="600"
      fill="#fff"
      fontFamily="'Segoe UI','Microsoft YaHei',sans-serif"
    >
      {text}
    </text>
  </svg>
);

/* ---------- 状态栏小图标（16 视窗） ---------- */
export const Branch = ({ size = 14 }) => (
  <S size={size} view={16}>
    <circle cx="5" cy="3.6" r="1.6" />
    <circle cx="11" cy="12.4" r="1.6" />
    <path d="M5 5.2v4a2.4 2.4 0 0 0 2.4 2.4h2" />
    <path d="M6.6 5.2a2 2 0 0 1 2-1.8" />
  </S>
);
export const Sync = ({ size = 14 }) => (
  <S size={size} view={16}>
    <path d="M13.2 6.4A5.2 5.2 0 1 0 13 10.6" />
    <path d="M13.2 3.4v3h-3" />
  </S>
);
export const ErrorDot = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="3.4" fill="#f14c4c" />
    <path d="M8 5.8v3.4M8 11.1v.1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
export const WarnDot = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M8 1.8L15 13.4H1z"
      fill="#cca700"
    />
    <path d="M8 6.2v3M8 11.2v.1" stroke="#1e1e1e" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
export const Check = ({ size = 14 }) => (
  <S size={size} view={16}>
    <path d="M3.4 8.6l3 3 6.2-7" />
  </S>
);
export const Bell = ({ size = 14 }) => (
  <S size={size} view={16}>
    <path d="M8 2.4a4.3 4.3 0 0 0-4.3 4.3c0 2.8-1 3.4-1 4.2h10.6c0-.8-1-1.4-1-4.2A4.3 4.3 0 0 0 8 2.4z" />
    <path d="M6.5 13.2a1.5 1.5 0 0 0 3 0" />
  </S>
);
export const TerminalIcon = ({ size = 14 }) => (
  <S size={size} view={16}>
    <rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1.2" />
    <path d="M4.8 6l2.4 2.1L4.8 10.2M8.4 10.4h2.8" />
  </S>
);
export const Eye = ({ size = 14 }) => (
  <S size={size} view={16}>
    <path d="M2 8s2.4-4.4 6-4.4S14 8 14 8s-2.4 4.4-6 4.4S2 8 2 8z" />
    <circle cx="8" cy="8" r="1.9" />
  </S>
);

/* 顶部菜单栏右侧小图标 */
export const MenuBarIcon = ({ size = 16 }) => (
  <S size={size} view={16}>
    <circle cx="4.2" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="11.8" cy="8" r="1" fill="currentColor" stroke="none" />
  </S>
);
