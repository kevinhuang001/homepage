import React, { useMemo, useState } from 'react';
import {
  Branch,
  ChevronDown,
  ChevronRight,
  CollapseAll,
  FileTypeIcon,
  FolderClosed,
  FolderOpen,
  More,
  NewFile,
  Refresh,
} from './icons.jsx';
import { ALL_FILES, FILE_TREE, PROFILE } from '../data/vfs.js';

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
            <FileTypeIcon kind={node.kind} size={16} />
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

function Explorer({ onOpen, activePath, onNewDraft }) {
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

  const collapseAll = () => setExpanded(new Set([FILE_TREE.path]));
  const expandAll = () => {
    const set = new Set([FILE_TREE.path]);
    const walk = (node) => {
      if (node.type === 'dir') {
        set.add(node.path);
        node.children.forEach(walk);
      }
    };
    FILE_TREE.children.forEach(walk);
    setExpanded(set);
  };

  return (
    <div className="sb-view">
      <div className="sb-section-head">
        <ChevronDown size={14} />
        <span className="sb-section-title">资源管理器</span>
        <div className="sb-section-actions">
          <button title="新建文件（草稿）" onClick={onNewDraft}>
            <NewFile size={15} />
          </button>
          <button title="刷新（装饰）">
            <Refresh size={15} />
          </button>
          <button title="折叠文件夹" onClick={collapseAll}>
            <CollapseAll size={15} />
          </button>
          <button title="更多操作（装饰）">
            <More size={15} />
          </button>
        </div>
      </div>
      <div className="sb-project">
        <span className="sp-icon">{'{'}</span>
        <span className="sp-name">{PROFILE.repo.toUpperCase()}</span>
      </div>
      <div className="sb-tree">
        {FILE_TREE.children.map((child) => (
          <TreeRow
            key={child.path}
            node={child}
            depth={0}
            expanded={expanded}
            onToggleDir={toggleDir}
            onOpen={onOpen}
            activePath={activePath}
          />
        ))}
      </div>
      <div className="sb-fill" onClick={expandAll} />
    </div>
  );
}

/* ==================== 搜索（装饰但可用：匹配文件名与内容） ==================== */
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
        <div className="sb-section-actions">
          <button title="更多（装饰）">
            <More size={15} />
          </button>
        </div>
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

/* ==================== 源代码管理（装饰视图） ==================== */
function ScmView({ onOpen }) {
  const modified = ALL_FILES.filter((f) => f.kind === 'md');
  const untracked = ALL_FILES.filter((f) => f.kind !== 'md');
  return (
    <div className="sb-view">
      <div className="sb-section-head">
        <ChevronDown size={14} />
        <span className="sb-section-title">源代码管理</span>
        <div className="sb-section-actions">
          <button title="更多（装饰）">
            <More size={15} />
          </button>
        </div>
      </div>
      <div className="sb-branch">
        <Branch size={14} />
        <span>{PROFILE.branch}</span>
        <span className="sb-branch-check">✓</span>
      </div>
      {modified.length > 0 && (
        <>
          <div className="sb-scm-group">
            <span>更改</span>
            <span className="sb-count">{modified.length}</span>
          </div>
          {modified.map((f) => (
            <div key={f.path} className="sb-scm-item" onClick={() => onOpen(f)}>
              <span className="scm-badge M">M</span>
              <span className="scm-name">{f.path.replace(/^\//, '')}</span>
            </div>
          ))}
        </>
      )}
      {untracked.length > 0 && (
        <>
          <div className="sb-scm-group">
            <span>未跟踪的文件</span>
            <span className="sb-count">{untracked.length}</span>
          </div>
          {untracked.map((f) => (
            <div key={f.path} className="sb-scm-item" onClick={() => onOpen(f)}>
              <span className="scm-badge U">U</span>
              <span className="scm-name">{f.path.replace(/^\//, '')}</span>
            </div>
          ))}
        </>
      )}
      <div className="sb-fill" />
    </div>
  );
}

/* ==================== 运行与调试（装饰视图） ==================== */
function RunView() {
  return (
    <div className="sb-view center">
      <div className="sb-center-icon play">▶</div>
      <div className="sb-center-title">运行和调试</div>
      <p className="sb-center-text">从“运行和调试”视图自定义或配置调试程序。（装饰）</p>
      <button className="sb-primary-btn">运行和调试</button>
      <div className="sb-center-link">显示所有自动调试配置</div>
    </div>
  );
}

/* ==================== 扩展（装饰视图） ==================== */
const MOCK_EXT = [
  { name: 'Chinese (Simplified) (简体中文) 语言包', vendor: 'Microsoft', state: '已安装' },
  { name: 'Prettier - Code formatter', vendor: 'Prettier', state: '已安装' },
  { name: 'One Dark Pro', vendor: 'binaryify', state: '已安装' },
  { name: 'Path Intellisense', vendor: 'christian-kohler', state: '已安装' },
  { name: 'Markdown Preview Enhanced', vendor: 'shd101wyy', state: '已安装' },
];

function ExtensionsView() {
  return (
    <div className="sb-view">
      <div className="sb-section-head">
        <ChevronDown size={14} />
        <span className="sb-section-title">扩展</span>
        <div className="sb-section-actions">
          <button title="更多（装饰）">
            <More size={15} />
          </button>
        </div>
      </div>
      <div className="sb-search-box">
        <input placeholder="在 Marketplace 中搜索扩展（装饰）" readOnly tabIndex={-1} />
      </div>
      <div className="sb-ext-head">
        <span>已安装</span>
        <span className="sb-count">{MOCK_EXT.length}</span>
      </div>
      {MOCK_EXT.map((ext) => (
        <div key={ext.name} className="sb-ext" title={`${ext.vendor} · ${ext.name}`}>
          <div className="sb-ext-icon">
            <span>{ext.name[0].toUpperCase()}</span>
          </div>
          <div className="sb-ext-body">
            <div className="sb-ext-name">{ext.name}</div>
            <div className="sb-ext-vendor">{ext.vendor}</div>
          </div>
          <span className="sb-ext-state">已安装</span>
        </div>
      ))}
      <div className="sb-fill" />
    </div>
  );
}

/* ==================== 侧边栏容器 ==================== */
export default function Sidebar({ activity, onOpen, activePath, onNewDraft }) {
  return (
    <div className="sidebar">
      {activity === 'explorer' && <Explorer onOpen={onOpen} activePath={activePath} onNewDraft={onNewDraft} />}
      {activity === 'search' && <SearchView onOpen={onOpen} />}
      {activity === 'scm' && <ScmView onOpen={onOpen} />}
      {activity === 'run' && <RunView />}
      {activity === 'extensions' && <ExtensionsView />}
    </div>
  );
}
