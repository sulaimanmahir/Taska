export function getDashboardOwnerFocusSections(ownerFocus) {
  if (!ownerFocus?.profit_driver) {
    return null;
  }

  return {
    summaryCards: [
      {
        title: 'How this business makes money',
        body: ownerFocus.profit_driver,
        tone: 'brand',
      },
      {
        title: 'What silently kills profit',
        lines: ownerFocus.profit_killers?.slice(0, 3) || [],
        tone: 'rose',
      },
      {
        title: 'Fraud and loss risks',
        lines: ownerFocus.fraud_losses?.slice(0, 3) || [],
        tone: 'amber',
      },
      {
        title: 'Daily owner decisions',
        lines: ownerFocus.daily_decisions?.slice(0, 3) || [],
        tone: 'sky',
      },
    ],
    monthlyReports: ownerFocus.monthly_reports?.slice(0, 5) || [],
    featureHighlights: ownerFocus.feature_highlights?.slice(0, 4) || [],
  };
}
