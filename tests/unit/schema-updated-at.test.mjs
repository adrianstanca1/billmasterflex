import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const schemaSource = readFileSync(
  new URL('../../lib/db/schema.ts', import.meta.url),
  'utf8',
);

test('billing tables register an on-update hook for updatedAt', () => {
  const occurrences = schemaSource.match(
    /updatedAt: timestamp\('updatedAt'\)[\s\S]*?\.\$onUpdateFn\(\(\) => new Date\(\)\),/g,
  );

  assert.equal(occurrences?.length, 3);
});
