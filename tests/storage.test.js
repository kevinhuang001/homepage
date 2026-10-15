import assert from 'node:assert/strict';
import test from 'node:test';
import { readSavedDocs, writeSavedDocs, STORAGE_KEY } from '../src/lib/storage.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) };
}
test('save and restore markdown text by virtual file path', () => {
  const store = memoryStorage();
  const docs = new Map([['/homepage/README.md', '# edited']]);
  assert.equal(writeSavedDocs(docs, store), true);
  assert.equal(readSavedDocs(store).get('/homepage/README.md'), '# edited');
  assert.ok(store.getItem(STORAGE_KEY));
});
test('broken storage and malformed data never crash', () => {
  const broken = { getItem: () => {throw Error('disabled')}, setItem: () => {throw Error('disabled')} };
  assert.deepEqual([...readSavedDocs(broken)], []);
  assert.equal(writeSavedDocs(new Map(), broken), false);
  const invalid = { getItem: () => '{"other":"bad","/file.md":12}', setItem: () => {} };
  assert.deepEqual([...readSavedDocs(invalid)], []);
});
