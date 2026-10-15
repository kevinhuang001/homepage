import React, { useEffect, useRef, useState } from 'react';

/**
 * 顶部菜单栏：仅展示真实可执行动作，避免误导访客。
 * actions: { openPalette, newDraft, openLocal, closeActive, closeAll,
 *            toggleSidebar, togglePanel, focusSearch, cycleTab, openReadme, showAbout }
 */
const MENUS = [
  {
    title: '文件',
    items: [
      { label: '新建文件…', key: 'Ctrl+N', action: 'newDraft' },
      { label: '打开文件…', key: 'Ctrl+O', action: 'openLocal' },
      { divider: true },
      { label: '保存', key: 'Ctrl+S', action: 'save' },
      { divider: true },
      { label: '关闭编辑器', key: 'Ctrl+W', action: 'closeActive' },
      { label: '关闭所有编辑器', action: 'closeAll' },
    ],
  },
  {
    title: '编辑',
    items: [
      { label: '在工作区中搜索', key: 'Ctrl+Shift+F', action: 'focusSearch' },
      { label: '打开资源管理器', key: 'Ctrl+Shift+E', action: 'focusExplorer' },
    ],
  },
  {
    title: '查看',
    items: [
      { label: '命令面板…', key: 'Ctrl+Shift+P', action: 'openPalette' },
      { label: '打开 Markdown 预览到侧边', key: 'Ctrl+Shift+V', action: 'openPreview' },
      { divider: true },
      { label: '显示终端', key: 'Ctrl+`', action: 'togglePanel' },
      { label: '显示侧边栏', key: 'Ctrl+B', action: 'toggleSidebar' },
      { divider: true },
    ],
  },
  {
    title: '转到',
    items: [
      { label: '转到文件…', key: 'Ctrl+P', action: 'openQuickOpen' },
      { divider: true },
      { label: '上一个编辑器', key: 'Ctrl+Shift+Tab', action: 'cyclePrev' },
      { label: '下一个编辑器', key: 'Ctrl+Tab', action: 'cycleNext' },
    ],
  },
  {
    title: '终端',
    items: [
      { label: '新建终端', key: 'Ctrl+`', action: 'togglePanel' },
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
                      disabled={Boolean(it.disabled)}
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
    </div>
  );
}
