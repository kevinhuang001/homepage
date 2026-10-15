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
import { SITE } from './config/site.js';
import { readSavedDocs, writeSavedDocs } from './lib/storage.js';
import * as ed from './lib/editors.js';

const uid = () => Math.random().toString(36).slice(2, 10);

const DRAFT_CONTENT = `# 未命名.md（草稿）

> 这是浏览器中的临时草稿。使用「打开 Markdown 预览到侧边」可以查看渲染结果。
> 提醒：草稿不会上传到服务器。按 Ctrl+S 可以下载文件副本。

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
  const [paletteMode, setPaletteMode] = useState(null); // 'files' (Ctrl+P) 或 'commands' (Ctrl+Shift+P)
  const [aboutOpen, setAboutOpen] = useState(false);

  const readmeNode = useMemo(() => ALL_FILES.find((f) => f.name === SITE.initialFile), []);

  /* ---------- 编辑器组树（核心状态） ---------- */
  const treeRef = useRef(null);
  const focusGidRef = useRef(null);
  const nodeById = useRef(new Map()); // id -> 原始文件内容
  const savedDocs = useRef(readSavedDocs()); // Ctrl+S 后持久保存在本浏览器
  const fileInputRef = useRef(null);

  const [initialTree] = useState(() => {
    let g = ed.makeGroup([], null);
    if (readmeNode) {
      g = ed.openTab(g, g.gid, { id: readmeNode.path, node: readmeNode });
      nodeById.current.set(readmeNode.path, readmeNode);
      // 默认把预览分到第二个面板（右侧），还原官方“Preview README.md”独立标签
      const pnode = {
        name: `Preview ${readmeNode.name}`,
        kind: 'preview',
        sourceId: readmeNode.path,
        language: 'Markdown 预览',
      };
      pnode.uid = uid();
      const r = ed.splitTabAt(g, g.gid, 'right', { id: pnode.uid, node: pnode }, g.gid);
      g = r.tree;
    }
    treeRef.current = g;
    focusGidRef.current = ed.collectGroups(g)[0]?.gid ?? g.gid;
    return g;
  });
  const [editorTree, setEditorTree] = useState(initialTree);
  const [focusGid, setFocusGidState] = useState(
    () => ed.collectGroups(initialTree)[0]?.gid ?? initialTree.gid,
  );

  /* ---------- 编辑内容：未保存的覆写 + 显式保存的浏览器持久化 ---------- */
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
    // Markdown 预览是独立编辑器：即使源码标签关闭，预览仍能访问源内容。
    ed.collectGroups(next).forEach((group) => group.tabs.forEach((tab) => {
      if (tab.node?.kind === 'preview') present.add(tab.node.sourceId);
    }));
    nodeById.current.forEach((_, id) => {
      if (!present.has(id)) {
        const node = nodeById.current.get(id);
        if (node?.localUrl) URL.revokeObjectURL(node.localUrl);
        nodeById.current.delete(id);
      }
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

  /* ---------- Markdown 预览（独立标签，默认分到右侧面板） ---------- */
  const openPreviewToSide = useCallback(
    (groupId, srcId, srcNode) => {
      if (!srcNode || srcNode.kind !== 'md') return;
      const tree = treeRef.current;
      // 该源码已有预览 -> 不再重复（也不抢焦点）
      const exists = ed
        .collectGroups(tree)
        .some((g) => g.tabs.some((t) => t.node?.kind === 'preview' && t.node.sourceId === srcId));
      if (exists) return;
      const targetGid = ed.findGroup(tree, groupId)?.gid;
      if (!targetGid) return;
      const pnode = {
        name: `Preview ${srcNode.name}`,
        kind: 'preview',
        sourceId: srcId,
        language: 'Markdown 预览',
      };
      pnode.uid = uid();
      // 复用已有的预览面板（任何含 preview 标签的组），否则在右侧新建一个分组
      const previewGroup = ed
        .collectGroups(tree)
        .find((g) => g.tabs.some((t) => t.node?.kind === 'preview'));
      if (previewGroup) {
        commit(ed.openTab(tree, previewGroup.gid, { id: pnode.uid, node: pnode }), targetGid);
      } else {
        const { tree: nt } = ed.splitTabAt(tree, targetGid, 'right', { id: pnode.uid, node: pnode }, targetGid);
        commit(nt, targetGid);
      }
    },
    [commit],
  );

  const openPreviewForActive = useCallback(() => {
    const g = ed.findGroup(treeRef.current, focusGidRef.current);
    const t = g?.tabs.find((tab) => tab.id === g.active);
    if (t?.node?.kind === 'md') openPreviewToSide(g.gid, t.id, t.node);
  }, [openPreviewToSide]);

  // 源码与预览按 VS Code 逻辑独立打开/关闭，不在打开文件时强行拆分编辑器。
  const onCloseTab = useCallback(
    (gid, id) => {
      const occurrences = allTabIds(treeRef.current).filter((tabId) => tabId === id).length;
      if (dirty.has(id) && occurrences <= 1 &&
        !window.confirm('此文件有未保存的修改。关闭并放弃修改吗？')) return;
      commit(ed.closeTab(treeRef.current, gid, id));
    },
    [commit, dirty],
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
      const group = ed.findGroup(treeRef.current, gid);
      const atRisk = group?.tabs.some((tab) =>
        dirty.has(tab.id) && allTabIds(treeRef.current).filter((id) => id === tab.id).length === 1,
      );
      if (atRisk && !window.confirm('此编辑器组存在未保存的修改。确定关闭？')) return;
      const [next] = ed.removeGroup(treeRef.current, gid);
      commit(next);
    },
    [commit, dirty],
  );
  const onRatio = useCallback(
    (sid, ratio) => commit(ed.setRatio(treeRef.current, sid, ratio)),
    [commit],
  );
  const focusGroup = useCallback((gid) => setFocusGid(gid), [setFocusGid]);

  const closeAllEditors = useCallback(() => {
    if (dirty.size && !window.confirm('所有未保存的修改将被放弃。仍要关闭所有编辑器吗？')) return;
    commit(wipeAllTabs(treeRef.current));
  }, [commit, dirty]);

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

  /* ---------- 编辑缓冲区（修改期间驻留内存；显式保存时写浏览器本地存储） ---------- */
  const getContent = useCallback((id) => {
    const o = overrides.get(id);
    return o !== undefined ? o : savedDocs.current.get(id) ?? nodeById.current.get(id)?.content ?? '';
  }, [overrides]);

  const setContent = useCallback((id, text) => {
    const orig = savedDocs.current.get(id) ?? nodeById.current.get(id)?.content ?? '';
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

  const downloadText = useCallback((node, content) => {
    const objectUrl = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = node.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }, []);

  const saveActive = useCallback(() => {
    const group = ed.findGroup(treeRef.current, focusGidRef.current);
    const tab = group?.tabs.find((item) => item.id === group.active);
    const node = tab?.node;
    if (!node || !['md', 'raw'].includes(node.kind)) {
      flash('当前编辑器是只读视图');
      return;
    }
    const id = tab.id;
    const content = getContent(id);
    if (!node.path) {
      downloadText(node, content); // 草稿/本地导入的文件不能擅自写回原磁盘
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      // 下载成功不意味着磁盘文件已覆盖；仍保留页面编辑缓冲。
      flash('已下载文件副本（浏览器不能覆盖原文件）');
      return;
    }
    const next = new Map(savedDocs.current);
    next.set(id, content);
    if (!writeSavedDocs(next)) {
      flash('保存失败：浏览器本地存储不可用或空间不足');
      return;
    }
    savedDocs.current = next;
    setDirty((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
    flash('已保存到此浏览器 · 不会修改 Git 仓库');
  }, [getContent, downloadText, flash]);

  // 刷新/离开页面前提醒用户；保存过的仓库文件可以从浏览器本地存储恢复。
  useEffect(() => {
    if (dirty.size === 0) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

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
      if (/\.(png|jpe?g|gif|svg|webp|bmp)$/i.test(file.name)) {
        openNode({
          name: file.name,
          kind: 'image',
          language: 'Image',
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
      focusExplorer: () => { setActivityState('explorer'); setSidebarOpen(true); },
      showAbout: () => setAboutOpen(true),
      openPalette: () => setPaletteMode('commands'),
      openQuickOpen: () => setPaletteMode('files'),
      openPreview: openPreviewForActive,
      openNode,
    }),
    [openNode, readmeNode, newDraft, openLocal, saveActive, onCloseTab, closeAllEditors, cycleTab, togglePanel, toggleSidebar, focusSearch, openPreviewForActive],
  );

  /* ---------- 全局快捷键 ---------- */
  const actionsRef = useRef({});
  actionsRef.current = { ...actions, paletteMode, aboutOpen };

  useEffect(() => {
    const onKey = (e) => {
      const A = actionsRef.current;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      if (e.key === 'Escape') {
        if (A.paletteMode) setPaletteMode(null);
        else if (A.aboutOpen) setAboutOpen(false);
        else if (!mod && !/^(INPUT|TEXTAREA)$/i.test(e.target.tagName))
          setPanel((p) => ({ ...p, open: false }));
        return;
      }
      if (mod && e.shiftKey && ['p', 'f', 'e'].includes(k)) {
        e.preventDefault();
        if (k === 'p') A.openPalette();
        else if (k === 'f') A.focusSearch();
        else A.focusExplorer();
        return;
      }
      if (mod && e.shiftKey && k === 'v') {
        e.preventDefault();
        A.openPreview();
        return;
      }
      if (e.key === 'F1' || (mod && k === 'p' && !e.shiftKey)) {
        e.preventDefault();
        if (e.key === 'F1') A.openPalette();
        else A.openQuickOpen();
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
      if (mod && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) A.cyclePrev(); else A.cycleNext();
        return;
      }
      if (mod && (e.key === 'PageUp' || e.key === 'PageDown')) {
        e.preventDefault();
        if (e.key === 'PageUp') A.cyclePrev(); else A.cycleNext();
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
  }, [paletteMode, aboutOpen]);

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

  useEffect(() => {
    document.title = SITE.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', SITE.description);
  }, []);

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
              getContent={getContent}
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
            onOpenPreview={openPreviewToSide}
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

      {paletteMode && (
        <CommandPalette mode={paletteMode} onClose={() => setPaletteMode(null)} actions={actions} />
      )}
      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.pdf,application/pdf,.png,.jpg,.jpeg,.gif,.svg,.webp,image/*"
        style={{ display: 'none' }}
        onChange={onLocalFile}
      />
    </div>
  );
}
