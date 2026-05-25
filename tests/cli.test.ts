import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCliArgs } from '../src/cli';

test('parse browse args with defaults', () => {
  const parsed = parseCliArgs(['node', 'index.ts']);
  assert.deepEqual(parsed, { mode: 'browse' });
});

test('parse browse args explicitly', () => {
  const parsed = parseCliArgs(['node', 'index.ts', 'browse']);
  assert.deepEqual(parsed, { mode: 'browse' });
});

test('invalid mode throws', () => {
  assert.throws(() => parseCliArgs(['node', 'index.ts', 'oops']), /未知模式/);
});
