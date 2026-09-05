import React, { useEffect, useMemo, useRef } from 'react';
import { renderMarkdown, highlightBlocks } from '../lib/markdown.js';
import { byPath } from '../data/vfs.js';
import { assetUrl } from '../utils.js';

/**
 * Markdown 预览（只读）。样式上贴近 VS Code 内置 Markdown 预览。
 * - 渲染后做代码高亮；
 * - 站内相对链接（如 个人信息/关于我.md）点击后直接打开对应文件；
 * - 外链自动新窗口打开。
 */
export default function MarkdownView({ file, onOpen }) {
  const outerRef = useRef(null);
  const bodyRef = useRef(null);

  const html = useMemo(() => renderMarkdown(file.content), [file.content]);

  // 切换文件时回到顶部
  useEffect(() => {
    outerRef.current?.scrollTo({ top: 0 });
  }, [file]);

  // 代码高亮 + 链接处理
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return undefined;
    highlightBlocks(root);

    root.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:)/i.test(href)) {
        a.target = '_blank';
        a.rel = 'noreferrer';
      } else if (href && !href.startsWith('#')) {
        a.classList.add('internal-link');
      }
    });
    // 站内图片：/files/... -> 相对 base 路径，保证子目录部署也能显示
    root.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('/files/')) img.setAttribute('src', assetUrl(src.slice(1)));
    });

    const onClick = (e) => {
      const a = e.target.closest?.('a.internal-link');
      if (!a) return;
      e.preventDefault();
      const href = a.getAttribute('href') || '';
      const node = byPath(`/${href.replace(/^\.?\//, '')}`);
      if (node) onOpen(node);
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [html, onOpen]);

  return (
    <div className="md-scroll" ref={outerRef}>
      <div
        ref={bodyRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
