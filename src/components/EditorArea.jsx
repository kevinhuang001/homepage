import React, { useMemo, useRef, useState } from 'react';
import { Close, Eye, FileTypeIcon } from './icons.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';
import MarkdownView from './MarkdownView.jsx';
import { isGroup, isSplit } from '../lib/editors.js';
import { assetUrl } from '../utils.js';

/* ==================== PDF 预览 ==================== */
function PdfView({ file }) {
  const src = file.asset ? assetUrl(file.asset) : file.localUrl;
  return (
    <div className="pdf-wrap">
      <div className="pdf-toolbar">
        <FileTypeIcon kind="pdf" size={15} />
        <span className="pdf-name">{file.name}</span>
        <span className="pdf-hint">浏览器内置查看器 · 支持缩放与翻页</span>
        <a className="pdf-download" href={src} target="_blank" rel="noreferrer" download={file.name}>
          下载 PDF
        </a>
      </div>
      <iframe title={file.name} src={src} className="pdf-frame" />
    </div>
  );
}

/* ==================== Markdown 预览（独立标签，实时渲染源文件） ==================== */
function PreviewView({ node, getContent, onOpen }) {
  const content = getContent(node.sourceId);
  const fileLike = useMemo(() => ({ name: node.name, kind: 'md', content }), [node.name, content]);
  return (
    <div className="preview-pane">
      <MarkdownView file={fileLike} onOpen={onOpen} scrollKey={node.uid} />
    </div>
  );
}

/* ==================== 图片查看（示例图片等） ==================== */
function ImageView({ file }) {
  const src = file.asset ? assetUrl(file.asset) : file.localUrl;
  return (
    <div className="image-view-wrap">
      <img className="image-view" src={src} alt={file.name} />
      <div className="image-view-cap">{file.name}</div>
    </div>
  );
}

/* ==================== 纯文本（可编辑，仅内存） ==================== */
function RawView({ content, onChange }) {
  return (
    <textarea
      className="raw-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      wrap="off"
    />
  );
}

