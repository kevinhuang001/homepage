import React, { useMemo, useRef, useState } from 'react';
import hljs from 'highlight.js/lib/common';

/**
 * Markdown 源码编辑器（带语法高亮）。
 * 原理：textarea 文字设为透明、光标可见，背后叠一层同字体的 <pre> 高亮渲染；
 * 输入/选择/滚动都在 textarea 上，滚动时同步背后高亮层与行号 gutter。
 * 编辑内容只保存在当前页面内存里（模拟保存，不会写入磁盘）。
 */
export default function MarkdownEditor({ node, content, onChange }) {
  const gutterRef = useRef(null);
  const hlRef = useRef(null);
  const inputRef = useRef(null);
  const findRef = useRef(null);
  const [findOpen, setFindOpen] = useState(false);
  const [search, setSearch] = useState('');

  const lineCount = useMemo(() => content.split('\n').length, [content]);
  const lineNums = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

  const hlHtml = useMemo(() => {
    try {
      return hljs.highlight(content, { language: 'markdown', ignoreIllegals: true }).value;
    } catch {
      return '';
    }
  }, [content]);

  const jumpToMatch = (direction = 1) => {
    const textarea = inputRef.current;
    const needle = search.toLocaleLowerCase();
    if (!textarea || !needle) return;
    const text = content.toLocaleLowerCase();
    const pivot = direction > 0 ? textarea.selectionEnd : textarea.selectionStart;
    let at = direction > 0 ? text.indexOf(needle, pivot) : text.lastIndexOf(needle, pivot - 1);
    if (at < 0) at = direction > 0 ? text.indexOf(needle) : text.lastIndexOf(needle);
    if (at < 0) return;
    textarea.focus();
    textarea.setSelectionRange(at, at + search.length);
    // 文本框负责真实光标、选择和滚动，避免与高亮层错位。
  };

  /* Tab 键插入两个空格 */
  const onEditorKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setFindOpen(true);
      requestAnimationFrame(() => findRef.current?.focus());
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.setRangeText('  ', start, end, 'end');
      onChange(ta.value);
    }
  };

  /* 滚动同步：行号 + 背后高亮层 */
  const onScroll = (e) => {
    const el = e.currentTarget;
    if (gutterRef.current) gutterRef.current.style.transform = `translateY(${-el.scrollTop}px)`;
    if (hlRef.current) hlRef.current.style.transform = `translate(${-el.scrollLeft}px, ${-el.scrollTop}px)`;
  };

  return (
    <div className="md-doc">
      {findOpen && (
        <div className="md-findbar" role="search" aria-label="在当前文件中查找">
          <input
            ref={findRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setFindOpen(false);
                inputRef.current?.focus();
              } else if (event.key === 'Enter') {
                event.preventDefault();
                jumpToMatch(event.shiftKey ? -1 : 1);
              }
            }}
            placeholder="在当前文件中查找"
            aria-label="查找内容"
          />
          <button title="上一个匹配" onClick={() => jumpToMatch(-1)}>↑</button>
          <button title="下一个匹配" onClick={() => jumpToMatch(1)}>↓</button>
          <button title="关闭查找" onClick={() => { setFindOpen(false); inputRef.current?.focus(); }}>×</button>
        </div>
      )}
      <div className="md-editor-wrap source-only">
        <div className="md-gutter" aria-hidden="true">
          <div className="md-gutter-inner" ref={gutterRef}>
            {lineNums.map((n) => (
              <div key={n} className="ln">
                {n}
              </div>
            ))}
          </div>
        </div>
        <div className="md-source-box">
          <div className="md-source-hl" aria-hidden="true">
            <div className="md-source-hl-inner" ref={hlRef}>
              <code className="hljs" dangerouslySetInnerHTML={{ __html: hlHtml }} />
            </div>
          </div>
          <textarea
            ref={inputRef}
            className="md-source"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onEditorKeyDown}
            onScroll={onScroll}
            spellCheck={false}
            wrap="off"
            aria-label={`${node.name} 编辑器`}
          />
        </div>
      </div>
    </div>
  );
}
