import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getTrustFundPrimaryActionKey,
  getTrustFundPrimaryActionLabel,
  runTrustFundPrimaryAction,
  getAdashePrimaryActionKey,
  getAdashePrimaryActionLabel,
  runAdashePrimaryAction,
  getRecommendedAdasheActionMode,
  getAdasheSuggestedAmount,
  getAdasheSuggestedAmountReason,
  getAdasheSuggestedAmountReasonBadge,
  getAdasheLedgerPreviewLabel,
  getTrustFundSuggestedAmount,
  getTrustFundSuggestedAmountReason,
  getTrustFundSuggestedAmountReasonBadge,
  getTrustFundLedgerActionLabel,
  buildAdasheFocusActions,
  buildAdasheStatementActions,
  buildAdasheMobileActions,
  buildTrustFundStatementActions,
  buildTrustFundMobileActions,
} from '../src/lib/financeActionRouting.js';

test('getTrustFundPrimaryActionKey chooses repay when there is a balance, draw otherwise', () => {
  assert.equal(getTrustFundPrimaryActionKey({ balance: 5000 }), 'repay');
  assert.equal(getTrustFundPrimaryActionKey({ balance: 0 }), 'draw');
  assert.equal(getTrustFundPrimaryActionKey({}), 'draw');
  assert.equal(getTrustFundPrimaryActionKey(null), 'draw');
});

test('getTrustFundPrimaryActionLabel switches between full and compact modes', () => {
  assert.equal(getTrustFundPrimaryActionLabel({ balance: 5000 }), 'Open repayment');
  assert.equal(getTrustFundPrimaryActionLabel({ balance: 0 }), 'Open draw');
  assert.equal(getTrustFundPrimaryActionLabel({ balance: 5000 }, 'compact'), 'Repay');
  assert.equal(getTrustFundPrimaryActionLabel({ balance: 0 }, 'compact'), 'Draw');
});

test('runTrustFundPrimaryAction dispatches to the matching handler', () => {
  const calls = [];
  const handlers = {
    openRepay: (account) => calls.push(['repay', account]),
    openDraw: (account) => calls.push(['draw', account]),
  };

  runTrustFundPrimaryAction({ balance: 5000 }, handlers);
  runTrustFundPrimaryAction({ balance: 0 }, handlers);

  assert.deepEqual(calls, [
    ['repay', { balance: 5000 }],
    ['draw', { balance: 0 }],
  ]);
});

test('runTrustFundPrimaryAction is a no-op without an account or handlers', () => {
  assert.doesNotThrow(() => runTrustFundPrimaryAction(null, {}));
  assert.doesNotThrow(() => runTrustFundPrimaryAction({ balance: 100 }, undefined));
});

test('getAdashePrimaryActionKey maps payout mode explicitly, defaults to collect', () => {
  assert.equal(getAdashePrimaryActionKey('payout'), 'payout');
  assert.equal(getAdashePrimaryActionKey('collect'), 'collect');
  assert.equal(getAdashePrimaryActionKey(undefined), 'collect');
});

test('getAdashePrimaryActionLabel switches between full and compact modes', () => {
  assert.equal(getAdashePrimaryActionLabel('payout'), 'Go to payout desk');
  assert.equal(getAdashePrimaryActionLabel('collect'), 'Go to collection desk');
  assert.equal(getAdashePrimaryActionLabel('payout', 'compact'), 'Payout');
  assert.equal(getAdashePrimaryActionLabel('collect', 'compact'), 'Collect');
});

test('runAdashePrimaryAction dispatches to the matching handler', () => {
  const calls = [];
  const handlers = {
    openPayout: () => calls.push('payout'),
    openCollect: () => calls.push('collect'),
  };

  runAdashePrimaryAction('payout', handlers);
  runAdashePrimaryAction('collect', handlers);

  assert.deepEqual(calls, ['payout', 'collect']);
});

test('runAdashePrimaryAction tolerates missing handlers', () => {
  assert.doesNotThrow(() => runAdashePrimaryAction('payout', undefined));
});

test('getRecommendedAdasheActionMode recommends payout only once the cycle is funded', () => {
  assert.equal(
    getRecommendedAdasheActionMode({ balance: 1000, limit: 1000 }),
    'payout',
  );
  assert.equal(
    getRecommendedAdasheActionMode({
      balance: 500,
      limit: 1000,
      recommendation: { action: 'cycle_funded' },
    }),
    'payout',
  );
  assert.equal(
    getRecommendedAdasheActionMode({ balance: 500, limit: 1000 }),
    'collect',
  );
  assert.equal(
    getRecommendedAdasheActionMode({ balance: 0, limit: 1000 }),
    'collect',
  );
  assert.equal(getRecommendedAdasheActionMode(null), 'collect');
});

test('getAdasheSuggestedAmount uses the recommended amount when present', () => {
  const account = {
    balance: 4000,
    limit: 10000,
    installment_amount: 2000,
    recommendation: { recommended_amount: 3000 },
  };

  assert.equal(getAdasheSuggestedAmount(account, 'collect'), 3000);
  assert.equal(getAdasheSuggestedAmount(account, 'payout'), 3000);
});

