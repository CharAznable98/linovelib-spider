import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCliArgs } from '../src/cli';

test('parse chapter args with defaults', () => {
  const parsed = parseCliArgs(['node', 'index.ts']);
  assert.deepEqual(parsed, { mode: 'chapter', bookId: 2013, chapterId: 72034 });
});

test('parse rank args', () => {
  const parsed = parseCliArgs(['node', 'index.ts', 'rank', 'https://x']);
  assert.deepEqual(parsed, { mode: 'rank', url: 'https://x' });
});

test('invalid mode throws', () => {
  assert.throws(() => parseCliArgs(['node', 'index.ts', 'oops']), /未知模式/);
});
