/**
 * 编辑器组树 —— 纯函数集合。
 *
 * 树节点有两种：
 *   { kind:'group', gid, tabs:[{id,node}], active }   一个编辑器组（一组标签页）
 *   { kind:'split', sid, dir:'row'|'col', ratio, a, b } 把 a/b 两个子树并排/上下分割
 *
 * 约定：
 *   - 同一标签（id）在同一组内最多出现一次；不同组可以各开一个（同文档双开）
 *   - 空组只允许作为整棵树的根节点存在（此时显示空编辑器欢迎页）
 *   - 所有“删除导致空组”的操作末尾都会调用 pruneEmpty 收拢树
 */

const uid = () => Math.random().toString(36).slice(2, 10);

export const makeGroup = (tabs = [], active = null) => ({
  kind: 'group',
  gid: uid(),
  tabs,
  active,
});

export const makeSplit = (dir, a, b, ratio = 0.5) => ({
  kind: 'split',
  sid: uid(),
  dir,
  ratio,
  a,
  b,
});

export const isGroup = (n) => n?.kind === 'group';
export const isSplit = (n) => n?.kind === 'split';

export const collectGroups = (n, out = []) => {
  if (!n) return out;
  if (isGroup(n)) out.push(n);
  else {
    collectGroups(n.a, out);
    collectGroups(n.b, out);
  }
  return out;
};

export const findGroup = (n, gid) => {
  if (!n || isGroup(n)) return n?.gid === gid ? n : null;
  return findGroup(n.a, gid) || findGroup(n.b, gid);
};

/** 找到某棵树，按 gid 替换该组（fn 返回新节点，可为 split） */
export const updateGroup = (n, gid, fn) => {
  if (!n) return n;
  if (isGroup(n)) return n.gid === gid ? fn(n) : n;
  const a = updateGroup(n.a, gid, fn);
  const b = updateGroup(n.b, gid, fn);
  if (a === n.a && b === n.b) return n;
  return { ...n, a, b };
};

/** VS Code 行为：关闭当前标签时，优先选择右侧邻居，否则选择左侧。 */
const activeAfterRemove = (before, after, prevActive, removedId) => {
  if (prevActive !== removedId) return prevActive;
  if (after.length === 0) return null;
  const originalIndex = before.findIndex((tab) => tab.id === removedId);
  return after[Math.min(originalIndex, after.length - 1)].id;
};

/** 在 gid 组内打开标签（同组已有则仅激活） */
export const openTab = (n, gid, tab) =>
  updateGroup(n, gid, (g) =>
    g.tabs.some((t) => t.id === tab.id)
      ? { ...g, active: tab.id }
      : { ...g, tabs: [...g.tabs, tab], active: tab.id },
  );

export const selectTab = (n, gid, tabId) =>
  updateGroup(n, gid, (g) => (
    g.active === tabId || !g.tabs.some((tab) => tab.id === tabId)
      ? g
      : { ...g, active: tabId }
  ));

/** 关闭组内某标签（可越界 id，未找到原样返回）。随后收拢空组。 */
export const closeTab = (n, gid, tabId) => {
  const next = updateGroup(n, gid, (g) => {
    if (!g.tabs.some((t) => t.id === tabId)) return g;
    const tabs = g.tabs.filter((t) => t.id !== tabId);
    return { ...g, tabs, active: activeAfterRemove(g.tabs, tabs, g.active, tabId) };
  });
  return pruneEmpty(next);
};

/** 把标签从 fromGid 移到 toGid（同组时视为仅激活） */
export const moveTabInto = (n, fromGid, toGid, tabId) => {
  if (fromGid === toGid) return selectTab(n, toGid, tabId);
  if (!findGroup(n, toGid)) return n;
  const src = findGroup(n, fromGid);
  const tab = src?.tabs.find((t) => t.id === tabId);
  if (!tab) return n;
  const removed = updateGroup(n, fromGid, (g) => {
    const tabs = g.tabs.filter((t) => t.id !== tabId);
    return { ...g, tabs, active: activeAfterRemove(g.tabs, tabs, g.active, tabId) };
  });
  const opened = openTab(removed, toGid, tab);
  return pruneEmpty(opened);
};

/**
 * 在 hoverGid 处沿 dir 方向劈开出一个新组，放入 tab。
 * fromGid === hoverGid 时相当于“复制一份到新组”（原组不动），符合真 VS Code 的感觉；
 * 否则把标签从来源组移走。
 */
export const splitTabAt = (n, hoverGid, dir, tab, fromGid) => {
  if (!tab) return { tree: n, newGid: null };
  const fresh = makeGroup([tab], tab.id);
  const base =
    fromGid && fromGid !== hoverGid ? removeByMove(n, fromGid, tab.id) : n;
  const tree = pruneEmpty(
    updateGroup(base, hoverGid, (g) =>
      dir === 'left' || dir === 'top'
        ? makeSplit(dir === 'left' ? 'row' : 'col', fresh, g)
        : makeSplit(dir === 'right' ? 'row' : 'col', g, fresh),
    ),
  );
  return { tree, newGid: fresh.gid };
};

const removeByMove = (n, gid, tabId) =>
  updateGroup(n, gid, (g) => {
    const tabs = g.tabs.filter((t) => t.id !== tabId);
    return { ...g, tabs, active: activeAfterRemove(tabs, g.active, tabId) };
  });

/** 关闭（移除）一个编辑器组；根组则清空标签。返回 [新树, 被移除的标签数组] */
export const removeGroup = (n, gid) => {
  if (!n) return [n, []];
  const removed = [];
  const drop = (node) => {
    if (isGroup(node)) {
      if (node.gid === gid) {
        removed.push(...node.tabs);
        return null;
      }
      return node;
    }
    const a = drop(node.a);
    const b = drop(node.b);
    if (!a) return b;
    if (!b) return a;
    if (a === node.a && b === node.b) return node;
    return { ...node, a, b };
  };
  let next;
  if (isGroup(n) && n.gid === gid) {
    removed.push(...n.tabs);
    next = { ...n, tabs: [], active: null }; // 唯一组被关：清空成欢迎页（保留组 id）
  } else {
    next = drop(n);
    next = pruneEmpty(next);
  }
  return [next, removed];
};

/** 收拢空组：非根的空组会被删除，其兄弟上提 */
export const pruneEmpty = (n, isRoot = true) => {
  if (!n) return null;
  if (isGroup(n)) return isRoot || n.tabs.length > 0 ? n : null;
  const a = pruneEmpty(n.a, false);
  const b = pruneEmpty(n.b, false);
  if (!a) return b;
  if (!b) return a;
  if (a === n.a && b === n.b) return n;
  return { ...n, a, b };
};

/** 调整 split 的 ratio */
export const setRatio = (n, sid, ratio) => {
  if (!n) return n;
  if (isSplit(n)) {
    if (n.sid === sid) return { ...n, ratio: Math.max(0.12, Math.min(0.88, ratio)) };
    const a = setRatio(n.a, sid, ratio);
    const b = setRatio(n.b, sid, ratio);
    if (a === n.a && b === n.b) return n;
    return { ...n, a, b };
  }
  return n;
};

/** 判断一个 gid 在树中是否“唯一组”（即没有拆分结构） */
export const isSingleGroupTree = (n) => isGroup(n);
