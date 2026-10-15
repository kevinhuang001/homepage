/**
 * 浏览器本地的显式保存区。保存的数据属于当前浏览器/域名，而不是 Git 仓库。
 * 读写异常（禁用存储、隐私模式或配额不足）都不会使页面崩溃。
 */
export const STORAGE_KEY = 'vscode-homepage.saved.v1';

export function readSavedDocs(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return new Map();
    return new Map(Object.entries(value).filter(([key, text]) => key.startsWith('/') && typeof text === 'string'));
  } catch {
    return new Map();
  }
}

export function writeSavedDocs(documents, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(documents)));
    return true;
  } catch {
    return false;
  }
}
