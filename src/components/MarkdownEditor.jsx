import React, { useMemo, useRef } from 'react';
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

  const lineCount = useMemo(() => content.split('\n').length, [content]);
  const lineNums = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

  const hlHtml = useMemo(() => {
    try {
      return hljs.highlight(content, { language: 'markdown', ignoreIllegals: true }).value;
    } catch {
      return '';
    }
  }, [content]);

  /* Tab 键插入两个空格 */
  const onEditorKeyDown = (e) => {
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
