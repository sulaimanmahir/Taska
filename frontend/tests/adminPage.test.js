import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Admin.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('admin page uses query-backed loading for tab data and stats', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /getAdminLoadRequests\(activeTab\)/);
  assert.match(source, /api\.get\(requestConfig\.primary\)/);
  assert.match(source, /api\.get\('\/admin\/stats'\)/);
  assert.match(source, /adminQuery\.refetch\(\)/);
  assert.match(source, /QueryErrorPanel/);
});

test('admin page keeps admin actions on a dedicated mutation flow', () => {
  assert.match(source, /useMutation\(\{/);
  assert.match(source, /api\.post\(`\/admin\/\$\{action\}`,\s*\{ id: item\.id \}\)/);
  assert.match(source, /setPendingAction\(null\)/);
  assert.match(source, /ConfirmDialog/);
  assert.match(source, /filterAdminRecords/);
});
