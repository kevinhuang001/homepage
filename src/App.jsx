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
import * as ed from './lib/editors.js';

const uid = () => Math.random().toString(36).slice(2, 10);

const DRAFT_CONTENT = `# 未命名.md（草稿）

> 我由「资源管理器 → 新建文件」创建。这里可以**直接打字编辑**，右侧预览会实时刷新。
> 提醒：内容只保存在当前页面内存里，刷新或关闭就会消失 —— 这就是“不会真的保存”的演示 😄

## 待办

- [ ] 把示例内容替换成你的真实信息
- [ ] 把 \`public/files/简历.pdf\` 换成你的简历
- [ ] 发布到 GitHub Pages / Vercel 之类的地方
`;

/** 收集树里所有标签 id */
const allTabIds = (tree) => {
  const ids = [];
  const walk = (n) => {
    if (!n) return;
    if (n.kind === 'group') n.tabs.forEach((t) => ids.push(t.id));
    else {
      walk(n.a);
      walk(n.b);
    }
  };
  walk(tree);
  return ids;
};

const wipeAllTabs = (n) => {
  if (!n) return n;
  if (n.kind === 'group') return { ...n, tabs: [], active: null };
  return { ...n, a: wipeAllTabs(n.a), b: wipeAllTabs(n.b) };
};

