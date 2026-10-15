/**
 * 由配置文件生成虚拟工作区。
 * 站点拥有者只需编辑 src/config/site.js 和 src/content/，无需改动此文件。
 */
import { SITE } from '../config/site.js';

// 自动发现 Markdown 文件，无需手动维护 import 声明。
const markdownSources = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const PROFILE = SITE.profile;
export const ROOT_NAME = PROFILE.repo;

function buildEntry(entry) {
  if (entry.folder) {
    if (!Array.isArray(entry.children)) throw new Error(`文件夹 ${entry.folder} 缺少 children 数组`);
    return { type: 'dir', name: entry.folder, children: entry.children.map(buildEntry) };
  }
  if (entry.file) {
    const key = `../content/${entry.file}`;
    if (!(key in markdownSources)) throw new Error(`配置的内容文件不存在：src/content/${entry.file}`);
    return {
      type: 'file', name: entry.as || entry.file.split('/').at(-1),
      kind: 'md', language: 'Markdown', content: markdownSources[key],
    };
  }
  if (entry.asset) {
    if (!['pdf', 'image'].includes(entry.kind)) throw new Error(`资源 ${entry.asset} 的 kind 必须是 pdf 或 image`);
    return {
      type: 'file', name: entry.as || entry.asset.split('/').at(-1),
      kind: entry.kind, language: entry.kind === 'pdf' ? 'PDF' : 'Image',
      asset: entry.asset,
    };
  }
  throw new Error('workspace 项必须指定 folder、file 或 asset');
}

export const FILE_TREE = {
  type: 'dir',
  name: ROOT_NAME,
  children: SITE.workspace.map(buildEntry),
};

/** 为节点补齐 path，并拍平文件清单，供快速打开、搜索、终端使用。 */
export function flattenFiles(root) {
  const result = [];
  const walk = (node, parent = '') => {
    node.path = `${parent}/${node.name}`;
    if (node.type === 'dir') node.children.forEach((child) => walk(child, node.path));
    else result.push(node);
  };
  walk(root);
  return result;
}

export const ALL_FILES = flattenFiles(FILE_TREE);
export const fileLabel = (node) => node.path.replace(/^//, '');
export const fileExt = (node) => node.name.split('.').at(-1).toLowerCase();

/** 既支持完整虚拟路径，也支持相对于工作区根目录的链接。 */
export function byPath(path) {
  let decoded = String(path).replace(/^\.?\//, '');
  try { decoded = decodeURIComponent(decoded); } catch { /* 保留原值 */ }
  const prefix = `${ROOT_NAME}/`;
  if (!decoded.startsWith(prefix)) decoded = prefix + decoded;
  return ALL_FILES.find((file) => file.path === `/${decoded}`);
}
