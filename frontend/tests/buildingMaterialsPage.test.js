import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/BuildingMaterialsOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('BuildingMaterialsOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, isLoading, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['building-materials-overview'\]/);
  assert.match(source, /api\.get\('\/building-materials\/overview'\)/);
});

test('BuildingMaterialsOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load the building materials desk right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('BuildingMaterialsOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/building-materials\/items'/);
  assert.match(source, /api\.post\('\/building-materials\/customers'/);
  assert.match(source, /api\.post\('\/building-materials\/quotations'/);
  assert.match(source, /api\.post\(`\/building-materials\/quotations\/\$\{quotationId\}\/convert`/);
  assert.match(source, /api\.post\('\/building-materials\/deliveries'/);
  assert.match(source, /api\.patch\(`\/building-materials\/deliveries\/\$\{id\}`/);
  assert.match(source, /api\.post\('\/building-materials\/price-changes'/);
  assert.match(source, /api\.post\('\/building-materials\/transfers'/);
  assert.match(source, /api\.post\(`\/building-materials\/credit-accounts\/\$\{payload\.account_id\}\/payments`/);
});
