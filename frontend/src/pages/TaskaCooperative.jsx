import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageHeader, PageShell, ResponsiveCardGrid, SectionShell } from '../components/PageShell';
import {
  buildCooperativeFinancingPresentation,
  buildCooperativeProfitCyclePresentation,
  buildCooperativeShareEntryPresentation,
} from '../lib/cooperative';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import { cooperativeSections as sections, useCooperativeDesk } from '../hooks/useCooperativeDesk';

const financingHints = {
  qard_hasan: 'An interest-free loan where the borrower repays only the amount taken. No profit is charged. Late penalties go to charity.',
  mudarabah: 'A profit-sharing partnership where the cooperative provides capital and the member runs the business. Profit is shared based on agreement.',
  musharakah: 'A joint partnership where both the cooperative and the member contribute capital and share profit and loss.',
};

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-500"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function TaskaCooperative() {
  const {
    setSearchParams,
    activeSection,
    setActiveSection,
    setupForm,
    setSetupForm,
    memberForm,
    setMemberForm,
    shareForm,
    setShareForm,
    financingForm,
    setFinancingForm,
    investmentForm,
    setInvestmentForm,
    profitForm,
    setProfitForm,
    withdrawalForm,
    setWithdrawalForm,
    governanceForm,
    setGovernanceForm,
    customersQuery,
    plansQuery,
    productsQuery,
    configured,
    sharesQuery,
    financingQuery,
    profitCyclesQuery,
    setupMutation,
    memberMutation,
    shareMutation,
    financingMutation,
    approveGuarantorMutation,
    updateFinancingStatusMutation,
    investmentMutation,
    profitCycleMutation,
    distributeProfitMutation,
    withdrawalMutation,
    governanceMutation,
    members,
    cooperative,
    shareSummary,
    dashboardMetrics,
    walletPresentations,
    governanceSnapshot,
    withdrawalPresentations,
    governanceRecordPresentations,
    reportCards,
    memberPresentations,
    investmentPresentations,
    settingsSummary,
    cooperativeQueries,
    loadError,
    submitSetup,
  } = useCooperativeDesk();

  return (
    <PageShell width="wide" className="page-stack">
      {cooperativeQueries.some((query) => query.isError) ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            cooperativeQueries.forEach((query) => query.refetch());
          }}
        />
      ) : null}

      <SectionShell>
        <PageHeader
          eyebrow="Finance & cooperative"
          title="Cooperative"
          description="Shari'a-compliant cooperative finance for shares, Qard Hasan, Mudarabah, Musharakah, halal investments, and profit distribution inside the main Taska system."
          aside={configured ? (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
              {cooperative?.name || 'Cooperative configured'} | {cooperative?.branding_settings?.branding_tier || cooperative?.brandingSettings?.branding_tier || 'basic'} tier
            </div>
          ) : null}
        />
      </SectionShell>

      <ResponsiveCardGrid variant="default" className="md:grid-cols-2 xl:grid-cols-5">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => {
              setActiveSection(section.id);
              setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.set('section', section.id);
                return next;
              });
            }}
            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
              activeSection === section.id
                ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {section.label}
          </button>
        ))}
      </ResponsiveCardGrid>

      {!configured ? (
        <Card>
          <CardHeader title="Cooperative Setup" subtitle="Define the share structure, financing rules, branding tier, and governance baseline." />
          <form onSubmit={submitSetup} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Cooperative name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.name} onChange={(event) => setSetupForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Slug</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.slug} onChange={(event) => setSetupForm((current) => ({ ...current, slug: event.target.value }))} placeholder="taska-cooperative" />
            </label>
            <label className="space-y-2 text-sm text-slate-600 xl:col-span-2">
              <span className="font-medium text-slate-900">Description</span>
              <textarea className="min-h-[96px] w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.description} onChange={(event) => setSetupForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Share price</span>
              <input type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.share_price} onChange={(event) => setSetupForm((current) => ({ ...current, share_price: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Minimum member shares</span>
              <input type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.minimum_member_shares} onChange={(event) => setSetupForm((current) => ({ ...current, minimum_member_shares: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Profit cycle</span>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.profit_cycle} onChange={(event) => setSetupForm((current) => ({ ...current, profit_cycle: event.target.value }))}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannual">Biannual</option>
                <option value="annual">Annual</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Subscription plan</span>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.subscription_plan_id} onChange={(event) => setSetupForm((current) => ({ ...current, subscription_plan_id: event.target.value }))}>
                <option value="">Select plan</option>
                {(plansQuery.data || []).map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600 xl:col-span-2">
              <span className="font-medium text-slate-900">Contribution rules</span>
              <textarea className="min-h-[96px] w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.contribution_rule} onChange={(event) => setSetupForm((current) => ({ ...current, contribution_rule: event.target.value }))} />
            </label>
            <Card className="xl:col-span-2 border-dashed">
              <CardHeader title="Qard Hasan rules" subtitle="Guarantor discipline, share thresholds, loan limits, and override controls." />
              <ResponsiveCardGrid variant="default" className="md:grid-cols-3">
                <label className="space-y-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Required guarantors</span>
                  <input type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.loan_settings.required_guarantors} onChange={(event) => setSetupForm((current) => ({ ...current, loan_settings: { ...current.loan_settings, required_guarantors: event.target.value } }))} />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Min shares per guarantor</span>
                  <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.loan_settings.min_shares_per_guarantor} onChange={(event) => setSetupForm((current) => ({ ...current, loan_settings: { ...current.loan_settings, min_shares_per_guarantor: event.target.value } }))} />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Borrower min shares</span>
                  <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.loan_settings.borrower_min_shares} onChange={(event) => setSetupForm((current) => ({ ...current, loan_settings: { ...current.loan_settings, borrower_min_shares: event.target.value } }))} />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Combined guarantor shares</span>
                  <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.loan_settings.min_combined_guarantor_shares} onChange={(event) => setSetupForm((current) => ({ ...current, loan_settings: { ...current.loan_settings, min_combined_guarantor_shares: event.target.value } }))} />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Loan limit mode</span>
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.loan_settings.loan_limit_mode} onChange={(event) => setSetupForm((current) => ({ ...current, loan_settings: { ...current.loan_settings, loan_limit_mode: event.target.value } }))}>
                    <option value="multiplier">Multiplier</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed max</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Loan limit value</span>
                  <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={setupForm.loan_settings.loan_limit_value} onChange={(event) => setSetupForm((current) => ({ ...current, loan_settings: { ...current.loan_settings, loan_limit_value: event.target.value } }))} />
                </label>
              </ResponsiveCardGrid>
            </Card>
            <div className="xl:col-span-2 flex justify-end">
              <button type="submit" className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20">
                {setupMutation.isPending ? 'Saving cooperative setup...' : 'Save cooperative setup'}
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      {configured ? (
        <>
          {activeSection === 'dashboard' ? (
            <div className="space-y-6">
              <ResponsiveCardGrid variant="metrics" className="xl:grid-cols-4">
                {dashboardMetrics.map((metric) => (
                  <OpsMetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    helper={metric.helper}
                    tone={metric.tone}
                  />
                ))}
              </ResponsiveCardGrid>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardHeader title="Treasury Wallets" subtitle="Main wallet plus financing, investment, reserve, and charity funds." />
                  <div className="grid gap-4 md:grid-cols-2">
                    {walletPresentations.map((wallet) => (
                      <div key={wallet.id} className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{wallet.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{wallet.balanceLabel}</p>
                        <p className="mt-1 text-sm text-slate-500">Locked {wallet.lockedBalanceLabel}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Governance Snapshot" />
                  <div className="space-y-4 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Shari&apos;a compliance</p>
                      <p className="mt-2">{governanceSnapshot.shariaNotes}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Branding tier</p>
                      <p className="mt-2 capitalize">{governanceSnapshot.brandingTier}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          {activeSection === 'members' ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
              <Card>
                <CardHeader title="Members" subtitle="Linked to Taska contacts with cooperative roles and participation history." />
                {members.length > 0 ? (
                  <div className="space-y-3">
                    {memberPresentations.map((member) => (
                      <div key={member.id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{member.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{member.meta}</p>
                          </div>
                          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{member.memberNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" title="No members yet" description="Add cooperative members from your Taska contacts." />
                )}
              </Card>

              <Card>
                <CardHeader title="Add Member" />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    memberMutation.mutate({ ...memberForm, customer_id: Number(memberForm.customer_id) });
                  }}
                  className="space-y-4"
                >
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={memberForm.customer_id} onChange={(event) => setMemberForm((current) => ({ ...current, customer_id: event.target.value }))}>
                    <option value="">Select contact</option>
                    {(customersQuery.data || []).map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={memberForm.role} onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="auditor">Auditor</option>
                  </select>
                  <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={memberForm.joined_at} onChange={(event) => setMemberForm((current) => ({ ...current, joined_at: event.target.value }))} />
                  <textarea className="min-h-[92px] w-full rounded-2xl border border-slate-200 px-4 py-3" value={memberForm.notes} onChange={(event) => setMemberForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Member note" />
                  <button type="submit" className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
                    {memberMutation.isPending ? 'Saving member...' : 'Save member'}
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {activeSection === 'shares' ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
              <Card>
                <CardHeader title="Shares & Contributions" subtitle="Track member ownership, contribution history, and share-funded treasury growth." />
                <ResponsiveCardGrid variant="metrics" className="mb-4 md:grid-cols-3 xl:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total owned shares</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{shareSummary.totalOwnedShares.toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share price</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{shareSummary.sharePriceLabel}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Treasury from shares</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrencyNGN(shareSummary.treasuryFromShares)}</p>
                  </div>
                </ResponsiveCardGrid>
                <div className="space-y-3">
                  {(sharesQuery.data || []).map((entry) => {
                    const entryPresentation = buildCooperativeShareEntryPresentation(entry);

                    return (
                    <div key={entry.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{entryPresentation.memberName}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{entryPresentation.meta}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{entryPresentation.unitsLabel}</p>
                          <p className="text-sm text-slate-500">{entryPresentation.amountLabel}</p>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </Card>

              <Card>
                <CardHeader title="Purchase Shares" />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    shareMutation.mutate({
                      ...shareForm,
                      member_id: Number(shareForm.member_id),
                      units: Number(shareForm.units || 0),
                      price_per_share: shareForm.price_per_share ? Number(shareForm.price_per_share) : null,
                    });
                  }}
                  className="space-y-4"
                >
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={shareForm.member_id} onChange={(event) => setShareForm((current) => ({ ...current, member_id: event.target.value }))}>
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.customer?.name}</option>
                    ))}
                  </select>
                  <input type="number" min="0.01" step="0.01" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={shareForm.units} onChange={(event) => setShareForm((current) => ({ ...current, units: event.target.value }))} placeholder="Units" />
                  <input type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={shareForm.price_per_share} onChange={(event) => setShareForm((current) => ({ ...current, price_per_share: event.target.value }))} placeholder={`Default ${cooperative?.share_price || ''}`} />
                  <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={shareForm.issued_at} onChange={(event) => setShareForm((current) => ({ ...current, issued_at: event.target.value }))} />
                  <textarea className="min-h-[92px] w-full rounded-2xl border border-slate-200 px-4 py-3" value={shareForm.notes} onChange={(event) => setShareForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Contribution note" />
                  <button type="submit" className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
                    {shareMutation.isPending ? 'Saving share purchase...' : 'Save share purchase'}
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {activeSection === 'financing' ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.5fr)]">
              <Card>
                <CardHeader title="Financing" subtitle="Qard Hasan, Mudarabah, and Musharakah with cooperative controls and approvals." />
                <div className="space-y-4">
                  {(financingQuery.data || []).map((item) => {
                    const itemPresentation = buildCooperativeFinancingPresentation(item);

                    return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{itemPresentation.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{itemPresentation.description}</p>
                          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Status: {itemPresentation.statusLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{itemPresentation.amountLabel}</p>
                          <p className="text-sm text-slate-500">{itemPresentation.dueDateLabel}</p>
                        </div>
                      </div>
                      {itemPresentation.guarantors.length ? (
                        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guarantors</p>
                          <div className="mt-3 space-y-2">
                            {itemPresentation.guarantors.map((guarantor) => (
                              <div key={guarantor.id} className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-slate-700">{guarantor.memberName}</span>
                                {guarantor.pending ? (
                                  <button
                                    type="button"
                                    onClick={() => approveGuarantorMutation.mutate({ financingId: item.id, memberId: guarantor.guarantorMemberId })}
                                    className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white"
                                  >
                                    Approve guarantor
                                  </button>
                                ) : (
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{guarantor.statusLabel}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {itemPresentation.statusActions.map((statusAction) => (
                          <button
                            key={statusAction.status}
                            type="button"
                            onClick={() => updateFinancingStatusMutation.mutate({ financingId: item.id, payload: { status: statusAction.status } })}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            {statusAction.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )})}
                </div>
              </Card>

              <Card>
                <CardHeader title="New Financing Request" subtitle={financingHints[financingForm.financing_type]} />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    financingMutation.mutate({
                      ...financingForm,
                      member_id: Number(financingForm.member_id),
                      amount_requested: financingForm.amount_requested ? Number(financingForm.amount_requested) : null,
                      capital_amount: financingForm.capital_amount ? Number(financingForm.capital_amount) : null,
                      cooperative_capital: financingForm.cooperative_capital ? Number(financingForm.cooperative_capital) : null,
                      member_capital: financingForm.member_capital ? Number(financingForm.member_capital) : null,
                      profit_share_cooperative: financingForm.profit_share_cooperative ? Number(financingForm.profit_share_cooperative) : null,
                      profit_share_member: financingForm.profit_share_member ? Number(financingForm.profit_share_member) : null,
                      duration_months: financingForm.duration_months ? Number(financingForm.duration_months) : null,
                      guarantor_member_ids: financingForm.guarantor_member_ids.map((id) => Number(id)),
                    });
                  }}
                  className="space-y-4"
                >
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.member_id} onChange={(event) => setFinancingForm((current) => ({ ...current, member_id: event.target.value }))}>
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.customer?.name}</option>
                    ))}
                  </select>
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.financing_type} onChange={(event) => setFinancingForm((current) => ({ ...current, financing_type: event.target.value }))}>
                    <option value="qard_hasan">Qard Hasan</option>
                    <option value="mudarabah">Mudarabah</option>
                    <option value="musharakah">Musharakah</option>
                  </select>

                  {financingForm.financing_type === 'qard_hasan' ? (
                    <>
                      <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.amount_requested} onChange={(event) => setFinancingForm((current) => ({ ...current, amount_requested: event.target.value }))} placeholder="Loan amount" />
                      <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.repayment_due_date} onChange={(event) => setFinancingForm((current) => ({ ...current, repayment_due_date: event.target.value }))} />
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guarantors</p>
                        <div className="mt-3 space-y-2">
                          {members.map((member) => (
                            <label key={member.id} className="flex items-center gap-3 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={financingForm.guarantor_member_ids.includes(member.id)}
                                onChange={(event) => setFinancingForm((current) => ({
                                  ...current,
                                  guarantor_member_ids: event.target.checked
                                    ? [...current.guarantor_member_ids, member.id]
                                    : current.guarantor_member_ids.filter((id) => id !== member.id),
                                }))}
                              />
                              <span>{member.customer?.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {financingForm.financing_type === 'mudarabah' ? (
                    <>
                      <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.capital_amount} onChange={(event) => setFinancingForm((current) => ({ ...current, capital_amount: event.target.value }))} placeholder="Capital amount" />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="number" min="0" max="100" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.profit_share_cooperative} onChange={(event) => setFinancingForm((current) => ({ ...current, profit_share_cooperative: event.target.value }))} placeholder="Cooperative %" />
                        <input type="number" min="0" max="100" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.profit_share_member} onChange={(event) => setFinancingForm((current) => ({ ...current, profit_share_member: event.target.value }))} placeholder="Member %" />
                      </div>
                    </>
                  ) : null}

                  {financingForm.financing_type === 'musharakah' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.cooperative_capital} onChange={(event) => setFinancingForm((current) => ({ ...current, cooperative_capital: event.target.value }))} placeholder="Cooperative capital" />
                        <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.member_capital} onChange={(event) => setFinancingForm((current) => ({ ...current, member_capital: event.target.value }))} placeholder="Member capital" />
                      </div>
                      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.profit_share_ratio} onChange={(event) => setFinancingForm((current) => ({ ...current, profit_share_ratio: event.target.value }))} placeholder="Profit share ratio e.g. 55:45" />
                    </>
                  ) : null}

                  <input type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.duration_months} onChange={(event) => setFinancingForm((current) => ({ ...current, duration_months: event.target.value }))} placeholder="Duration in months" />
                  <textarea className="min-h-[92px] w-full rounded-2xl border border-slate-200 px-4 py-3" value={financingForm.business_description} onChange={(event) => setFinancingForm((current) => ({ ...current, business_description: event.target.value }))} placeholder="Business description" />
                  <button type="submit" className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
                    {financingMutation.isPending ? 'Saving financing request...' : 'Save financing request'}
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {activeSection === 'investments' ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
              <Card>
                <CardHeader title="Investments" subtitle="Cooperative-level halal investments, optionally linked to inventory items." />
                <div className="space-y-3">
                  {investmentPresentations.map((investment) => (
                    <div key={investment.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{investment.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{investment.meta}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{investment.amountLabel}</p>
                          <p className="text-sm text-slate-500">Current {investment.currentValueLabel}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Add Investment" />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    investmentMutation.mutate({
                      ...investmentForm,
                      product_id: investmentForm.product_id ? Number(investmentForm.product_id) : null,
                      amount: Number(investmentForm.amount || 0),
                      expected_return_rate: investmentForm.expected_return_rate ? Number(investmentForm.expected_return_rate) : null,
                      current_value: investmentForm.current_value ? Number(investmentForm.current_value) : null,
                    });
                  }}
                  className="space-y-4"
                >
                  <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={investmentForm.name} onChange={(event) => setInvestmentForm((current) => ({ ...current, name: event.target.value }))} placeholder="Investment title" />
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={investmentForm.product_id} onChange={(event) => setInvestmentForm((current) => ({ ...current, product_id: event.target.value }))}>
                    <option value="">Optional inventory link</option>
                    {(productsQuery.data || []).map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                  <input type="number" min="0.01" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={investmentForm.amount} onChange={(event) => setInvestmentForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount deployed" />
                  <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={investmentForm.expected_return_rate} onChange={(event) => setInvestmentForm((current) => ({ ...current, expected_return_rate: event.target.value }))} placeholder="Expected return rate %" />
                  <textarea className="min-h-[92px] w-full rounded-2xl border border-slate-200 px-4 py-3" value={investmentForm.notes} onChange={(event) => setInvestmentForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Investment note" />
                  <button type="submit" className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
                    {investmentMutation.isPending ? 'Saving investment...' : 'Save investment'}
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {activeSection === 'profits' ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
              <Card>
                <CardHeader title="Profit Distribution" subtitle="Profit cycles allocate returns by share ownership while separating reserve and charity allocations." />
                <div className="space-y-4">
                  {(profitCyclesQuery.data || []).map((cycle) => {
                    const cyclePresentation = buildCooperativeProfitCyclePresentation(cycle);

                    return (
                    <div key={cycle.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{cyclePresentation.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{cyclePresentation.dateRangeLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{cyclePresentation.distributableProfitLabel}</p>
                          <p className="text-sm text-slate-500">{cyclePresentation.statusLabel}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2">
                        {cyclePresentation.distributionsPreview.map((distribution) => (
                          <div key={distribution.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200">
                            <span className="text-sm text-slate-700">{distribution.memberName}</span>
                            <span className="text-sm font-semibold text-slate-900">{distribution.amountLabel}</span>
                          </div>
                        ))}
                      </div>
                      {cycle.status !== 'distributed' ? (
                        <button type="button" onClick={() => distributeProfitMutation.mutate(cycle.id)} className="mt-4 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white">
                          {distributeProfitMutation.isPending ? 'Marking distribution complete...' : 'Mark distribution complete'}
                        </button>
                      ) : null}
                    </div>
                  )})}
                </div>
              </Card>

              <Card>
                <CardHeader title="Create Profit Cycle" />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    profitCycleMutation.mutate({
                      ...profitForm,
                      total_profit: Number(profitForm.total_profit || 0),
                      reserve_allocation: Number(profitForm.reserve_allocation || 0),
                      charity_allocation: Number(profitForm.charity_allocation || 0),
                    });
                  }}
                  className="space-y-4"
                >
                  <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={profitForm.label} onChange={(event) => setProfitForm((current) => ({ ...current, label: event.target.value }))} placeholder="Cycle label" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={profitForm.cycle_start} onChange={(event) => setProfitForm((current) => ({ ...current, cycle_start: event.target.value }))} />
                    <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={profitForm.cycle_end} onChange={(event) => setProfitForm((current) => ({ ...current, cycle_end: event.target.value }))} />
                  </div>
                  <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={profitForm.total_profit} onChange={(event) => setProfitForm((current) => ({ ...current, total_profit: event.target.value }))} placeholder="Total profit" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={profitForm.reserve_allocation} onChange={(event) => setProfitForm((current) => ({ ...current, reserve_allocation: event.target.value }))} placeholder="Reserve allocation" />
                    <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={profitForm.charity_allocation} onChange={(event) => setProfitForm((current) => ({ ...current, charity_allocation: event.target.value }))} placeholder="Charity allocation" />
                  </div>
                  <textarea className="min-h-[92px] w-full rounded-2xl border border-slate-200 px-4 py-3" value={profitForm.notes} onChange={(event) => setProfitForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Cycle note" />
                  <button type="submit" className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
                    {profitCycleMutation.isPending ? 'Saving profit cycle...' : 'Save profit cycle'}
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {activeSection === 'withdrawals' ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
              <Card>
                <CardHeader title="Withdrawals" subtitle="Profit withdrawals and share redemptions with liquidity discipline." />
                <div className="space-y-3">
                  {withdrawalPresentations.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.memberName}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{item.meta}</p>
                        </div>
                        <p className="font-semibold text-slate-900">{item.amountLabel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <CardHeader title="New Withdrawal" />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    withdrawalMutation.mutate({
                      ...withdrawalForm,
                      member_id: Number(withdrawalForm.member_id),
                      amount: Number(withdrawalForm.amount || 0),
                    });
                  }}
                  className="space-y-4"
                >
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={withdrawalForm.member_id} onChange={(event) => setWithdrawalForm((current) => ({ ...current, member_id: event.target.value }))}>
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.customer?.name}</option>
                    ))}
                  </select>
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={withdrawalForm.withdrawal_type} onChange={(event) => setWithdrawalForm((current) => ({ ...current, withdrawal_type: event.target.value }))}>
                    <option value="profit_withdrawal">Profit withdrawal</option>
                    <option value="share_redemption">Share redemption</option>
                  </select>
                  <input type="number" min="0.01" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={withdrawalForm.amount} onChange={(event) => setWithdrawalForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount" />
                  <textarea className="min-h-[92px] w-full rounded-2xl border border-slate-200 px-4 py-3" value={withdrawalForm.reason} onChange={(event) => setWithdrawalForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason" />
                  <button type="submit" className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
                    {withdrawalMutation.isPending ? 'Saving withdrawal request...' : 'Save withdrawal request'}
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {activeSection === 'governance' ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
              <Card>
                <CardHeader title="Governance" subtitle="Meetings, audits, resolutions, and policy records." />
                <div className="space-y-3">
                  {governanceRecordPresentations.map((record) => (
                    <div key={record.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{record.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{record.meta}</p>
                        </div>
                      </div>
                      {record.summary ? <p className="mt-3 text-sm text-slate-600">{record.summary}</p> : null}
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <CardHeader title="Add Governance Record" />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    governanceMutation.mutate(governanceForm);
                  }}
                  className="space-y-4"
                >
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={governanceForm.record_type} onChange={(event) => setGovernanceForm((current) => ({ ...current, record_type: event.target.value }))}>
                    <option value="meeting">Meeting</option>
                    <option value="audit">Audit</option>
                    <option value="resolution">Resolution</option>
                    <option value="policy">Policy</option>
                  </select>
                  <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={governanceForm.title} onChange={(event) => setGovernanceForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" />
                  <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={governanceForm.record_date} onChange={(event) => setGovernanceForm((current) => ({ ...current, record_date: event.target.value }))} />
                  <textarea className="min-h-[92px] w-full rounded-2xl border border-slate-200 px-4 py-3" value={governanceForm.summary} onChange={(event) => setGovernanceForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Summary" />
                  <button type="submit" className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
                    {governanceMutation.isPending ? 'Saving governance record...' : 'Save governance record'}
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {activeSection === 'reports' ? (
            <ResponsiveCardGrid variant="cards" className="md:grid-cols-2 xl:grid-cols-3">
              {reportCards.map((item) => (
                <Card key={item.key}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {item.value}
                  </p>
                </Card>
              ))}
            </ResponsiveCardGrid>
          ) : null}

          {activeSection === 'settings' ? (
            <Card>
              <CardHeader title="Cooperative Settings" subtitle="Current setup, loan rules, branding tier, and subscription alignment." />
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Core setup</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {settingsSummary.coreSetup.map((item) => (
                      <p key={item.label}>{item.label}: {item.value}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qard Hasan rules</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {settingsSummary.qardHasanRules.map((item) => (
                      <p key={item.label}>{item.label}: {item.value}</p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : null}
        </>
      ) : null}
    </PageShell>
  );
}
