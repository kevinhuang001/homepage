import React, { useMemo, useRef, useState } from 'react';
import { FileTypeIcon } from './icons.jsx';
import MarkdownView from './MarkdownView.jsx';

/**
 * Markdown 文档视图：
 *  - 左侧：真正的文本编辑区（可输入、Tab 缩进）
 *  - 右侧：实时 Markdown 预览（拖动中间分隔条可调宽窄）
 *  - 顶栏可切换：仅编辑 / 编辑+预览 / 仅预览
 * 编辑内容只保存在当前页面内存里（模拟保存，不会写入磁盘）。
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function MarkdownEditor({ node, content, onChange, onOpenFile, dirty }) {
  const [mode, setMode] = useState('split'); // edit | split | preview
  const [ratio, setRatio] = useState(0.5); // 编辑区占比
  const splitRef = useRef(null);
  const taRef = useRef(null);

  const editorSizePct = useMemo(() => {
    if (mode === 'edit') return '100%';
    if (mode === 'preview') return '0%';
    return `${Math.round(ratio * 100)}%`;
  }, [mode, ratio]);

  /* 分隔条拖拽（内部编辑/预览分栏） */
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
          <textarea
            ref={taRef}
            className="md-source"
            style={{ width: editorSizePct }}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onEditorKeyDown}
            spellCheck={false}
            wrap="off"
            aria-label={`${node.name} 编辑器`}
          />
        )}
        {mode === 'edit' ? null : (
          <>
            {mode === 'split' && <div className="md-divider" onMouseDown={startDrag} title="拖动调整编辑/预览宽度" />}
            <div className="md-preview-wrap">
              <MarkdownView file={fileLike} onOpen={onOpenFile} scrollKey={node.path || node.uid} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
