import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileTypeIcon,
  FolderClosed,
  FolderOpen,
} from './icons.jsx';
import { ALL_FILES, FILE_TREE } from '../data/vfs.js';

/* ==================== 文件树 ==================== */
function TreeRow({ node, depth, expanded, onToggleDir, onOpen, activePath }) {
  const isDir = node.type === 'dir';
  const isOpen = isDir && expanded.has(node.path);
  const selected = !isDir && node.path === activePath;

  return (
    <div>
      <div
        className={`tree-row ${selected ? 'selected' : ''}`}
        style={{ paddingLeft: 8 + depth * 11 }}
        title={isDir ? undefined : node.path.replace(/^\//, '')}
        onClick={() => (isDir ? onToggleDir(node) : onOpen(node))}
      >
        {isDir ? (
          <>
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {isOpen ? <FolderOpen size={16} /> : <FolderClosed size={16} />}
          </>
        ) : (
          <>
            <span className="tree-guide" />
            <span className="tree-file-gap" />
          </>
        )}
        <span className="tree-name">{node.name}</span>
      </div>
      {isDir &&
        isOpen &&
        node.children.map((child) => (
          <TreeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggleDir={onToggleDir}
            onOpen={onOpen}
            activePath={activePath}
          />
        ))}
    </div>
  );
}

function Explorer({ onOpen, activePath }) {
  const [expanded, setExpanded] = useState(() => {
    const set = new Set([FILE_TREE.path]);
    FILE_TREE.children
      .filter((c) => c.type === 'dir')
      .forEach((c) => set.add(c.path));
    return set;
  });

  const toggleDir = (node) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(node.path)) next.delete(node.path);
      else next.add(node.path);
      return next;
    });

  return (
    <div className="sb-view">
      <div className="sb-section-head">
        <ChevronDown size={14} />
        <span className="sb-section-title">资源管理器</span>
      </div>
      <div className="sb-tree">
        <TreeRow
          node={FILE_TREE}
          depth={0}
          expanded={expanded}
          onToggleDir={toggleDir}
          onOpen={onOpen}
          activePath={activePath}
        />
      </div>
      <div className="sb-fill" />
    </div>
  );
}

/* ==================== 搜索（匹配文件名与内容） ==================== */
function SearchView({ onOpen }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (const f of ALL_FILES) {
      const hay = (f.name + '\n' + (f.content || '')).toLowerCase();
      if (!hay.includes(q)) continue;
      const lines = (f.content || '').split('\n');
      let snippet = '';
      for (const line of lines) {
        if (line.toLowerCase().includes(q)) {
          snippet = line.trim().slice(0, 90) || '（内容为空）';
          break;
        }
      }
      out.push({ file: f, snippet });
    }
    return out.slice(0, 60);
  }, [query]);

  return (
    <div className="sb-view">
      <div className="sb-section-head">
        <ChevronDown size={14} />
        <span className="sb-section-title">搜索</span>
      </div>
      <div className="sb-search-box">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索文件与内容"
        />
      </div>
      {query.trim() ? (
        <div className="sb-results">
          <div className="sb-results-count">{results.length} 个结果</div>
          {results.map(({ file, snippet }) => (
            <div key={file.path} className="sb-result" onClick={() => onOpen(file)}>
              <FileTypeIcon kind={file.kind} size={14} />
              <div className="sr-body">
                <div className="sr-name">{file.path.replace(/^\//, '')}</div>
                <div className="sr-snippet">{snippet}</div>
              </div>
            </div>
          ))}
          {results.length === 0 && <div className="sb-empty">没有找到与“{query}”相关的内容</div>}
        </div>
      ) : (
        <div className="sb-empty">
          你可以试试输入：<br />
          “项目”“技能”“联系”等关键词
        </div>
      )}
    </div>
  );
}

/* ==================== 侧边栏容器 ==================== */
export default function Sidebar({ activity, onOpen, activePath }) {
  return (
    <div className="sidebar">
      {activity === 'explorer' && <Explorer onOpen={onOpen} activePath={activePath} />}
      {activity === 'search' && <SearchView onOpen={onOpen} />}
    </div>
  );
}
