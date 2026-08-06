import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Partners.jsx');
const pageSource = fs.readFileSync(pagePath, 'utf8');

const hookPath = path.resolve(process.cwd(), 'src/hooks/usePartnersDesk.js');
const hookSource = fs.readFileSync(hookPath, 'utf8');

test('usePartnersDesk keeps top-level desk dependencies on named query objects', () => {
  assert.match(hookSource, /const statsQuery = useQuery\(/);
  assert.match(hookSource, /const tiersQuery = useQuery\(/);
  assert.match(hookSource, /const agentsQuery = useQuery\(/);
  assert.match(hookSource, /const commissionsQuery = useQuery\(/);
  assert.match(hookSource, /const payoutsQuery = useQuery\(/);
  assert.match(hookSource, /const partnerDeskQueries = \[statsQuery, tiersQuery, agentsQuery\]/);
});

test('Partners uses grouped refetch through the shared top-level retry panel', () => {
  assert.match(pageSource, /function QueryErrorPanel/);
  assert.match(hookSource, /partnerDeskQueries\.forEach\(\(query\) => \{/);
  assert.match(hookSource, /void query\.refetch\(\)/);
  assert.match(hookSource, /partnerDeskQueries\.find\(\(query\) => query\.isError\)\?\.error/);
  assert.match(pageSource, /partnerDeskQueries\.some\(\(query\) => query\.isError\)/);
  assert.match(hookSource, /We could not load partner program data right now\./);
});

test('usePartnersDesk keeps the desk, commission, and payout endpoints query-backed', () => {
  assert.match(hookSource, /api\.get\('\/partners\/stats'\)/);
  assert.match(hookSource, /api\.get\('\/partners\/tiers'\)/);
  assert.match(hookSource, /fetchPartnerList\('\/partners'/);
  assert.match(hookSource, /fetchPartnerList\('\/partners\/commissions'/);
  assert.match(hookSource, /fetchPartnerList\('\/partners\/payouts'/);
});
