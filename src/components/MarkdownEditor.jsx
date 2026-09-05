import React, { useMemo, useRef, useState } from 'react';
import { FileTypeIcon } from './icons.jsx';
import MarkdownView from './MarkdownView.jsx';

/**
 * Markdown 文档视图（对照真 VS Code 的 Markdown 分栏预览）：
 *  - 左侧：带行号的源码编辑器（可输入、Tab 缩进）
 *  - 右侧：实时渲染预览，标题显示“预览 <文件名>”，拖动中间分隔条可调宽窄
 *  - 顶栏可切换：仅编辑 / 编辑+预览 / 仅预览
 * 编辑内容只保存在当前页面内存里（模拟保存，不会写入磁盘）。
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function MarkdownEditor({ node, content, onChange, onOpenFile, dirty }) {
  const [mode, setMode] = useState('split'); // edit | split | preview
  const [ratio, setRatio] = useState(0.5); // 编辑区占比
  const splitRef = useRef(null);
  const gutterRef = useRef(null);

  const lineCount = useMemo(() => content.split('\n').length, [content]);
  const lineNums = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

  const editorSizePct = useMemo(() => {
    if (mode === 'edit') return '100%';
    if (mode === 'preview') return '0%';
    return `${Math.round(ratio * 100)}%`;
  }, [mode, ratio]);

  /* 分隔条拖拽（编辑/预览分栏） */
  const startDrag = (e) => {
    e.preventDefault();
    const container = splitRef.current;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startRatio = ratio;
    const move = (ev) => setRatio(clamp(startRatio + (ev.clientX - startX) / rect.width, 0.18, 0.85));
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.body.classList.remove('resizing');
    };
    document.body.classList.add('resizing');
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

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

  const fileLike = useMemo(() => ({ name: node.name, kind: 'md', content }), [node.name, content]);

  return (
    <div className="md-doc">
      <div className="md-toolbar">
        <FileTypeIcon kind="md" size={14} />
        <span className="md-tb-name">{node.name}</span>
        {dirty && (
          <span className="md-tb-dirty" title="内容已修改，仅保存在当前页面，不会写入磁盘">
            ● 未保存（演示）
          </span>
        )}
        <div className="md-tb-spacer" />
        <div className="md-tb-seg">
          <button
            className={mode === 'edit' ? 'active' : ''}
            onClick={() => setMode('edit')}
            title="仅编辑"
          >
            编辑
          </button>
          <button
            className={mode === 'split' ? 'active' : ''}
            onClick={() => setMode('split')}
            title="编辑 + 实时预览（拖动竖线可调宽窄）"
          >
            分栏
          </button>
          <button
            className={mode === 'preview' ? 'active' : ''}
            onClick={() => setMode('preview')}
            title="仅预览"
          >
            预览
          </button>
        </div>
      </div>

      <div className={`md-split mode-${mode}`} ref={splitRef}>
        {mode !== 'preview' && (
          <div className="md-editor-wrap" style={{ width: editorSizePct }}>
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
        )}
        {mode === 'edit' ? null : (
          <>
            {mode === 'split' && (
              <div className="md-divider" onMouseDown={startDrag} title="拖动调整编辑/预览宽度" />
            )}
            <div className="md-preview-wrap">
              <div className="md-preview-head">
                <FileTypeIcon kind="md" size={13} />
                <span>预览 {node.name}</span>
              </div>
              <MarkdownView file={fileLike} onOpen={onOpenFile} scrollKey={node.path || node.uid} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
