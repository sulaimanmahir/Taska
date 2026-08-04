import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Rooms.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Rooms keeps desk dependencies on named query objects', () => {
  assert.match(source, /const overviewQuery = useQuery\(/);
  assert.match(source, /const roomsQuery = useQuery\(/);
  assert.match(source, /const roomQueries = \[overviewQuery, roomsQuery\]/);
});

test('Rooms uses grouped refetch through the shared retry panel', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /const hasPageError = roomQueries\.some\(\(query\) => query\.isError\)/);
  assert.match(source, /roomQueries\.find\(\(query\) => query\.isError\)\?\.error/);
  assert.match(source, /roomQueries\.forEach\(\(query\) => \{/);
  assert.match(source, /void query\.refetch\(\)/);
  assert.match(source, /We could not load the room operations desk right now\./);
});

test('Rooms keeps its desk endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/hotel\/overview'\)/);
  assert.match(source, /api\.get\('\/hotel\/rooms'\)/);
});
