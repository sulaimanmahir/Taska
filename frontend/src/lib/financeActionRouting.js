export function getTrustFundPrimaryActionKey(account) {
  return Number(account?.balance || 0) > 0 ? 'repay' : 'draw';
}

export function getTrustFundPrimaryActionLabel(account, mode = 'full') {
  const actionKey = getTrustFundPrimaryActionKey(account);

  if (mode === 'compact') {
    return actionKey === 'repay' ? 'Repay' : 'Draw';
  }

  return actionKey === 'repay' ? 'Open repayment' : 'Open draw';
}

export function runTrustFundPrimaryAction(account, handlers) {
  if (!account) {
    return;
  }

  const actionKey = getTrustFundPrimaryActionKey(account);

  if (actionKey === 'repay') {
    handlers?.openRepay?.(account);
    return;
  }

  handlers?.openDraw?.(account);
}

export function getAdashePrimaryActionKey(actionMode) {
  return actionMode === 'payout' ? 'payout' : 'collect';
}

export function getAdashePrimaryActionLabel(actionMode, mode = 'full') {
  const actionKey = getAdashePrimaryActionKey(actionMode);

  if (mode === 'compact') {
    return actionKey === 'payout' ? 'Payout' : 'Collect';
  }

  return actionKey === 'payout' ? 'Go to payout desk' : 'Go to collection desk';
}

export function runAdashePrimaryAction(actionMode, handlers) {
  const actionKey = getAdashePrimaryActionKey(actionMode);

  if (actionKey === 'payout') {
    handlers?.openPayout?.();
    return;
  }

  handlers?.openCollect?.();
}

export function getRecommendedAdasheActionMode(account) {
  const collected = Number(account?.balance || 0);
  const target = Number(account?.limit || 0);
  const remaining = Math.max(0, target - collected);
  const recommendationAction = account?.recommendation?.action;

  if ((recommendationAction === 'cycle_funded' || remaining <= 0) && collected > 0) {
    return 'payout';
  }

  return 'collect';
}

export function getAdasheSuggestedAmount(account, actionMode = null) {
  const resolvedActionMode = actionMode || getRecommendedAdasheActionMode(account);
  const collected = Number(account?.balance || 0);
  const target = Number(account?.limit || 0);
  const installment = Number(account?.installment_amount || 0);
  const remaining = Math.max(0, target - collected);
  const recommendedAmount = Number(account?.recommendation?.recommended_amount || 0);

  if (resolvedActionMode === 'payout') {
    return recommendedAmount > 0 ? Math.min(recommendedAmount, collected) : collected;
  }

  if (recommendedAmount > 0) {
    return Math.min(recommendedAmount, remaining);
  }

  if (installment > 0 && installment <= remaining) {
    return installment;
  }

  return remaining;
}

export function getAdasheSuggestedAmountReason(account, actionMode = null) {
  const resolvedActionMode = actionMode || getRecommendedAdasheActionMode(account);
  const collected = Number(account?.balance || 0);
  const target = Number(account?.limit || 0);
  const installment = Number(account?.installment_amount || 0);
  const remaining = Math.max(0, target - collected);
  const recommendation = account?.recommendation ?? null;

  if (resolvedActionMode === 'payout') {
    return recommendation?.why
      || (collected > 0
        ? 'This amount stays within the balance already collected into the cycle.'
        : 'This cycle needs more collections before a payout is appropriate.');
  }

  return recommendation?.why
    || (installment > 0 && installment <= remaining
      ? 'The regular installment keeps this member aligned with the planned collection schedule.'
      : 'This amount matches the remaining balance needed to complete the cycle target.');
}

export function getAdasheSuggestedAmountReasonBadge(account, actionMode = null) {
  const resolvedActionMode = actionMode || getRecommendedAdasheActionMode(account);
  const recommendationAction = account?.recommendation?.action;
  const collected = Number(account?.balance || 0);
  const target = Number(account?.limit || 0);
  const installment = Number(account?.installment_amount || 0);
  const remaining = Math.max(0, target - collected);

  if (resolvedActionMode === 'payout') {
    if (collected <= 0) {
      return { label: 'Awaiting funding', tone: 'amber' };
    }

    return { label: 'Within collected balance', tone: 'emerald' };
  }

  if (recommendationAction === 'collect_installment' || (installment > 0 && installment <= remaining)) {
    return { label: 'Schedule aligned', tone: 'violet' };
  }

  if (recommendationAction === 'complete_cycle' || remaining > 0) {
    return { label: 'Target completion', tone: 'sky' };
  }

  return { label: 'Cycle guidance', tone: 'violet' };
}

export function getAdasheLedgerPreviewLabel(account, formatAmount = (value) => String(value)) {
  const recommendation = account?.recommendation ?? null;
  const recommendedAmount = Number(recommendation?.recommended_amount || 0);

  if (recommendation?.action === 'cycle_funded') {
    return 'Within collected balance: payout ready';
  }

  if (recommendedAmount > 0) {
    const badge = getAdasheSuggestedAmountReasonBadge(account, 'collect');

    if (recommendation?.action === 'collect_installment') {
      return `${badge.label}: ${formatAmount(recommendedAmount)} installment`;
    }

    return `${badge.label}: ${formatAmount(recommendedAmount)} remaining`;
  }

  const target = Number(account?.limit || 0);
  const collected = Number(account?.balance || 0);
  const remaining = Math.max(0, target - collected);

  return remaining > 0
    ? `Target completion: ${formatAmount(remaining)} remaining`
    : 'Within collected balance: payout ready';
}

