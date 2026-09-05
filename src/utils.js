/** 资源 URL 帮助函数：兼容 base 部署路径（如 GitHub Pages 子目录） */
export const baseUrl = import.meta.env.BASE_URL || './';

/** public 目录资源：assetUrl('files/简历.pdf') -> './files/%E7%AE%80%E5%8E%86.pdf' */
export const assetUrl = (p) => `${baseUrl}${String(p)
  .split('/')
  .map(encodeURIComponent)
  .join('/')}`;
