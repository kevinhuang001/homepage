import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MenuBar from './components/MenuBar.jsx';
import ActivityBar from './components/ActivityBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import EditorArea from './components/EditorArea.jsx';
import BottomPanel from './components/BottomPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import AboutDialog from './components/AboutDialog.jsx';
import { ALL_FILES } from './data/vfs.js';

const uid = () => Math.random().toString(36).slice(2, 10);

const DRAFT_CONTENT = `# 未命名.md（草稿）

> 我由「资源管理器 → 新建文件」创建。本主页只仿 VS Code 的**界面**，并不具备真正的编辑能力。
> 想要一个“能编辑又能预览 Markdown”的真编辑器？去下载 VS Code 吧 😄

## 待办

- [ ] 把示例内容替换成你的真实信息
- [ ] 把 \`public/files/简历.pdf\` 换成你的简历
- [ ] 发布到 GitHub Pages / Vercel 之类的地方
`;

export default function App() {
  /* ---------- 布局状态 ---------- */
  const [activity, setActivityState] = useState('explorer');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(272);
  const [panel, setPanel] = useState({ open: false, tab: 'terminal' });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  /* ---------- 编辑器标签状态 ---------- */
  const readmeNode = useMemo(() => ALL_FILES.find((f) => f.name === 'README.md'), []);
  const [tabs, setTabs] = useState(() =>
    readmeNode ? [{ id: readmeNode.path, node: readmeNode }] : [],
  );
  const [activeId, setActiveId] = useState(() => readmeNode?.path ?? null);

  const fileInputRef = useRef(null);
  const actionsRef = useRef({});

  const setActivity = useCallback((id, visible = true) => {
    setActivityState(id);
    if (visible !== undefined) setSidebarOpen(visible);
  }, []);

  /* ---------- 标签页操作 ---------- */
  const openNode = useCallback((node) => {
    if (!node) return;
    const id = node.path || node.uid || (node.uid = uid());
    setTabs((prev) => (prev.some((t) => t.id === id) ? prev : [...prev, { id, node }]));
    setActiveId(id);
  }, []);

  const closeTab = useCallback((id) => {
    setTabs((prev) => {
      const i = prev.findIndex((t) => t.id === id);
      if (i < 0) return prev;
      const next = prev.filter((t) => t.id !== id);
      setActiveId((cur) =>
        cur === id ? next[Math.min(i, next.length - 1)]?.id ?? null : cur,
      );
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    setTabs([]);
    setActiveId(null);
  }, []);

  const cycleTab = useCallback(
    (dir) => {
      setTabs((prev) => {
        if (prev.length < 2) return prev;
        const cur = prev.findIndex((t) => t.id === activeId);
        const nextIdx = (cur + dir + prev.length) % prev.length;
        setActiveId(prev[nextIdx].id);
        return prev;
      });
    },
    [activeId],
  );

  /* ---------- 本地文件 / 草稿 ---------- */
  const addLocalNode = useCallback(
    (node) => {
      node.uid = uid();
      openNode(node);
    },
    [openNode],
  );

  const newDraft = useCallback(() => {
    const node = {
      name: `未命名-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.md`,
      kind: 'md',
      language: 'Markdown',
      content: DRAFT_CONTENT,
      draft: true,
      path: null,
    };
    addLocalNode(node);
  }, [addLocalNode]);

  const openLocal = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onLocalFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      const isPdf = /\.pdf$/i.test(file.name);
      if (isPdf) {
        addLocalNode({
          name: file.name,
          kind: 'pdf',
          language: 'PDF',
          localUrl: URL.createObjectURL(file),
          path: null,
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        addLocalNode({
          name: file.name,
          kind: /\.(md|markdown)$/i.test(file.name) ? 'md' : 'raw',
          language: /\.(md|markdown)$/i.test(file.name) ? 'Markdown' : '纯文本',
          content: String(reader.result || ''),
          path: null,
        });
      };
      reader.readAsText(file, 'utf-8');
    },
    [addLocalNode],
  );

  /* ---------- 面板 / 视图 ---------- */
  const togglePanel = useCallback(() => {
    setPanel((p) => (p.open && p.tab === 'terminal' ? { ...p, open: false } : { open: true, tab: 'terminal' }));
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((s) => !s), []);
  const focusSearch = useCallback(() => {
    setActivityState('search');
    setSidebarOpen(true);
  }, []);

  /* ---------- 菜单 / 命令面板用到的动作 ---------- */
  const actions = useMemo(
    () => ({
      openReadme: () => readmeNode && openNode(readmeNode),
      newDraft,
      openLocal,
      closeActive: () => activeId && closeTab(activeId),
      closeAll,
      cyclePrev: () => cycleTab(-1),
      cycleNext: () => cycleTab(1),
      togglePanel,
      toggleSidebar,
      focusSearch,
      showAbout: () => setAboutOpen(true),
      openPalette: () => setPaletteOpen(true),
      openNode,
    }),
    [readmeNode, openNode, newDraft, openLocal, activeId, closeTab, closeAll, cycleTab, togglePanel, toggleSidebar, focusSearch],
  );

  /* ---------- 全局快捷键（用 ref 规避闭包过期） ---------- */
  actionsRef.current = { ...actions, activeId, paletteOpen, aboutOpen, closeTab };

  useEffect(() => {
    const onKey = (e) => {
      const A = actionsRef.current;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      if (e.key === 'Escape') {
        if (A.paletteOpen) setPaletteOpen(false);
        else if (A.aboutOpen) setAboutOpen(false);
        else if (!mod && !/^(INPUT|TEXTAREA)$/i.test(e.target.tagName))
          setPanel((p) => ({ ...p, open: false }));
        return;
      }
      if (mod && e.shiftKey && (k === 'p' || k === 'f')) {
        e.preventDefault();
        if (k === 'p') setPaletteOpen(true);
        else focusSearch();
        return;
      }
      if (e.key === 'F1' || (mod && k === 'p')) {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (mod && k === '`') {
        e.preventDefault();
        A.togglePanel();
        return;
      }
      if (mod && k === 'b') {
        e.preventDefault();
        A.toggleSidebar();
        return;
      }
      if (mod && k === 'f') {
        e.preventDefault();
        A.focusSearch();
        return;
      }
      if (mod && k === 'w') {
        e.preventDefault();
        if (A.activeId) A.closeTab(A.activeId);
        return;
      }
      if (mod && k === 'n') {
        e.preventDefault();
        A.newDraft();
        return;
      }
      if (mod && k === 'o') {
        e.preventDefault();
        A.openLocal();
        return;
      }
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        A.cyclePrev();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        A.cycleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel.open, paletteOpen, aboutOpen]);

  /* ---------- 侧边栏宽度拖拽 ---------- */
  const startResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev) => {
      const w = Math.min(560, Math.max(190, startW + ev.clientX - startX));
      setSidebarWidth(w);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.classList.remove('resizing');
    };
    document.body.classList.add('resizing');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const activeTab = tabs.find((t) => t.id === activeId);
  const activeNode = activeTab?.node || null;

  return (
    <div className="app">
      <MenuBar actions={actions} />

      <div className="workbench">
        <ActivityBar activity={activity} setActivity={setActivity} sidebarOpen={sidebarOpen} />

        {sidebarOpen && (
          <div className="sidebar-wrap" style={{ width: sidebarWidth }}>
            <Sidebar
              activity={activity}
              onOpen={openNode}
              activePath={activeNode?.path ?? null}
              onNewDraft={newDraft}
            />
            <div className="resizer" onMouseDown={startResize} title="拖动调整宽度" />
          </div>
        )}

        <div className="center-col">
          <EditorArea
            tabs={tabs}
            activeId={activeId}
            onSelect={setActiveId}
            onClose={closeTab}
            onOpen={openNode}
            onNewDraft={newDraft}
          />
          <BottomPanel
            open={panel.open}
            tab={panel.tab}
            setOpen={(open) => setPanel((p) => ({ ...p, open }))}
            setTab={(tab) => setPanel((p) => ({ ...p, tab }))}
            onOpen={openNode}
          />
        </div>
      </div>

      <StatusBar activeNode={activeNode} />

      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} actions={actions} />
      )}
      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={onLocalFile}
      />
    </div>
  );
}
