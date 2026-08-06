import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAdasheRecommendationPresentation,
  getTrustFundRecommendationPresentation,
} from '../src/lib/financeRecommendationPresenter.js';

test('getAdasheRecommendationPresentation combines badge, reason, and summary props', () => {
  const account = { balance: 500 };
  const presentation = getAdasheRecommendationPresentation(account, 'payout');

  assert.deepEqual(presentation.badge, { label: 'Within collected balance', tone: 'emerald' });
  assert.equal(
    presentation.why,
    'This amount stays within the balance already collected into the cycle.',
  );
  assert.equal(presentation.summaryLabel, 'Within collected balance');
  assert.equal(presentation.summaryTone, 'emerald');
});

test('getAdasheRecommendationPresentation handles a null account gracefully', () => {
  const presentation = getAdasheRecommendationPresentation(null, 'collect');
  assert.equal(presentation.badge.label, 'Cycle guidance');
  assert.equal(presentation.summaryLabel, 'Cycle guidance');
});

test('getTrustFundRecommendationPresentation combines badge, reason, and summary props', () => {
  const account = { balance: 500 };
  const presentation = getTrustFundRecommendationPresentation(account, 'repay');

  assert.deepEqual(presentation.badge, { label: 'Risk reduction', tone: 'amber' });
  assert.equal(
    presentation.why,
    'Recovering against the current outstanding balance reduces exposure before any future draw.',
  );
  assert.equal(presentation.summaryLabel, 'Risk reduction');
  assert.equal(presentation.summaryTone, 'amber');
});

test('getTrustFundRecommendationPresentation falls back when no action key is provided', () => {
  // With no explicit actionKey, the resolved action comes from getTrustFundPrimaryActionKey(account),
  // which for a zero-balance/zero-limit account does not resolve to 'repay', so this falls through
  // to the no-headroom branch rather than the "No balance due" short-circuit under the 'repay' branch.
  const presentation = getTrustFundRecommendationPresentation({ balance: 0 }, null);
  assert.equal(presentation.summaryLabel, 'Repayment first');
});