/* ==================== 空编辑器欢迎页（每个组可独立出现） ==================== */
function EmptyPane({ gid, onOpenReadme, onNewDraft, canDragHere }) {
  return (
    <div className="empty-editor">
      <div className="ee-card">
        <div className="ee-logo">&lt;/&gt;</div>
        <h1 className="ee-title">个人主页</h1>
        <p className="ee-sub">
          这个编辑器组还没有打开文件。{canDragHere ? '把一个标签页拖到这里，或在左侧文件树点开文件。' : '从左侧文件树点开一个文件吧。'}
        </p>
        <div className="ee-actions">
          <button className="ee-btn primary" onClick={() => onOpenReadme(gid)}>
            打开 README.md
          </button>
          <button className="ee-btn" onClick={() => onNewDraft(gid)}>
            新建草稿
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== 组内标签条（只放标签） ==================== */
function GroupTabs({ g, onSelect, onCloseTab, onDragStart, dirtyIds }) {
  return (
    <div className="tabbar group-tabbar">
      <div className="tabbar-tabs">
        {g.tabs.map(({ id, node }) => (
          <div
            key={id}
            className={`editor-tab ${id === g.active ? 'active' : ''}`}
            onClick={() => onSelect(g.gid, id)}
            onAuxClick={(e) => {
              if (e.button === 1) onCloseTab(g.gid, id);
            }}
            draggable
            onDragStart={(e) => {
              onDragStart(e, g.gid, { id, node });
            }}
            title={node.path ? node.path.replace(/^\//, '') : node.name}
          >
            <FileTypeIcon kind={node.kind === 'preview' ? 'md' : node.kind} size={14} />
            <span className="tab-name">{node.name}</span>
            {dirtyIds.has(id) && <span className="tab-dot" title="已修改（仅当前页面）" />}
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(g.gid, id);
              }}
              title="关闭 (Ctrl+W)"
            >
              <Close size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== 拆分方向提示层 ==================== */
function DropIndicator({ zone }) {
  if (!zone) return null;
  return (
    <div className={`drop-indicator zone-${zone}`}>
      {zone === 'center' && <div className="drop-center-label">移到此处</div>}
    </div>
  );
}

/* ==================== 组 ==================== */
function GroupPane(props) {
  const {
    g,
    focusedGid,
    onSelect,
    onCloseTab,
    onDragStart,
    dirtyIds,
    drop,
    getContent,
    setContent,
    onOpenFileIn,
    onOpenReadme,
    onNewDraft,
    onFocusGroup,
  } = props;

  const activeTab = g.tabs.find((t) => t.id === g.active) ?? null;
  const node = activeTab?.node ?? null;
  const focused = focusedGid === g.gid;

  return (
    <div
      className={`editor-group ${focused ? 'focused' : ''}`}
      data-gid={g.gid}
      onMouseDownCapture={() => onFocusGroup(g.gid)}
    >
      <GroupTabs g={g} onSelect={onSelect} onCloseTab={onCloseTab} onDragStart={onDragStart} dirtyIds={dirtyIds} />
      <div className="group-content">
        {!node && (
          <EmptyPane
            gid={g.gid}
            onOpenReadme={onOpenReadme}
            onNewDraft={onNewDraft}
            canDragHere
          />
        )}
        {node && node.kind === 'md' && (
          <MarkdownEditor
            node={node}
            content={getContent(activeTab.id)}
            onChange={(text) => setContent(activeTab.id, text)}
          />
        )}
        {node && node.kind === 'preview' && (
          <PreviewView node={node} getContent={getContent} onOpen={(nd) => onOpenFileIn(nd)} />
        )}
        {node && node.kind === 'image' && <ImageView file={node} />}
        {node && node.kind === 'pdf' && <PdfView file={node} />}
        {node && node.kind === 'raw' && (
          <RawView content={getContent(activeTab.id)} onChange={(text) => setContent(activeTab.id, text)} />
        )}
      </div>
      {drop?.gid === g.gid && <DropIndicator zone={drop.zone} />}
    </div>
  );
}

/* ==================== 全局操作按钮列（最右侧，全局唯一） ==================== */
function EditorActionsBar({ tree, focusedGid, onOpenPreview, onSplitTab }) {
  const g = collectOne(tree, focusedGid);
  const activeTab = g?.tabs.find((t) => t.id === g.active) ?? null;
  const node = activeTab?.node ?? null;
  const isMd = node?.kind === 'md';

  return (
    <div className="editor-actions-top" title="编辑器操作">
      {isMd && (
        <button
          className="ea-btn"
          title="打开 Markdown 预览到侧边"
          onClick={() => activeTab && onOpenPreview(focusedGid, activeTab.id, node)}
        >
          <Eye size={14} />
        </button>
      )}
      <button
        className="ea-btn"
        title="向右拆分当前编辑器到新组"
        disabled={!activeTab}
        onClick={() => activeTab && onSplitTab(focusedGid, 'right', activeTab, focusedGid)}
      >
        <span className="tb-split">⧉</span>
      </button>
    </div>
  );
}

/* ==================== 分隔条（调整两个组的大小） ==================== */
function Sash({ sid, dir, ratio, onRatio }) {
  const ref = useRef(null);
  const start = (e) => {
    e.preventDefault();
    const container = ref.current.parentElement;
    const rect = container.getBoundingClientRect();
    const axis = dir === 'row' ? rect.width : rect.height;
    const startPos = dir === 'row' ? e.clientX : e.clientY;
    const startRatio = ratio;
    const move = (ev) => {
      const pos = dir === 'row' ? ev.clientX : ev.clientY;
      const r = Math.min(0.88, Math.max(0.12, startRatio + (pos - startPos) / axis));
      onRatio(sid, r);
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.body.classList.remove('resizing');
    };
    document.body.classList.add('resizing');
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };
  return (
    <div ref={ref} className={`sash sash-${dir}`} onMouseDown={start} title="拖动调整编辑器组大小" />
  );
}

/* ==================== 递归渲染编辑器组树 ==================== */
function Pane({ tree, ...handlers }) {
  if (isGroup(tree)) return <GroupPane g={tree} {...handlers} />;
  if (isSplit(tree)) {
    return (
      <div className={`editor-split split-${tree.dir}`}>
        <div className="split-part" style={{ flex: `${tree.ratio} 1 0px` }}>
          <Pane tree={tree.a} {...handlers} />
        </div>
        <Sash sid={tree.sid} dir={tree.dir} ratio={tree.ratio} onRatio={handlers.onRatio} />
        <div className="split-part" style={{ flex: `${1 - tree.ratio} 1 0px` }}>
          <Pane tree={tree.b} {...handlers} />
        </div>
      </div>
    );
  }
  return null;
}

/* ==================== 编辑器工作区（根） ==================== */
export default function EditorArea({
  tree,
  focusGid,
  dirtyIds,
  getContent,
  setContent,
  isDirty,
  onSelect,
  onCloseTab,
  onMoveTab,
  onSplitTab,
  onCloseGroup,
  onRatio,
  onOpenPreview,
  onFocusGroup,
  onOpenFileIn,
  onOpenReadme,
  onNewDraft,
}) {
  const rootRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [drop, setDrop] = useState(null);

  /* 计算悬停的组与拆分方向 */
  const locateDrop = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const groupEl = el?.closest?.('.editor-group');
    if (!groupEl) {
      if (drop) setDrop(null);
      return;
    }
    const gid = groupEl.dataset.gid;
    const rect = groupEl.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const localY = e.clientY - rect.top;
    const t = 0.14;
    let zone = 'center';
    if (relX < t) zone = 'left';
    else if (relX > 1 - t) zone = 'right';
    else if (localY <= 40) zone = 'center'; // 顶部标签条 -> 移入该组
    else if (relY < t) zone = 'top';
    else if (relY > 1 - t) zone = 'bottom';
    setDrop((prev) => (prev?.gid === gid && prev?.zone === zone ? prev : { gid, zone }));
  };

  const handleDragStart = (e, gid, tab) => {
    setDrag({ gid, tab });
    e.dataTransfer.setData('text/plain', tab.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (drag && drop) {
      if (drop.zone === 'center') onMoveTab(drag.gid, drop.gid, drag.tab.id, drag.tab);
      else onSplitTab(drop.gid, drop.zone, drag.tab, drag.gid);
    }
    setDrag(null);
    setDrop(null);
  };

  const clearDnd = () => {
    setDrag(null);
    setDrop(null);
  };

  const handlers = {
    onSelect,
    onCloseTab,
    onDragStart: handleDragStart,
    dirtyIds,
    drop,
    onOpenFileIn,
    onOpenReadme,
    onNewDraft,
    onFocusGroup,
    getContent,
    setContent,
    onRatio,
  };

  return (
    <div
      ref={rootRef}
      className="editor-workspace"
      onDragOver={(e) => {
        e.preventDefault();
        locateDrop(e);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDrop(null);
      }}
      onDrop={handleDrop}
      onDragEnd={clearDnd}
    >
      {tree ? <Pane tree={tree} {...handlers} focusedGid={focusGid} /> : null}
      <EditorActionsBar
        tree={tree}
        focusedGid={focusGid}
        onOpenPreview={onOpenPreview}
        onSplitTab={onSplitTab}
      />
    </div>
  );
}

function collectOne(tree, gid) {
  if (!tree) return null;
  if (isGroup(tree)) return tree.gid === gid ? tree : null;
  return collectOne(tree.a, gid) || collectOne(tree.b, gid);
}
