import assert from 'node:assert/strict';
import test from 'node:test';
import {
  makeGroup, openTab, closeTab, selectTab, splitTabAt, moveTabInto,
  collectGroups, pruneEmpty, removeGroup, setRatio, isGroup,
} from '../src/lib/editors.js';

const tab = (id) => ({ id, node: { name: id, kind: 'md' } });
const seed = () => {
  const root = makeGroup();
  return { root, gid: root.gid };
};

test('open existing tab activates without duplication', () => {
  const { root, gid } = seed();
  const once = openTab(root, gid, tab('a'));
  const twice = openTab(once, gid, tab('a'));
  assert.equal(twice.tabs.length, 1);
  assert.equal(twice.active, 'a');
});
test('closing an active tab selects the right neighbor then the left', () => {
  const { root, gid } = seed();
  let tree = ['a', 'b', 'c'].reduce((t, id) => openTab(t, gid, tab(id)), root);
  tree = selectTab(tree, gid, 'b');
  tree = closeTab(tree, gid, 'b');
  assert.deepEqual(tree.tabs.map(t => t.id), ['a', 'c']);
  assert.equal(tree.active, 'c');
  tree = closeTab(tree, gid, 'c');
  assert.equal(tree.active, 'a');
  tree = closeTab(tree, gid, 'a');
  assert.equal(isGroup(tree), true);
  assert.equal(tree.active, null);
});
test('select non-existing tab is a no-op', () => {
  const { root, gid } = seed();
  assert.equal(selectTab(root, gid, 'missing'), root);
});
test('splitting current tab duplicates into a new group', () => {
  const { root, gid } = seed();
  const opened = openTab(root, gid, tab('a'));
  const { tree, newGid } = splitTabAt(opened, gid, 'right', tab('a'), gid);
  assert.equal(collectGroups(tree).length, 2);
  assert.equal(collectGroups(tree).find(g => g.gid === newGid).active, 'a');
  assert.equal(collectGroups(tree).find(g => g.gid === gid).active, 'a');
});
test('move between groups prunes empty origin and preserves target', () => {
  const { root, gid } = seed();
  const opened = openTab(root, gid, tab('a'));
  const { tree, newGid } = splitTabAt(opened, gid, 'right', tab('b'), gid);
  const moved = moveTabInto(tree, gid, newGid, 'a');
  assert.equal(collectGroups(moved).length, 1);
  assert.deepEqual(collectGroups(moved)[0].tabs.map(t => t.id), ['b', 'a']);
  assert.equal(collectGroups(moved)[0].active, 'a');
  assert.equal(moveTabInto(moved, newGid, 'missing', 'a'), moved);
});
test('closing a group keeps remaining editor group', () => {
  const { root, gid } = seed();
  const opened = openTab(root, gid, tab('a'));
  const { tree, newGid } = splitTabAt(opened, gid, 'bottom', tab('b'), gid);
  const [next, removed] = removeGroup(tree, newGid);
  assert.deepEqual(removed.map(t => t.id), ['b']);
  assert.equal(next.active, 'a');
  assert.equal(pruneEmpty(next), next);
});
test('split sash ratio is safely clamped', () => {
  const { root, gid } = seed();
  const opened = openTab(root, gid, tab('b'));
  const { tree } = splitTabAt(opened, gid, 'left', tab('a'), gid);
  assert.equal(setRatio(tree, tree.sid, 2).ratio, 0.88);
  assert.equal(setRatio(tree, tree.sid, -1).ratio, 0.12);
});
