import React, { useEffect, useRef, useState } from 'react';
import { Close, More } from './icons.jsx';
import { ALL_FILES, PROFILE } from '../data/vfs.js';

const PANEL_TABS = [
  { id: 'terminal', label: '终端' },
  { id: 'problems', label: '问题' },
  { id: 'output', label: '输出' },
  { id: 'debug', label: '调试控制台' },
];

const WELCOME = [
  { text: '主页终端（装饰）—— 一个仅供玩乐的迷你命令解释器。输入 help 查看可用命令。' },
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

const DEBUG_LINES = [
  { dim: true, text: '调试控制台（装饰）：' },
  { text: '已连接“主页”。此页面并非真正的 VS Code。' },
  { text: '可尝试的交互：文件树 / 标签页 / 命令面板 / 底部终端。' },
];

function runCommand(input, ctx) {
  const { onOpen } = ctx;
  const cmd = input.trim();
  if (!cmd) return [{ text: '' }];
  const [head, ...rest] = cmd.split(/\s+/);
  const arg = rest.join(' ').trim();

  switch (head.toLowerCase()) {
    case 'help':
      return [
        { dim: true, text: '可用命令：' },
        { text: '  help           显示本帮助' },
        { text: '  ls             列出项目根目录内容' },
        { text: '  open <文件>    打开左侧文件树中的文件' },
        { text: '  skills         查看技能简介' },
        { text: '  contact        查看联系方式' },
        { text: '  whoami         我是谁' },
        { text: '  date           现在几点' },
        { text: '  echo <内容>    复读机' },
        { text: '  clear          清屏' },
      ];
    case 'ls':
      return [
        { text: '目录：C:\\Users\\Kevin\\homepage（模拟）' },
        ...ALL_FILES.map((f) => ({ text: `  ${f.path.replace(/^\//, '')}`, dim: f.kind !== 'md' })),
      ];
    case 'open': {
      if (!arg) return [{ text: '用法：open <文件名>，例如 open 关于我.md' }];
      const hit = ALL_FILES.find(
        (f) => f.name === arg || f.name.includes(arg) || f.path.replace(/^\//, '').includes(arg),
      );
      if (!hit) return [{ text: `找不到文件：${arg}（可用 ls 查看）` }];
      onOpen(hit);
      return [{ text: `已打开：${hit.path.replace(/^\//, '')}` }];
    }
    case 'skills':
      return [
        { text: '张三 · 前端开发工程师' },
        { dim: true, text: '擅长：JavaScript/TypeScript、React、CSS 动画、工程化。更多请打开 技能特长.md' },
      ];
    case 'contact':
      return [{ text: '联系方式在 个人信息/联系方式.md 里，或直接问我 😄' }];
    case 'whoami':
      return [{ text: `${PROFILE.name}@${PROFILE.repo}` }, { dim: true, text: '前端开发工程师 · 坐标杭州' }];
    case 'date':
      return [{ text: new Date().toLocaleString('zh-CN', { hour12: false }) }];
    case 'echo':
      return [{ text: arg || '（空）' }];
    case 'clear':
      return { clear: true };
    default:
      return [
        {
          text: `${head} : 无法将“${head}”项识别为 cmdlet、函数、脚本文件或可运行程序的名称。`,
          dim: true,
        },
        { text: '输入 help 查看可用命令。' },
      ];
  }
}

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
      const out = runCommand(text, { onOpen });
      if (out.clear) return [];
      return [...next, ...out];
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

export default function BottomPanel({ open, tab, setOpen, setTab, onOpen }) {
  if (!open) return null;
  return (
    <div className="bottom-panel">
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
        {tab === 'debug' && (
          <div className="panel-pane">
            {DEBUG_LINES.map((l, i) => (
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
