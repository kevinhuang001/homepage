import React, { useEffect, useRef, useState } from 'react';
import { Close, More } from './icons.jsx';
import { ALL_FILES, PROFILE } from '../data/vfs.js';
import { runTerminalCommand } from '../data/terminal.js';

const PANEL_TABS = [
  { id: 'terminal', label: '终端' },
  { id: 'problems', label: '问题' },
  { id: 'output', label: '输出' },
];

const WELCOME = [
  { text: '主页迷你终端 —— 输入 help 查看命令。命令在 src/data/terminal.js 里自定义（支持简单 JS）。' },
  { text: '' },
];

const OUTPUT_LINES = [
  { dim: true, text: '[主页] 用于展示的示例输出面板' },
  { text: 'vite v6.3.5 dev server running at:' },
  { text: '➜  Local:   http://localhost:5173/' },
  { text: '➜  ready in 431 ms.' },
  { text: '' },
  { dim: true, text: '[主页] 点击上方“终端”标签试试迷你命令吧' },
];

function TerminalPane({ onOpen }) {
  const [lines, setLines] = useState(WELCOME);
  const [value, setValue] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const submit = (e) => {
    e.preventDefault();
    const text = value;
    setValue('');
    setLines((prev) => {
      const next = [...prev, { text: `PS C:\\Users\\Kevin\\homepage> ${text}` }];
      const out = runTerminalCommand(text, { open: onOpen, files: ALL_FILES, profile: PROFILE });
      if (out.clear) return [];
      return [...next, ...out.lines];
    });
  };

  return (
    <div className="term-body" onClick={() => inputRef.current?.focus()}>
      {lines.map((l, i) => (
        <div key={i} className={`term-line ${l.dim ? 'dim' : ''}`}>
          {l.text || '\u00a0'}
        </div>
      ))}
      <form className="term-line term-inputline" onSubmit={submit}>
        <span className="term-prompt">PS C:\Users\Kevin\homepage&gt;</span>
        <input
          ref={inputRef}
          className="term-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoFocus
        />
      </form>
      <div ref={endRef} />
    </div>
  );
}

function ProblemsPane() {
  return (
    <div className="panel-pane center">
      <span className="panel-ok">✓</span>
      <span>0 个问题（错误 0 · 警告 0）—— 一切正常，如同人生 ✨</span>
    </div>
  );
}

export default function BottomPanel({ open, tab, height = 200, setOpen, setTab, onOpen }) {
  if (!open) return null;
  return (
    <div className="bottom-panel" style={{ height }}>
      <div className="panel-head">
        {PANEL_TABS.map((t) => (
          <button
            key={t.id}
            className={`panel-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'problems' && <span className="panel-badge" />}
          </button>
        ))}
        <div className="panel-actions">
          <button title="面板更多操作（装饰）" className="tb-btn">
            <More size={13} />
          </button>
          <button title="关闭面板" className="tb-btn" onClick={() => setOpen(false)}>
            <Close size={13} />
          </button>
        </div>
      </div>
      <div className="panel-body">
        {tab === 'terminal' && <TerminalPane onOpen={onOpen} />}
        {tab === 'problems' && <ProblemsPane />}
        {tab === 'output' && (
          <div className="panel-pane">
            {OUTPUT_LINES.map((l, i) => (
              <div key={i} className={`term-line ${l.dim ? 'dim' : ''}`}>
                {l.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
