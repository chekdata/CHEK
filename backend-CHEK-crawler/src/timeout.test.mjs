import assert from 'node:assert/strict';
import test from 'node:test';

import { withTimeout } from './timeout.mjs';

test('withTimeout returns a completed operation', async () => {
  assert.equal(await withTimeout(Promise.resolve('ok'), 50, 'test'), 'ok');
});

test('withTimeout rejects a hung operation', async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 10, 'crawler run'),
    /crawler run timed out after 10ms/
  );
});
