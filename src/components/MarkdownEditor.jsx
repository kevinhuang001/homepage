import React, { useMemo, useRef } from 'react';

/**
 * Markdown 源码编辑器（只读预览另开「Preview <文件名>」独立标签）。
 * 带行号、Tab 缩进。编辑内容只保存在当前页面内存里（模拟保存，不会写入磁盘）。
 */
export default function MarkdownEditor({ node, content, onChange }) {
  const gutterRef = useRef(null);

  const lineCount = useMemo(() => content.split('\n').length, [content]);
  const lineNums = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

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

  /* 行号与源码同步滚动 */
  const onScroll = (e) => {
    const g = gutterRef.current;
    if (g) g.style.transform = `translateY(${-e.currentTarget.scrollTop}px)`;
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
  );
}
