/**
 * 虚拟文件系统 —— 左侧文件树的唯一数据来源。
 *
 * 想修改主页内容？
 *   1. Markdown 内容直接编辑 src/content/*.md（实时生效）；
 *   2. 要新增/删除/改名文件，改下面的 FILE_TREE；
 *   3. 简历 PDF 直接覆盖 public/files/简历.pdf（文件名保持不变即可）。
 */
import readmeRaw from '../content/readme.md?raw';
import aboutRaw from '../content/关于我.md?raw';
import skillsRaw from '../content/技能特长.md?raw';
import contactRaw from '../content/联系方式.md?raw';
import projectsRaw from '../content/项目经历.md?raw';
import educationRaw from '../content/教育背景.md?raw';
import terminalSpecRaw from '../content/终端命令.md?raw';

/** 站主信息（状态栏头像、菜单等处会用到，记得替换） */
export const PROFILE = {
  name: '张三',
  initials: '张',
  role: '前端开发工程师',
  city: '杭州',
  repo: 'homepage',
  branch: 'main',
};

export const ROOT_NAME = PROFILE.repo;

const md = (name, content, language = 'Markdown') => ({
  type: 'file',
  name,
  kind: 'md',
  language,
  content,
});

const pdf = (name, asset) => ({
  type: 'file',
  name,
  kind: 'pdf',
  language: 'PDF',
  asset, // public 目录下的资源路径
});

const image = (name, asset) => ({
  type: 'file',
  name,
  kind: 'image',
  language: 'Image',
  asset,
});

const dir = (name, children) => ({ type: 'dir', name, children });

/** 文件树结构（文件夹排前、README 置顶，视觉上更像真实项目） */
export const FILE_TREE = dir(ROOT_NAME, [
  md('README.md', readmeRaw),
  md('终端命令.md', terminalSpecRaw),
  dir('个人信息', [
    md('关于我.md', aboutRaw),
    md('技能特长.md', skillsRaw),
    md('联系方式.md', contactRaw),
  ]),
  dir('经历与作品', [
    md('项目经历.md', projectsRaw),
    md('教育背景.md', educationRaw),
  ]),
  pdf('简历.pdf', 'files/简历.pdf'),
  image('示例图片.svg', 'files/示例图片.svg'),
]);

/** 给每个节点补齐 path，并拍平出所有文件（供标签页 / 命令面板 / 搜索使用） */
export function flattenFiles(root) {
  const files = [];
  const walk = (node, parentPath) => {
    const path = parentPath ? `${parentPath}/${node.name}` : `/${node.name}`;
    node.path = path;
    if (node.type === 'dir') {
      node.children.forEach((child) => walk(child, path));
    } else {
      files.push(node);
    }
  };
  walk(root, '');
  return files;
}

export const ALL_FILES = flattenFiles(FILE_TREE);

/** 浏览器打开文件时需要完整路径：/README.md 或 /个人信息/关于我.md */
export const fileLabel = (node) => node.path.replace(/^\//, '');

export const fileExt = (node) => {
  const i = node.name.lastIndexOf('.');
  return i >= 0 ? node.name.slice(i + 1).toLowerCase() : '';
};

export const byPath = (path) => ALL_FILES.find((f) => f.path === path);
