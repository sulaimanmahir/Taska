import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/AIInsights.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('AIInsights defines a shared query error panel wrapper', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /title="Could not load insights"/);
  assert.match(source, /retryLabel="Try again"/);
});

test('AIInsights keeps grouped insight loading on a named query object', () => {
  assert.match(source, /const insightsQuery = useQuery\(/);
  assert.match(source, /queryKey: \['ai-insights', 'grouped'\]/);
  assert.match(source, /const groups = insightsQuery\.data \|\| \[\]/);
  assert.match(source, /const isLoading = insightsQuery\.isLoading/);
  assert.match(source, /const isError = insightsQuery\.isError/);
  assert.match(source, /const error = insightsQuery\.error/);
});

test('AIInsights retries through the live query object', () => {
  assert.match(source, /<QueryErrorPanel/);
  assert.match(source, /onRetry=\{\(\) => insightsQuery\.refetch\(\)\}/);
  assert.match(source, /api\.get\('\/ai\/insights\?grouped=1'\)/);
});
