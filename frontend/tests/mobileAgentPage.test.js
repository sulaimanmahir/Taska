import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/MobileAgentOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('MobileAgentOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['mobile-agent-desk'\]/);
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /api\.get\('\/mobile-agent\/overview'\)/);
  assert.match(source, /api\.get\('\/mobile-agent\/commission-tiers'\)/);
  assert.match(source, /api\.get\('\/mobile-agent\/float-requests'\)/);
  assert.match(source, /api\.get\('\/mobile-agent\/transactions'\)/);
  assert.match(source, /api\.get\('\/mobile-agent\/reversals'\)/);
  assert.match(source, /api\.get\('\/mobile-agent\/shortages'\)/);
  assert.match(source, /api\.get\('\/mobile-agent\/fraud-alerts'\)/);
});

test('MobileAgentOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load the mobile agent operations desk right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('MobileAgentOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/mobile-agent\/commission-tiers'/);
  assert.match(source, /api\.post\('\/mobile-agent\/float-requests'/);
  assert.match(source, /api\.post\(`\/mobile-agent\/float-requests\/\$\{id\}\/approve`/);
  assert.match(source, /api\.post\('\/mobile-agent\/transactions'/);
  assert.match(source, /api\.post\('\/mobile-agent\/reversals'/);
  assert.match(source, /api\.post\('\/mobile-agent\/shortages'/);
});