export default function App() {
  /* ---------- 布局状态 ---------- */
  const [activity, setActivityState] = useState('explorer');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(272);
  const [panel, setPanel] = useState({ open: false, tab: 'terminal', height: 210 });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const readmeNode = useMemo(() => ALL_FILES.find((f) => f.name === 'README.md'), []);

  /* ---------- 编辑器组树（核心状态） ---------- */
  const treeRef = useRef(null);
  const focusGidRef = useRef(null);
  const nodeById = useRef(new Map()); // tab id -> 文件描述（用于取原始内容）
  const fileInputRef = useRef(null);

  const [initialTree] = useState(() => {
    let g = ed.makeGroup([], null);
    if (readmeNode) {
      g = ed.openTab(g, g.gid, { id: readmeNode.path, node: readmeNode });
      nodeById.current.set(readmeNode.path, readmeNode);
    }
    treeRef.current = g;
    focusGidRef.current = g.gid;
    return g;
  });
  const [editorTree, setEditorTree] = useState(initialTree);
  const [focusGid, setFocusGidState] = useState(initialTree.gid);

  /* ---------- 编辑内容（仅内存）：覆写 + 脏标记 ---------- */
  const [overrides, setOverrides] = useState(() => new Map());
  const [dirty, setDirty] = useState(() => new Set());
  const [statusMsg, setStatusMsg] = useState(null);

  const flash = useCallback((text) => {
    setStatusMsg({ text, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!statusMsg) return undefined;
    const t = setTimeout(() => setStatusMsg(null), 2600);
    return () => clearTimeout(t);
  }, [statusMsg]);

  /* ---------- 树提交：同步 ref + 清理孤儿编辑缓冲 ---------- */
  const setFocusGid = useCallback((gid) => {
    focusGidRef.current = gid;
    setFocusGidState(gid);
  }, []);

  const commit = useCallback((next, forceFocus = null) => {
    const groups = ed.collectGroups(next);
    const focusOk = groups.some((g) => g.gid === focusGidRef.current);
    const f =
      (forceFocus && groups.some((g) => g.gid === forceFocus) && forceFocus) ||
      (focusOk ? focusGidRef.current : groups[0]?.gid) ||
      null;
    treeRef.current = next;
    focusGidRef.current = f;
    setEditorTree(next);
    setFocusGidState(f);

    // 清理已不存在标签的编辑缓冲（模拟“关闭即丢弃未保存内容”）
    const present = new Set(allTabIds(next));
    nodeById.current.forEach((_, id) => {
      if (!present.has(id)) nodeById.current.delete(id);
    });
    setOverrides((prev) => {
      let changed = false;
      const nm = new Map();
      prev.forEach((v, id) => {
        if (present.has(id)) nm.set(id, v);
        else changed = true;
      });
      return changed ? nm : prev;
    });
    setDirty((prev) => {
      let changed = false;
      const ns = new Set();
      prev.forEach((id) => {
        if (present.has(id)) ns.add(id);
        else changed = true;
      });
      return changed ? ns : prev;
    });
  }, []);

  /* ---------- 打开 / 关闭 / 选择 ---------- */
  const openNode = useCallback(
    (node, preferGid = null) => {
      if (!node) return;
      let id = node.path || node.uid;
      if (!id) {
        node.uid = uid();
        id = node.uid;
      }
      nodeById.current.set(id, node);
      const groups = ed.collectGroups(treeRef.current);
      const prefer = preferGid && ed.findGroup(treeRef.current, preferGid);
      const target =
        prefer?.gid ||
        (groups.some((g) => g.gid === focusGidRef.current) ? focusGidRef.current : groups[0]?.gid);
      if (!target) return;
      commit(ed.openTab(treeRef.current, target, { id, node }), target);
    },
    [commit],
  );

  const onCloseTab = useCallback(
    (gid, id) => commit(ed.closeTab(treeRef.current, gid, id)),
    [commit],
  );
  const onSelectTab = useCallback(
    (gid, id) => commit(ed.selectTab(treeRef.current, gid, id), gid),
    [commit],
  );
  const onMoveTab = useCallback(
    (from, to, id) => commit(ed.moveTabInto(treeRef.current, from, to, id), to),
    [commit],
  );
  const onSplitTab = useCallback(
    (hoverGid, dir, tab, fromGid) => {
      const { tree, newGid } = ed.splitTabAt(treeRef.current, hoverGid, dir, tab, fromGid);
      commit(tree, newGid);
    },
    [commit],
  );
  const onCloseGroup = useCallback(
    (gid) => {
      const [next] = ed.removeGroup(treeRef.current, gid);
      commit(next);
    },
    [commit],
  );
  const onRatio = useCallback(
    (sid, ratio) => commit(ed.setRatio(treeRef.current, sid, ratio)),
    [commit],
  );
  const focusGroup = useCallback((gid) => setFocusGid(gid), [setFocusGid]);

  const closeAllEditors = useCallback(() => commit(wipeAllTabs(treeRef.current)), [commit]);

  const cycleTab = useCallback(
    (dir) => {
      const g = ed.findGroup(treeRef.current, focusGidRef.current);
      if (!g || g.tabs.length < 2) return;
      const cur = g.tabs.findIndex((t) => t.id === g.active);
      const next = g.tabs[(cur + dir + g.tabs.length) % g.tabs.length];
      commit(ed.selectTab(treeRef.current, g.gid, next.id), g.gid);
    },
    [commit],
  );

  /* ---------- 编辑（内存级，不写盘） ---------- */
  const getContent = useCallback((id) => {
    const o = overrides.get(id);
    return o !== undefined ? o : nodeById.current.get(id)?.content ?? '';
  }, [overrides]);

  const setContent = useCallback((id, text) => {
    const orig = nodeById.current.get(id)?.content ?? '';
    setOverrides((prev) => {
      if (prev.get(id) === text) return prev;
      const nm = new Map(prev);
      nm.set(id, text);
      return nm;
    });
    setDirty((prev) => {
      const should = text !== orig;
      const has = prev.has(id);
      if (has === should) return prev;
      const ns = new Set(prev);
      if (should) ns.add(id);
      else ns.delete(id);
      return ns;
    });
  }, []);

  const saveActive = useCallback(() => {
    const g = ed.findGroup(treeRef.current, focusGidRef.current);
    const id = g?.active;
    if (!id) return;
    setDirty((prev) => {
      if (!prev.has(id)) return prev;
      const ns = new Set(prev);
      ns.delete(id);
      return ns;
    });
    flash('已保存 ✓（演示：内容仅保留在当前页面，不会写入磁盘）');
  }, [flash]);

  /* ---------- 本地文件 / 草稿 ---------- */
  const newDraft = useCallback(
    (gid = null) => {
      const node = {
        name: `未命名-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.md`,
        kind: 'md',
        language: 'Markdown',
        content: DRAFT_CONTENT,
        draft: true,
        path: null,
      };
      openNode(node, gid);
    },
    [openNode],
  );

  const openLocal = useCallback(() => fileInputRef.current?.click(), []);

  const onLocalFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (/\.pdf$/i.test(file.name)) {
        openNode({
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
        openNode({
          name: file.name,
          kind: /\.(md|markdown)$/i.test(file.name) ? 'md' : 'raw',
          language: /\.(md|markdown)$/i.test(file.name) ? 'Markdown' : '纯文本',
          content: String(reader.result || ''),
          path: null,
        });
      };
      reader.readAsText(file, 'utf-8');
    },
    [openNode],
  );

  /* ---------- 面板 / 视图 ---------- */
  const setActivity = useCallback((id, visible = true) => {
    setActivityState(id);
    if (visible !== undefined) setSidebarOpen(visible);
  }, []);

  const togglePanel = useCallback(() => {
    setPanel((p) =>
      p.open && p.tab === 'terminal' ? { ...p, open: false } : { ...p, open: true, tab: 'terminal' },
    );
  }, []);
  const toggleSidebar = useCallback(() => setSidebarOpen((s) => !s), []);
  const focusSearch = useCallback(() => {
    setActivityState('search');
    setSidebarOpen(true);
  }, []);

  /* ---------- 菜单 / 命令面板动作 ---------- */
  const actions = useMemo(
    () => ({
      openReadme: () => openNode(readmeNode),
      newDraft,
      openLocal,
      save: saveActive,
      closeActive: () => {
        const g = ed.findGroup(treeRef.current, focusGidRef.current);
        if (g?.active) onCloseTab(g.gid, g.active);
      },
      closeAll: closeAllEditors,
      cyclePrev: () => cycleTab(-1),
      cycleNext: () => cycleTab(1),
      togglePanel,
      toggleSidebar,
      focusSearch,
      showAbout: () => setAboutOpen(true),
      openPalette: () => setPaletteOpen(true),
      openNode,
    }),
    [openNode, readmeNode, newDraft, openLocal, saveActive, onCloseTab, closeAllEditors, cycleTab, togglePanel, toggleSidebar, focusSearch],
  );

  /* ---------- 全局快捷键 ---------- */
  const actionsRef = useRef({});
  actionsRef.current = { ...actions, activeNodeId: null, paletteOpen, aboutOpen };

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
        A.closeActive();
        return;
      }
      if (mod && k === 's') {
        e.preventDefault();
        A.save();
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
  }, [panel.open, paletteOpen, aboutOpen, focusSearch]);

  /* ---------- 侧边栏宽度拖拽 ---------- */
  const startResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev) => setSidebarWidth(Math.min(560, Math.max(190, startW + ev.clientX - startX)));
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.classList.remove('resizing');
      document.body.style.cursor = '';
    };
    document.body.classList.add('resizing');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  /* ---------- 终端面板高度拖拽 ---------- */
  const startPanelResize = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = panel.height;
    const onMove = (ev) => {
      const h = Math.min(window.innerHeight * 0.62, Math.max(96, startH + (startY - ev.clientY)));
      setPanel((p) => ({ ...p, height: Math.round(h) }));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.classList.remove('resizing');
      document.body.style.cursor = '';
    };
    document.body.classList.add('resizing');
    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  /* ---------- 当前聚焦标签（供状态栏等使用） ---------- */
  const focusGroupObj = ed.findGroup(editorTree, focusGid);
  const activeTab = focusGroupObj?.tabs.find((t) => t.id === focusGroupObj.active) ?? null;
  const activeNode = activeTab?.node ?? null;

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
              onNewDraft={() => newDraft()}
            />
            <div className="resizer" onMouseDown={startResize} title="拖动调整宽度" />
          </div>
        )}

        <div className="center-col">
          <EditorArea
            tree={editorTree}
            focusGid={focusGid}
            dirtyIds={dirty}
            getContent={getContent}
            setContent={setContent}
            isDirty={(id) => dirty.has(id)}
            onSelect={onSelectTab}
            onCloseTab={onCloseTab}
            onMoveTab={onMoveTab}
            onSplitTab={onSplitTab}
            onCloseGroup={onCloseGroup}
            onRatio={onRatio}
            onFocusGroup={focusGroup}
            onOpenFileIn={openNode}
            onOpenReadme={(gid) => openNode(readmeNode, gid)}
            onNewDraft={newDraft}
          />
          {panel.open && <div className="panel-resizer" onMouseDown={startPanelResize} title="拖动调整终端高度" />}
          <BottomPanel
            open={panel.open}
            tab={panel.tab}
            height={panel.height}
            setOpen={(open) => setPanel((p) => ({ ...p, open }))}
            setTab={(tab) => setPanel((p) => ({ ...p, tab }))}
            onOpen={openNode}
          />
        </div>
      </div>

      <StatusBar activeNode={activeNode} statusMsg={statusMsg?.text} />

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} actions={actions} />}
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
