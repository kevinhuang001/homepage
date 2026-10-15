import { marked } from 'marked';
import hljs from 'highlight.js/lib/common';

marked.setOptions({ gfm: true, breaks: false });

const SAFE_TAGS = new Set([
  'a','p','div','span','strong','em','s','del','b','i','u',
  'h1','h2','h3','h4','h5','h6','blockquote','code','pre',
  'ul','ol','li','table','thead','tbody','tr','th','td',
  'hr','br','img','input','sub','sup','details','summary',
]);

const SAFE_ATTRIBUTES = {
  a: new Set(['href','title']),
  img: new Set(['src','alt','title','width','height']),
  input: new Set(['type','checked','disabled']),
  code: new Set(['class']),
  '*': new Set(['aria-label']),
};

function safeUrl(url, kind) {
  const value = String(url || '').trim();
  if (!value || /[\u0000-\u001f]/.test(value)) return false;
  // 禁止 javascript:, data:, vbscript:, file: 和协议相对 URL。
  if (value.startsWith('//')) return false;
  if (/^[a-z][\w+.-]*:/i.test(value)) {
    return kind === 'a'
      ? /^(https?:|mailto:|tel:)/i.test(value)
      : /^https?:/i.test(value);
  }
  return true;
}

/** 在浏览器中消毒 Markdown HTML 后才注入 DOM，避免恶意本地文件执行脚本。 */
export function renderMarkdown(src) {
  const html = marked.parse(src || '');
  if (typeof DOMParser === 'undefined') return html; // 仅浏览器渲染
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const children = Array.from(doc.body.querySelectorAll('*')).reverse();
  for (const el of children) {
    const tag = el.localName;
    if (!SAFE_TAGS.has(tag) || el.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
      if (['script','style','iframe','object','embed','svg','math','form'].includes(tag)) el.remove();
      else el.replaceWith(...Array.from(el.childNodes));
      continue;
    }
    for (const attr of Array.from(el.attributes)) {
      if (!(SAFE_ATTRIBUTES[tag]?.has(attr.name) || SAFE_ATTRIBUTES['*'].has(attr.name))) {
        el.removeAttribute(attr.name);
      }
    }
    if (tag === 'a' && !safeUrl(el.getAttribute('href'), 'a')) el.removeAttribute('href');
    if (tag === 'img' && !safeUrl(el.getAttribute('src'), 'img')) el.removeAttribute('src');
    if (tag === 'input') {
      // Markdown task checkbox can render but cannot run arbitrary behavior.
      if (el.getAttribute('type') !== 'checkbox') el.remove();
      else el.setAttribute('disabled','');
    }
  }
  return doc.body.innerHTML;
}

export function highlightBlocks(container) {
  if (!container) return;
  container.querySelectorAll('pre code').forEach((el) => {
    if (el.dataset.hljs === '1') return;
    try { hljs.highlightElement(el); } catch { /* 不影响阅读 */ }
    el.dataset.hljs = '1';
  });
}
