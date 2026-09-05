import { marked } from 'marked';
import hljs from 'highlight.js/lib/common';

marked.setOptions({
  gfm: true,
  breaks: false,
  mangle: false,
  headerIds: true,
});

/** Markdown -> HTML 字符串 */
export function renderMarkdown(src) {
  return marked.parse(src || '');
}

/** 对已经渲染进 DOM 的代码块做语法高亮 */
export function highlightBlocks(container) {
  if (!container) return;
  container.querySelectorAll('pre code').forEach((el) => {
    if (el.dataset.hljs === '1') return;
    try {
      hljs.highlightElement(el);
    } catch {
      /* 高亮失败不影响阅读 */
    }
    el.dataset.hljs = '1';
  });
}
