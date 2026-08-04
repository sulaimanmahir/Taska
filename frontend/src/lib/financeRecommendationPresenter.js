import {
  getAdasheSuggestedAmountReason,
  getAdasheSuggestedAmountReasonBadge,
  getTrustFundSuggestedAmountReason,
  getTrustFundSuggestedAmountReasonBadge,
} from './financeActionRouting.js';

function toSummaryProps(badge) {
  return {
    summaryLabel: badge?.label ?? null,
    summaryTone: badge?.tone ?? null,
  };
}

export function getAdasheRecommendationPresentation(account, actionMode) {
  const badge = getAdasheSuggestedAmountReasonBadge(account, actionMode);

  return {
    badge,
    why: getAdasheSuggestedAmountReason(account, actionMode),
    ...toSummaryProps(badge),
  };
}

export function getTrustFundRecommendationPresentation(account, actionKey) {
  const badge = getTrustFundSuggestedAmountReasonBadge(account, actionKey);

  return {
    badge,
    why: getTrustFundSuggestedAmountReason(account, actionKey),
    ...toSummaryProps(badge),
  };
}
