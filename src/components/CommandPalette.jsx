import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileTypeIcon } from './icons.jsx';
import { ALL_FILES } from '../data/vfs.js';

const ZapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M9.6 1.2 3.4 9.4h3.2L5.4 15l7.2-8.6H9.2z" fill="currentColor" />
  </svg>
);

const COMMANDS = [
  { label: '打开 README.md', run: 'openReadme' },
  { label: '保存当前文件（演示 · 不写盘）', run: 'save' },
  { label: '新建草稿文件', run: 'newDraft' },
  { label: '打开本地文件…', run: 'openLocal' },
  { label: '切换终端面板', run: 'togglePanel' },
  { label: '切换侧边栏', run: 'toggleSidebar' },
  { label: '转到搜索视图', run: 'focusSearch' },
  { label: '关闭所有编辑器', run: 'closeAll' },
  { label: '关于 / 使用说明', run: 'showAbout' },
];

/** 仿 VS Code 命令面板：输入文件名或命令 */
export default function CommandPalette({ onClose, actions }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const files = ALL_FILES.map((node) => ({
      type: 'file',
      node,
      label: node.path.replace(/^\//, ''),
      key: node.path,
    }));
    const cmds = COMMANDS.map((c) => ({
      type: 'cmd',
      run: c.run,
      label: c.label,
      key: `cmd:${c.label}`,
    }));
    const all = [...cmds, ...files];
    if (!q) return all;
    return all.filter((e) => e.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, entries.length - 1)));
  }, [entries.length]);

  const execute = (entry) => {
    onClose();
    if (entry.type === 'file') actions.openNode(entry.node);
    else if (actions[entry.run]) actions[entry.run]();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => (i + 1) % Math.max(entries.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => (i - 1 + entries.length) % Math.max(entries.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (entries[index]) execute(entries[index]);
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette">
        <div className="palette-input-row">
          <span className="palette-chevron">&gt;</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="输入文件名或命令名称，例如：关于我 / 技能"
            spellCheck={false}
          />
        </div>
        <div className="palette-list">
          {entries.length === 0 && <div className="palette-empty">没有匹配项：{query}</div>}
          {entries.map((entry, i) => (
            <div
              key={entry.key}
              className={`palette-item ${i === index ? 'active' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => execute(entry)}
            >
              {entry.type === 'file' ? (
                <FileTypeIcon kind={entry.node.kind} size={15} />
              ) : (
                <span className="pi-zap">
                  <ZapIcon />
                </span>
              )}
              <span className="pi-label">{entry.label}</span>
              {entry.type === 'file' && <span className="pi-kind">{entry.node.language}</span>}
            </div>
          ))}
        </div>
        <div className="palette-footer">
          <span>↑↓ 选择 · Enter 打开</span>
          <span className="palette-hint">个人主页的命令面板（仿）</span>
        </div>
      </div>
    </div>
  );
}
