import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/TrustFund.jsx');
const pageSource = fs.readFileSync(pagePath, 'utf8');

const hookPath = path.resolve(process.cwd(), 'src/hooks/useTrustFundDesk.js');
const hookSource = fs.readFileSync(hookPath, 'utf8');

test('TrustFund defines a shared query error panel', () => {
  assert.match(pageSource, /function QueryErrorPanel/);
  assert.match(hookSource, /We could not load part of the trust fund workspace right now\. Please try again\./);
  assert.match(pageSource, /trustDeskQueries\.some\(\(query\) => query\.isError\)/);
});

test('useTrustFundDesk keeps top-level workspace queries grouped for retry', () => {
  assert.match(hookSource, /const trustDeskQueries = \[accountsQuery, overdueQuery, customersQuery\]/);
  assert.match(pageSource, /trustDeskQueries\.forEach\(\(query\) => query\.refetch\(\)\)/);
});

test('useTrustFundDesk keeps desk and statement endpoints query-backed', () => {
  assert.match(hookSource, /api\.get\('\/trust-accounts'/);
  assert.match(hookSource, /api\.get\('\/trust-accounts\/overdue'\)/);
  assert.match(hookSource, /api\.get\('\/customers'\)/);
  assert.match(hookSource, /api\.get\(`\/trust-accounts\/\$\{selectedLedgerAccountId\}`\)/);
});

test('useTrustFundDesk builds ledger focus actions as a local literal, not through an external builder', () => {
  // Regression guard: this used to call buildTrustFundFocusActions() (an
  // external function in lib/financeActionRouting.js) with a ref-derived
  // closure passed as an argument, which react-hooks/refs flags as a
  // (harmless, but linter-visible) false positive since it can't trace the
  // closure through the function boundary to confirm it's never invoked
  // during render. Rebuilt as a local literal instead, matching how
  // useAdasheDesk.js already does the equivalent pattern correctly.
  assert.doesNotMatch(hookSource, /buildTrustFundFocusActions/);
  assert.match(hookSource, /const focusActions = selectedLedgerAccount/);
  assert.match(hookSource, /onClick: \(\) => scrollToFinanceRef\(accountActivityRef\)/);
});