test('getAdasheSuggestedAmount falls back to installment or remaining balance', () => {
  assert.equal(
    getAdasheSuggestedAmount({ balance: 4000, limit: 10000, installment_amount: 2000 }, 'collect'),
    2000,
  );
  assert.equal(
    getAdasheSuggestedAmount({ balance: 4000, limit: 10000, installment_amount: 8000 }, 'collect'),
    6000,
  );
  assert.equal(
    getAdasheSuggestedAmount({ balance: 4000, limit: 10000 }, 'payout'),
    4000,
  );
});

test('getAdasheSuggestedAmount infers the action mode when none is passed', () => {
  assert.equal(
    getAdasheSuggestedAmount({ balance: 1000, limit: 1000 }),
    1000,
  );
});

test('getAdasheSuggestedAmountReason prefers the server-provided reason', () => {
  const account = { recommendation: { why: 'Server says so' } };
  assert.equal(getAdasheSuggestedAmountReason(account, 'collect'), 'Server says so');
  assert.equal(getAdasheSuggestedAmountReason(account, 'payout'), 'Server says so');
});

test('getAdasheSuggestedAmountReason falls back to generated copy', () => {
  assert.equal(
    getAdasheSuggestedAmountReason({ balance: 0 }, 'payout'),
    'This cycle needs more collections before a payout is appropriate.',
  );
  assert.equal(
    getAdasheSuggestedAmountReason({ balance: 500 }, 'payout'),
    'This amount stays within the balance already collected into the cycle.',
  );
  assert.equal(
    getAdasheSuggestedAmountReason(
      { balance: 0, limit: 1000, installment_amount: 500 },
      'collect',
    ),
    'The regular installment keeps this member aligned with the planned collection schedule.',
  );
  assert.equal(
    getAdasheSuggestedAmountReason({ balance: 900, limit: 1000 }, 'collect'),
    'This amount matches the remaining balance needed to complete the cycle target.',
  );
});

test('getAdasheSuggestedAmountReasonBadge reflects funding and schedule state', () => {
  assert.deepEqual(
    getAdasheSuggestedAmountReasonBadge({ balance: 0 }, 'payout'),
    { label: 'Awaiting funding', tone: 'amber' },
  );
  assert.deepEqual(
    getAdasheSuggestedAmountReasonBadge({ balance: 500 }, 'payout'),
    { label: 'Within collected balance', tone: 'emerald' },
  );
  assert.deepEqual(
    getAdasheSuggestedAmountReasonBadge(
      { balance: 0, limit: 1000, installment_amount: 500 },
      'collect',
    ),
    { label: 'Schedule aligned', tone: 'violet' },
  );
  assert.deepEqual(
    getAdasheSuggestedAmountReasonBadge({ balance: 100, limit: 1000 }, 'collect'),
    { label: 'Target completion', tone: 'sky' },
  );
  assert.deepEqual(
    getAdasheSuggestedAmountReasonBadge({ balance: 1000, limit: 1000 }, 'collect'),
    { label: 'Cycle guidance', tone: 'violet' },
  );
});

test('getAdasheLedgerPreviewLabel summarizes cycle_funded accounts as payout ready', () => {
  const account = { recommendation: { action: 'cycle_funded', recommended_amount: 0 } };
  assert.equal(
    getAdasheLedgerPreviewLabel(account),
    'Within collected balance: payout ready',
  );
});

test('getAdasheLedgerPreviewLabel formats installment vs remaining recommendations', () => {
  const installmentAccount = {
    recommendation: { action: 'collect_installment', recommended_amount: 2000 },
  };
  assert.equal(
    getAdasheLedgerPreviewLabel(installmentAccount, (value) => `N${value}`),
    'Schedule aligned: N2000 installment',
  );

  const remainingAccount = {
    recommendation: { action: 'complete_cycle', recommended_amount: 1500 },
  };
  assert.equal(
    getAdasheLedgerPreviewLabel(remainingAccount, (value) => `N${value}`),
    'Target completion: N1500 remaining',
  );
});

test('getAdasheLedgerPreviewLabel falls back to remaining balance when no recommendation exists', () => {
  assert.equal(
    getAdasheLedgerPreviewLabel({ balance: 400, limit: 1000 }, (value) => `N${value}`),
    'Target completion: N600 remaining',
  );
  assert.equal(
    getAdasheLedgerPreviewLabel({ balance: 1000, limit: 1000 }),
    'Within collected balance: payout ready',
  );
});

test('getTrustFundSuggestedAmount honors recommended amounts within limits', () => {
  const account = {
    balance: 3000,
    limit: 10000,
    recommendation: { recommended_amount: 2000 },
  };

  assert.equal(getTrustFundSuggestedAmount(account, 'repay'), 2000);
  assert.equal(getTrustFundSuggestedAmount(account, 'draw'), 2000);
});

