import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCliArgs } from '../src/cli';

test('parse browse args with defaults', () => {
  const parsed = parseCliArgs(['node', 'index.ts']);
  assert.deepEqual(parsed, { mode: 'browse', source: 'rank', action: 'list' });
});

test('parse search args', () => {
  const parsed = parseCliArgs(['node', 'index.ts', 'browse', '--source', 'search', '--keyword', '魔女', '--pick', '2', '--action', 'book']);
  assert.deepEqual(parsed, { mode: 'browse', source: 'search', keyword: '魔女', pick: 2, action: 'book' });
});

test('invalid mode throws', () => {
  assert.throws(() => parseCliArgs(['node', 'index.ts', 'oops']), /未知模式/);
});
