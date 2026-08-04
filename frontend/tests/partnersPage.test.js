import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Partners.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Partners keeps top-level desk dependencies on named query objects', () => {
  assert.match(source, /const statsQuery = useQuery\(/);
  assert.match(source, /const tiersQuery = useQuery\(/);
  assert.match(source, /const agentsQuery = useQuery\(/);
  assert.match(source, /const commissionsQuery = useQuery\(/);
  assert.match(source, /const payoutsQuery = useQuery\(/);
  assert.match(source, /const partnerDeskQueries = \[statsQuery, tiersQuery, agentsQuery\]/);
});

test('Partners uses grouped refetch through the shared top-level retry panel', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /partnerDeskQueries\.forEach\(\(query\) => \{/);
  assert.match(source, /void query\.refetch\(\)/);
  assert.match(source, /partnerDeskQueries\.find\(\(query\) => query\.isError\)\?\.error/);
  assert.match(source, /partnerDeskQueries\.some\(\(query\) => query\.isError\)/);
  assert.match(source, /We could not load partner program data right now\./);
});

test('Partners keeps the desk, commission, and payout endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/partners\/stats'\)/);
  assert.match(source, /api\.get\('\/partners\/tiers'\)/);
  assert.match(source, /fetchPartnerList\('\/partners'/);
  assert.match(source, /fetchPartnerList\('\/partners\/commissions'/);
  assert.match(source, /fetchPartnerList\('\/partners\/payouts'/);
});
