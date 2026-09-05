import React from 'react';
import { Close, FileTypeIcon, More } from './icons.jsx';
import MarkdownView from './MarkdownView.jsx';
import { assetUrl } from '../utils.js';
import { ALL_FILES } from '../data/vfs.js';
import { ChevronRight, FolderClosed } from './icons.jsx';

/* ---------------- PDF 预览 ---------------- */
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

/* ---------------- 标签页 ---------------- */
function TabBar({ tabs, activeId, onSelect, onClose }) {
  return (
    <div className="tabbar">
      <div className="tabbar-tabs">
        {tabs.map(({ id, node }) => (
          <div
            key={id}
            className={`editor-tab ${id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(id)}
            onAuxClick={(e) => {
              if (e.button === 1) onClose(id);
            }}
            title={node.path ? node.path.replace(/^\//, '') : node.name}
          >
            <FileTypeIcon kind={node.kind} size={14} />
            <span className="tab-name">{node.name}</span>
            {node.draft && <span className="tab-dot" title="草稿" />}
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(id);
              }}
              title="关闭 (Ctrl+W)"
            >
              <Close size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="tabbar-actions">
        <button title="拆分编辑器（装饰）" className="tb-btn">
          <span className="tb-split">⧉</span>
        </button>
        <button title="更多操作（装饰）" className="tb-btn">
          <More size={14} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- 面包屑 ---------------- */
function Breadcrumbs({ node }) {
  if (!node) return <div className="breadcrumbs empty" />;
  const segs = node.path
    ? node.path.replace(/^\//, '').split('/')
    : [node.name];
  return (
    <div className="breadcrumbs">
      <FolderClosed size={13} color="#8a8a8a" />
      {segs.map((seg, i) => (
        <React.Fragment key={`${seg}-${i}`}>
          {i > 0 && <ChevronRight size={12} />}
          <span className={i === segs.length - 1 ? 'bc-current' : 'bc-seg'}>{seg}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------------- 空编辑器 ---------------- */
function EmptyEditor({ onOpen, onNewDraft }) {
  const readme = ALL_FILES.find((f) => f.name === 'README.md');
  return (
    <div className="empty-editor">
      <div className="ee-card">
        <div className="ee-logo">&lt;/&gt;</div>
        <h1 className="ee-title">个人主页</h1>
        <p className="ee-sub">
          没有打开的文件 —— 从左侧文件树挑选一个文件，像使用编辑器一样浏览我的资料吧。
        </p>
        <div className="ee-actions">
          {readme && (
            <button className="ee-btn primary" onClick={() => onOpen(readme)}>
              打开 README.md
            </button>
          )}
          <button className="ee-btn" onClick={onNewDraft}>
            新建草稿
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 编辑器区 ---------------- */
export default function EditorArea({ tabs, activeId, onSelect, onClose, onOpen, onNewDraft }) {
  const activeTab = tabs.find((t) => t.id === activeId);
  const node = activeTab?.node || null;

  return (
    <div className="editor-area">
      <TabBar tabs={tabs} activeId={activeId} onSelect={onSelect} onClose={onClose} />
      <Breadcrumbs node={node} />
      <div className="editor-content">
        {!node && <EmptyEditor onOpen={onOpen} onNewDraft={onNewDraft} />}
        {node && node.kind === 'md' && <MarkdownView file={node} onOpen={onOpen} />}
        {node && node.kind === 'pdf' && <PdfView file={node} />}
        {node && node.kind === 'raw' && (
          <pre className="raw-view">{node.content}</pre>
        )}
      </div>
    </div>
  );
}