export function getTrustFundSuggestedAmount(account, actionKey = null) {
  const resolvedActionKey = actionKey || getTrustFundPrimaryActionKey(account);
  const recommendedAmount = Number(account?.recommendation?.recommended_amount || 0);
  const outstanding = Number(account?.balance || 0);
  const limit = Number(account?.limit || 0);
  const availableToDraw = Math.max(0, limit - outstanding);

  if (resolvedActionKey === 'repay') {
    return recommendedAmount > 0 ? Math.min(recommendedAmount, outstanding) : outstanding;
  }

  return recommendedAmount > 0 ? Math.min(recommendedAmount, availableToDraw) : availableToDraw;
}

export function getTrustFundSuggestedAmountReason(account, actionKey = null) {
  const resolvedActionKey = actionKey || getTrustFundPrimaryActionKey(account);
  const outstanding = Number(account?.balance || 0);
  const limit = Number(account?.limit || 0);
  const availableToDraw = Math.max(0, limit - outstanding);
  const recommendation = account?.recommendation ?? null;

  if (resolvedActionKey === 'repay') {
    return recommendation?.why
      || (outstanding > 0
        ? 'Recovering against the current outstanding balance reduces exposure before any future draw.'
        : 'There is no outstanding balance left on this account right now.');
  }

  return recommendation?.why
    || (availableToDraw > 0
      ? 'This amount stays within the remaining approved headroom on the account.'
      : 'There is no available headroom left, so a repayment is needed before another draw.');
}

export function getTrustFundSuggestedAmountReasonBadge(account, actionKey = null) {
  const resolvedActionKey = actionKey || getTrustFundPrimaryActionKey(account);
  const recommendationAction = account?.recommendation?.action;
  const outstanding = Number(account?.balance || 0);
  const limit = Number(account?.limit || 0);
  const availableToDraw = Math.max(0, limit - outstanding);

  if (resolvedActionKey === 'repay') {
    if (outstanding <= 0) {
      return { label: 'No balance due', tone: 'emerald' };
    }

    return { label: 'Risk reduction', tone: 'amber' };
  }

  if (recommendationAction === 'draw_within_limit' || availableToDraw > 0) {
    return { label: 'Within headroom', tone: 'sky' };
  }

  return { label: 'Repayment first', tone: 'amber' };
}

export function getTrustFundLedgerActionLabel(account, actionKey, formatAmount = (value) => String(value)) {
  const resolvedActionKey = actionKey || getTrustFundPrimaryActionKey(account);
  const recommendedAmount = Number(account?.recommendation?.recommended_amount || 0);
  const badge = getTrustFundSuggestedAmountReasonBadge(account, resolvedActionKey);

  if (recommendedAmount > 0) {
    return resolvedActionKey === 'repay'
      ? `${badge.label}: repay ${formatAmount(recommendedAmount)}`
      : `${badge.label}: draw ${formatAmount(recommendedAmount)}`;
  }

  return resolvedActionKey === 'repay' ? 'Open repayment' : 'Open draw';
}

function buildFinanceAction(label, onClick, active = false) {
  return {
    label,
    onClick,
    active,
  };
}

export function buildAdasheFocusActions({
  actionMode,
  onOpenDesk,
  onGoToStatement,
  activeSection,
}) {
  return [
    buildFinanceAction(
      getAdashePrimaryActionLabel(actionMode),
      onOpenDesk,
      activeSection === 'Desk',
    ),
    buildFinanceAction('Go to statement', onGoToStatement, activeSection === 'Statement'),
  ];
}

export function buildAdasheStatementActions({
  onBackToLedger,
  onJumpToDesk,
  activeSection,
}) {
  return [
    buildFinanceAction('Back to ledger', onBackToLedger, activeSection === 'Ledger'),
    buildFinanceAction('Jump to desk', onJumpToDesk, activeSection === 'Desk'),
  ];
}

export function buildAdasheMobileActions({
  actionMode,
  onLedger,
  onDesk,
  onStatement,
}) {
  return [
    buildFinanceAction('Ledger', onLedger),
    buildFinanceAction(getAdashePrimaryActionLabel(actionMode, 'compact'), onDesk),
    buildFinanceAction('Statement', onStatement),
  ];
}

export function buildTrustFundStatementActions({
  account,
  onBackToLedger,
  onOpenPrimary,
  activeLabel,
}) {
  if (!account) {
    return [
      buildFinanceAction('Back to ledger', onBackToLedger, activeLabel === 'Ledger'),
    ];
  }

  return [
    buildFinanceAction('Back to ledger', onBackToLedger, activeLabel === 'Ledger'),
    buildFinanceAction(
      getTrustFundPrimaryActionLabel(account),
      onOpenPrimary,
      activeLabel === getTrustFundPrimaryActionLabel(account, 'compact'),
    ),
  ];
}

export function buildTrustFundMobileActions({
  account,
  onLedger,
  onPrimary,
  onActivity,
}) {
  return [
    buildFinanceAction('Ledger', onLedger),
    buildFinanceAction(getTrustFundPrimaryActionLabel(account, 'compact'), onPrimary),
    buildFinanceAction('Activity', onActivity),
  ];
}
