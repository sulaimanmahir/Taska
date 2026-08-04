import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTrustFundOverdueAccountPresentation,
  buildTrustFundStatementPanelSummaryItems,
  createTrustFundStatementSummary,
  getTrustFundStatementEntryMeta,
  getTrustFundStatementEntryTitle,
  mapTrustFundStatementPanelEntries,
} from '../src/lib/trustFund.js';

const overdueAccount = {
  balance: 9000,
  recommendation: {
    action: 'collect_repayment_first',
    risk_level: 'high',
    why: 'This customer is already carrying too much exposure.',
  },
};

test('trust fund overdue presentation keeps repayment CTA and recommendation summary aligned', () => {
  const presentation = buildTrustFundOverdueAccountPresentation(overdueAccount);

  assert.equal(presentation.customerName, 'customer');
  assert.equal(presentation.overdueAmountLabel, '₦9,000 overdue');
  assert.equal(presentation.ctaLabel, 'Open repayment');
  assert.equal(presentation.ariaLabel, 'Open repayment for overdue account customer');
  assert.equal(presentation.recommendationPresentation.summaryLabel, 'Risk reduction');
});

test('trust fund statement panel helpers format summary items and visible entries consistently', () => {
  const transactions = [
    {
      type: 'draw',
      amount: -5000,
      balance_after: 5000,
      transaction_date: '2026-05-25',
      reference: 'Opening release',
    },
    {
      type: 'repayment',
      amount: 1500,
      balance_after: 3500,
      transaction_date: '2026-05-26',
      reference: '',
    },
  ];
  const summary = createTrustFundStatementSummary(transactions);

  assert.deepEqual(buildTrustFundStatementPanelSummaryItems(summary), [
    { label: 'Drawn', value: '₦5,000', tone: 'amber' },
    { label: 'Recovered', value: '₦1,500', tone: 'emerald' },
    { label: 'Last Activity', value: '25 May 2026', tone: 'slate' },
  ]);

  assert.deepEqual(mapTrustFundStatementPanelEntries(transactions), [
    {
      ...transactions[0],
      balanceAfter: '₦5,000',
    },
    {
      ...transactions[1],
      balanceAfter: '₦3,500',
    },
  ]);

  assert.equal(getTrustFundStatementEntryTitle(transactions[0]), 'Draw released');
  assert.equal(getTrustFundStatementEntryTitle(transactions[1]), 'Repayment received');
  assert.equal(getTrustFundStatementEntryMeta(transactions[1]), 'No narration - 26 May 2026');
});