test('getTrustFundSuggestedAmount falls back to outstanding or headroom', () => {
  assert.equal(
    getTrustFundSuggestedAmount({ balance: 3000, limit: 10000 }, 'repay'),
    3000,
  );
  assert.equal(
    getTrustFundSuggestedAmount({ balance: 3000, limit: 10000 }, 'draw'),
    7000,
  );
});

test('getTrustFundSuggestedAmountReason prefers server-provided reason and falls back sensibly', () => {
  assert.equal(
    getTrustFundSuggestedAmountReason({ recommendation: { why: 'Server reason' } }, 'repay'),
    'Server reason',
  );
  assert.equal(
    getTrustFundSuggestedAmountReason({ balance: 0 }, 'repay'),
    'There is no outstanding balance left on this account right now.',
  );
  assert.equal(
    getTrustFundSuggestedAmountReason({ balance: 500 }, 'repay'),
    'Recovering against the current outstanding balance reduces exposure before any future draw.',
  );
  assert.equal(
    getTrustFundSuggestedAmountReason({ balance: 0, limit: 0 }, 'draw'),
    'There is no available headroom left, so a repayment is needed before another draw.',
  );
  assert.equal(
    getTrustFundSuggestedAmountReason({ balance: 0, limit: 1000 }, 'draw'),
    'This amount stays within the remaining approved headroom on the account.',
  );
});

test('getTrustFundSuggestedAmountReasonBadge reflects exposure state', () => {
  assert.deepEqual(
    getTrustFundSuggestedAmountReasonBadge({ balance: 0 }, 'repay'),
    { label: 'No balance due', tone: 'emerald' },
  );
  assert.deepEqual(
    getTrustFundSuggestedAmountReasonBadge({ balance: 500 }, 'repay'),
    { label: 'Risk reduction', tone: 'amber' },
  );
  assert.deepEqual(
    getTrustFundSuggestedAmountReasonBadge({ balance: 0, limit: 1000 }, 'draw'),
    { label: 'Within headroom', tone: 'sky' },
  );
  assert.deepEqual(
    getTrustFundSuggestedAmountReasonBadge({ balance: 1000, limit: 1000 }, 'draw'),
    { label: 'Repayment first', tone: 'amber' },
  );
});

test('getTrustFundLedgerActionLabel uses the recommended amount when present', () => {
  const account = { balance: 500, recommendation: { recommended_amount: 300 } };
  assert.equal(
    getTrustFundLedgerActionLabel(account, 'repay', (value) => `N${value}`),
    'Risk reduction: repay N300',
  );
});

test('getTrustFundLedgerActionLabel falls back to the plain open label', () => {
  assert.equal(
    getTrustFundLedgerActionLabel({ balance: 0 }, 'repay'),
    'Open repayment',
  );
  assert.equal(
    getTrustFundLedgerActionLabel({ balance: 0, limit: 500 }, 'draw'),
    'Open draw',
  );
});

test('buildAdasheFocusActions marks the active section', () => {
  const actions = buildAdasheFocusActions({
    actionMode: 'collect',
    onOpenDesk: () => {},
    onGoToStatement: () => {},
    activeSection: 'Statement',
  });

  assert.equal(actions.length, 2);
  assert.equal(actions[0].label, 'Go to collection desk');
  assert.equal(actions[0].active, false);
  assert.equal(actions[1].label, 'Go to statement');
  assert.equal(actions[1].active, true);
});

test('buildAdasheStatementActions and buildAdasheMobileActions build fixed action sets', () => {
  const statementActions = buildAdasheStatementActions({
    onBackToLedger: () => {},
    onJumpToDesk: () => {},
    activeSection: 'Ledger',
  });
  assert.deepEqual(
    statementActions.map((action) => [action.label, action.active]),
    [['Back to ledger', true], ['Jump to desk', false]],
  );

  const mobileActions = buildAdasheMobileActions({
    actionMode: 'payout',
    onLedger: () => {},
    onDesk: () => {},
    onStatement: () => {},
  });
  assert.deepEqual(
    mobileActions.map((action) => action.label),
    ['Ledger', 'Payout', 'Statement'],
  );
});

test('buildTrustFundStatementActions handles missing and present accounts', () => {
  const withoutAccount = buildTrustFundStatementActions({
    account: null,
    onBackToLedger: () => {},
    onOpenPrimary: () => {},
    activeLabel: 'Ledger',
  });
  assert.equal(withoutAccount.length, 1);
  assert.equal(withoutAccount[0].active, true);

  const withAccount = buildTrustFundStatementActions({
    account: { balance: 0 },
    onBackToLedger: () => {},
    onOpenPrimary: () => {},
    activeLabel: 'Draw',
  });
  assert.equal(withAccount.length, 2);
  assert.equal(withAccount[1].label, 'Open draw');
  assert.equal(withAccount[1].active, true);
});

test('buildTrustFundMobileActions builds a fixed three-item action set', () => {
  const actions = buildTrustFundMobileActions({
    account: { balance: 0 },
    onLedger: () => {},
    onPrimary: () => {},
    onActivity: () => {},
  });

  assert.deepEqual(
    actions.map((action) => action.label),
    ['Ledger', 'Draw', 'Activity'],
  );
});
