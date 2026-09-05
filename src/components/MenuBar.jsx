import React, { useEffect, useRef, useState } from 'react';
import { MenuBarIcon } from './icons.jsx';
import { PROFILE } from '../data/vfs.js';

/**
 * 顶部菜单栏（仿 VS Code）。下拉项里带 action 的可用，其余为装饰。
 * actions: { openPalette, newDraft, openLocal, closeActive, closeAll,
 *            toggleSidebar, togglePanel, focusSearch, cycleTab, openReadme, showAbout }
 */
const MENUS = [
  {
    title: '文件',
    items: [
      { label: '新建文件…', key: 'Ctrl+N', action: 'newDraft' },
      { label: '打开文件…', key: 'Ctrl+O', action: 'openLocal' },
      { label: '打开文件夹…', disabled: true },
      { divider: true },
      { label: '保存', key: 'Ctrl+S', disabled: true },
      { label: '全部保存', disabled: true },
      { divider: true },
      { label: '关闭编辑器', key: 'Ctrl+W', action: 'closeActive' },
      { label: '关闭所有编辑器', action: 'closeAll' },
    ],
  },
  {
    title: '编辑',
    items: [
      { label: '撤销', key: 'Ctrl+Z', disabled: true },
      { label: '重做', key: 'Ctrl+Shift+Z', disabled: true },
      { divider: true },
      { label: '查找', key: 'Ctrl+F', action: 'focusSearch' },
      { label: '替换', key: 'Ctrl+H', disabled: true },
      { divider: true },
      { label: '全选', key: 'Ctrl+A', disabled: true },
    ],
  },
  {
    title: '选择',
    items: [
      { label: '全选', key: 'Ctrl+A', disabled: true },
      { label: '扩大选区', disabled: true },
      { label: '缩小选区', disabled: true },
    ],
  },
  {
    title: '查看',
    items: [
      { label: '命令面板…', key: 'Ctrl+Shift+P', action: 'openPalette' },
      { divider: true },
      { label: '显示终端', key: 'Ctrl+`', action: 'togglePanel' },
      { label: '显示侧边栏', key: 'Ctrl+B', action: 'toggleSidebar' },
      { divider: true },
      { label: '打开视图', disabled: true },
    ],
  },
  {
    title: '转到',
    items: [
      { label: '转到文件…', key: 'Ctrl+P', action: 'openPalette' },
      { divider: true },
      { label: '上一个编辑器', key: 'Alt+←', action: 'cyclePrev' },
      { label: '下一个编辑器', key: 'Alt+→', action: 'cycleNext' },
    ],
  },
  {
    title: '运行',
    items: [
      { label: '开始调试', key: 'F5', disabled: true },
      { label: '停止调试', key: 'Shift+F5', disabled: true },
      { label: '运行而不调试', key: 'Ctrl+F5', disabled: true },
    ],
  },
  {
    title: '终端',
    items: [
      { label: '新建终端', key: 'Ctrl+`', action: 'togglePanel' },
      { divider: true },
      { label: '运行任务…', disabled: true },
    ],
  },
  {
    title: '帮助',
    items: [
      { label: '欢迎页', action: 'openReadme' },
      { divider: true },
      { label: '关于', action: 'showAbout' },
    ],
  },
];

export default function MenuBar({ actions }) {
  const [open, setOpen] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (item) => {
    setOpen(null);
    if (!item.action || !actions[item.action]) return;
    actions[item.action]();
  };

  return (
    <div className="menubar" ref={rootRef}>
      <div className="menubar-left">
        <span className="menubar-logo" title="主页 · 仿 VS Code">
          <span className="logo-mark">&lt;/&gt;</span>
        </span>
        {MENUS.map((menu) => (
          <div className="menu-root" key={menu.title}>
            <button
              className={`menu-btn ${open === menu.title ? 'active' : ''}`}
              onClick={() => setOpen(open === menu.title ? null : menu.title)}
              onPointerEnter={() => open && setOpen(menu.title)}
            >
              {menu.title}
            </button>
            {open === menu.title && (
              <div className="menu-pop" role="menu">
                {menu.items.map((it, i) =>
                  it.divider ? (
                    <div className="menu-sep" key={`sep-${i}`} />
                  ) : (
                    <button
                      className={`menu-item ${it.disabled ? 'disabled' : ''}`}
                      key={it.label}
                      onClick={() => run(it)}
                    >
                      <span className="mi-label">{it.label}</span>
                      {it.key && <span className="mi-key">{it.key}</span>}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="menubar-right">
        <span className="mb-title">主页 · 仿 VS Code 的个人名片</span>
        <button className="menubar-icon-btn" title="通知（装饰）">
          <MenuBarIcon />
        </button>
        <button className="menubar-icon-btn acc" title={PROFILE.name} onClick={actions.showAbout}>
          {PROFILE.initials}
        </button>
      </div>
    </div>
  );
}
