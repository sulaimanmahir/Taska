import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import { FinanceFormError, FinanceFormHint, FinanceReasonBadge } from '../components/FinanceFormFeedback';
import FinanceLensSummary from '../components/FinanceLensSummary';
import FinanceMobileShortcutRail from '../components/FinanceMobileShortcutRail';
import FinanceInputField from '../components/FinanceInputField';
import FinanceRecommendationCard from '../components/FinanceRecommendationCard';
import FinanceRecommendationInline from '../components/FinanceRecommendationInline';
import FinanceSelectionBanner from '../components/FinanceSelectionBanner';
import { FinanceInfoCard, FinanceLoadingState, FinanceUnavailableState } from '../components/FinanceStatePanel';
import LedgerFilterBar from '../components/LedgerFilterBar';
import ModalShell, { ModalActions } from '../components/ModalShell';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { useModalShell } from '../components/ModalShellContext';
import ResultsPagination from '../components/ResultsPagination';
import StatementPanel from '../components/StatementPanel';
import Toast from '../components/Toast';
import { trustLedgerViews, trustSortOptions, useTrustFundDesk } from '../hooks/useTrustFundDesk';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildTrustFundMobileActions,
  buildTrustFundStatementActions,
  getTrustFundPrimaryActionKey,
  runTrustFundPrimaryAction,
} from '../lib/financeActionRouting';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildTrustFundLedgerAccountPresentation,
  buildTrustFundOverdueAccountPresentation,
  buildTrustFundStatementPanelSummaryItems,
  getTrustFundStatementEntryMeta,
  getTrustFundStatementEntryTitle,
  mapTrustFundStatementPanelEntries,
} from '../lib/trustFund';

const trustStatementViews = [
  { id: 'all', label: 'All activity' },
  { id: 'draw', label: 'Draws' },
  { id: 'repayment', label: 'Repayments' },
];

const statementDatePresets = [
  { id: 'all', label: 'All time' },
  { id: 'month', label: 'This month' },
  { id: 'last30', label: 'Last 30 days' },
];

const statementViewLabels = {
  all: 'All activity',
  draw: 'Draws',
  repayment: 'Repayments',
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

export default function TrustFund() {
  const {
    emptyTrustForm,
    ledgerRef,
    accountActivityRef,
    showModal,
    setShowModal,
    modalType,
    setModalType,
    selectedAccount,
    setSelectedAccount,
    selectedLedgerAccountId,
    setSelectedLedgerAccountId,
    setForm,
    setAmount,
    setModalBaseline,
    transactionAutoFillHint,
    setTransactionAutoFillHint,
    toast,
    resetTrustModal,
    openDraw,
    openRepay,
    accountsList,
    statementView,
    setStatementView,
    statementDatePreset,
    statementDateRange,
    showAllStatement,
    setShowAllStatement,
    handleStatementPresetChange,
    handleStatementDateChange,
    resetStatementFilters,
    filtersAreActive,
    setAccountsPage,
    searchTerm,
    setSearchTerm,
    activeView,
    setActiveView,
    activeSort,
    setActiveSort,
    hasSearch,
    accountsLoading,
    accountsFetching,
    accountsFailed,
    accountsError,
    overdueList,
    overdueFailed,
    customersFailed,
    customersError,
    trustDeskQueries,
    trustDeskError,
    handleCreate,
    handleTransaction,
    orderedAccountsList,
    selectedLedgerAccount,
    activeSortLabel,
    activeRailAction,
    scrollToLedger,
    scrollToAccountActivity,
    openSelectedLedgerAction,
    ledgerLensItems,
    statementAccount,
    modalBusy,
    createErrorMessageText,
    transactionErrorMessageText,
    accountRecommendation,
    availableToDraw,
    drawShortcutPresentation,
    recommendedDrawAmount,
    recommendedRepaymentAmount,
    repayShortcutPresentation,
    selectedOutstanding,
    transactionAutoFillPresentation,
    transactionPositiveMessage,
    transactionRecommendation,
    transactionRecommendationNextReviewDate,
    transactionRecommendationRiskLevel,
    transactionRecommendationTone,
    transactionRecommendationWhy,
    transactionValidationMessage,
    transactionSubmitDisabled,
    trustModalDirty,
    summary,
    pagination,
    statementCounts,
    filteredStatement,
    statementSummary,
    statementDateSummary,
    createModalFields,
    transactionModalFields,
    customerFieldConfig,
    handleExportStatement,
    handlePrintStatement,
    statementLoading,
    statementFailed,
    statementError,
    statementTransactions,
  } = useTrustFundDesk();

  return (
    <div className="space-y-6 pb-28 md:pb-6">
      {trustDeskQueries.some((query) => query.isError) ? (
        <QueryErrorPanel
          message={trustDeskError}
          onRetry={() => {
            trustDeskQueries.forEach((query) => query.refetch());
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Trust Fund Desk"
        title="Trust Fund"
        description="Manage credit limits, controlled draws, and disciplined collections from one clean finance surface."
        actions={(
          <Button
            onClick={() => {
              setModalType('create');
              setSelectedAccount(null);
              setForm(emptyTrustForm);
              setAmount('');
              setTransactionAutoFillHint(null);
              setModalBaseline({ modalType: 'create', form: emptyTrustForm, amount: '' });
              setShowModal(true);
            }}
          >
            New trust account
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <OpsMetricCard
          label="Total Extended"
          value={formatCurrencyNGN(summary.totalExtended)}
          helper="Credit released to customers"
          tone="amber"
        />
        <OpsMetricCard
          label="Total Collected"
          value={formatCurrencyNGN(summary.totalCollected)}
          helper="Repayments already recovered"
          tone="emerald"
        />
        <OpsMetricCard
          label="Outstanding"
          value={formatCurrencyNGN(summary.totalOutstanding)}
          helper="Balance still at risk"
          tone="rose"
        />
      </div>

      {overdueList.length > 0 ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardHeader
            title={`Overdue Accounts (${overdueList.length})`}
            subtitle="These accounts need active collection follow-up."
          />
            <div className="space-y-3" role="list" aria-label="Overdue trust accounts">
              {overdueList.map((account) => {
                const {
                  ariaLabel,
                  ctaLabel,
                  customerName,
                  overdueAmountLabel,
                  recommendation,
                  recommendationPresentation,
                } = buildTrustFundOverdueAccountPresentation(account);

                return (
                  <div key={account.id} role="listitem" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                    <p className="font-semibold text-slate-900">{customerName}</p>
                    <p className="mt-1 text-sm text-rose-700">{overdueAmountLabel}</p>
                   <FinanceRecommendationInline
                    recommendation={recommendation}
                     defaultTone="amber"
                     summaryLabel={recommendationPresentation.summaryLabel}
                     summaryTone={recommendationPresentation.summaryTone}
                    className="mt-3"
                  />
                </div>
                  <Button
                    onClick={() => openRepay(account)}
                    size="lg"
                    className="rounded-2xl shadow-sm"
                    aria-label={ariaLabel}
                  >
                    {ctaLabel}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      ) : overdueFailed ? (
        <FinanceInfoCard
          title="Overdue Accounts"
          subtitle="The overdue list is temporarily unavailable, but you can still work from the main account desk."
        />
      ) : null}

      <div ref={ledgerRef}>
      <Card padding={false} className="overflow-hidden">
        <LedgerFilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search customers by name, phone, or email"
          views={trustLedgerViews}
          activeView={activeView}
          onViewChange={setActiveView}
          sortOptions={trustSortOptions}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          className="border-b border-slate-100 px-5 py-4"
        />
        <FinanceLensSummary items={ledgerLensItems} className="border-b border-slate-100 px-5 py-4" />
        {accountsLoading ? (
          <FinanceLoadingState message="Loading trust accounts..." className="px-5 py-10 text-center text-sm text-slate-500" />
        ) : accountsFailed ? (
          <FinanceUnavailableState
            title="Trust accounts are unavailable"
            description={getErrorMessage(accountsError, 'We could not load trust accounts right now. Refresh and try again.')}
            className="py-10"
          />
        ) : accountsList.length > 0 ? (
          <>
            <div className="space-y-3 px-4 pb-4 md:hidden" role="list" aria-label="Trust accounts">
              {orderedAccountsList.map((account) => {
                const {
                  drawAriaLabel,
                  drawLabel,
                  outstanding,
                  recommendation,
                  recommendationPresentation,
                  repayAriaLabel,
                  repayLabel,
                  statusClassName,
                  statusLabel,
                  utilization,
                } = buildTrustFundLedgerAccountPresentation(account);
                const isSelected = selectedLedgerAccountId === account.id;

                return (
                  <div
                    key={account.id}
                    role="listitem"
                    className={`rounded-2xl border p-4 transition ${
                      isSelected
                        ? 'border-amber-300 bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(251,191,36,0.05))] shadow-sm'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedLedgerAccountId(account.id)}
                      aria-pressed={isSelected}
                      aria-label={`Select trust account for ${account.customer?.name ?? 'customer'}`}
                      className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{account.customer?.name}</p>
                          <p className="mt-1 text-xs text-slate-500">Utilization {utilization.toFixed(1)}% of limit</p>
                          <FinanceRecommendationInline
                            recommendation={recommendation}
                            defaultTone="violet"
                            summaryLabel={recommendationPresentation.summaryLabel}
                            summaryTone={recommendationPresentation.summaryTone}
                            className="mt-3"
                          />
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {isSelected ? (
                        <span className="mt-3 inline-flex rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                          Selected account
                        </span>
                      ) : null}
                    </button>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Limit</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatCurrencyNGN(account.limit)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Outstanding</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatCurrencyNGN(outstanding)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500">Recovered so far</p>
                        <p className="mt-1 font-semibold text-emerald-700">{formatCurrencyNGN(account.total_repaid || 0)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        onClick={() => openDraw(account)}
                        aria-label={drawAriaLabel}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
                      >
                        {drawLabel}
                      </button>
                      <button
                        onClick={() => openRepay(account)}
                        aria-label={repayAriaLabel}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                      >
                        {repayLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <table className="hidden w-full md:table">
              <caption className="sr-only">
                Trust accounts ledger with customer, limit, outstanding balance, status, and row actions.
              </caption>
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customer</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Limit</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Outstanding</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderedAccountsList.map((account) => {
                  const {
                    drawAriaLabel,
                    drawLabel,
                    outstanding,
                    recommendation,
                    recommendationPresentation,
                    repayAriaLabel,
                    repayLabel,
                    statusClassName,
                    statusLabel,
                    utilization,
                  } = buildTrustFundLedgerAccountPresentation(account);
                  const isSelected = selectedLedgerAccountId === account.id;
                  return (
                    <tr
                      key={account.id}
                      className={`border-t border-slate-100 transition ${isSelected ? 'bg-[linear-gradient(90deg,rgba(245,158,11,0.10),rgba(251,191,36,0.05))]' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => setSelectedLedgerAccountId(account.id)}
                          aria-pressed={isSelected}
                          aria-label={`Select trust account for ${account.customer?.name ?? 'customer'}`}
                          className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
                        >
                          <span>{account.customer?.name}</span>
                          <p className="mt-1 text-xs text-slate-500">
                            Utilization {utilization.toFixed(1)}% of limit
                          </p>
                          <FinanceRecommendationInline
                            recommendation={recommendation}
                            defaultTone="violet"
                            summaryLabel={recommendationPresentation.summaryLabel}
                            summaryTone={recommendationPresentation.summaryTone}
                            className="mt-2"
                          />
                          {isSelected ? (
                            <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                              Selected account
                            </span>
                          ) : null}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatCurrencyNGN(account.limit)}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>
                          <p className="font-semibold text-slate-900">{formatCurrencyNGN(outstanding)}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatCurrencyNGN(account.total_repaid || 0)} recovered</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openDraw(account)}
                            aria-label={drawAriaLabel}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
                          >
                            {drawLabel}
                          </button>
                          <button
                            onClick={() => openRepay(account)}
                            aria-label={repayAriaLabel}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                          >
                            {repayLabel}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <EmptyState
            icon="M11 17a1 1 0 001 1h4a1 1 0 001-1m-6 0V9a4 4 0 118 0v8m-8 0H7a1 1 0 01-1-1v-3a2 2 0 012-2h8a2 2 0 012 2v3a1 1 0 01-1 1h-1"
            title={hasSearch ? 'No matching trust accounts' : 'No trust accounts yet'}
            description={hasSearch
              ? 'Try a different customer name, phone number, or email address.'
              : 'Open the first trust account to start tracking controlled draws and repayments.'}
            tone={hasSearch ? 'amber' : 'violet'}
            className="py-10"
          />
        )}
        <ResultsPagination
          currentPage={pagination.currentPage}
          lastPage={pagination.lastPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
          itemLabel="accounts"
          isFetching={accountsFetching && !accountsLoading}
          sortLabel={activeSortLabel}
          onPrevious={() => setAccountsPage((current) => Math.max(1, current - 1))}
          onNext={() => setAccountsPage((current) => Math.min(pagination.lastPage, current + 1))}
        />
      </Card>
      </div>

      <div ref={accountActivityRef}>
      <Card>
        <CardHeader
          title="Account activity"
          subtitle={statementAccount ? `${statementAccount.customer?.name} draw and repayment history` : 'Select a trust account to inspect its movement history'}
        />
        {selectedLedgerAccountId ? (
          statementLoading ? (
            <FinanceLoadingState message="Loading trust account activity..." className="py-8 text-sm text-slate-500" />
          ) : statementFailed ? (
            <FinanceUnavailableState
              title="Account activity is unavailable"
              description={getErrorMessage(statementError, 'We could not load this account history right now.')}
              tone="amber"
            />
          ) : statementTransactions.length > 0 ? (
            <div className="space-y-4">
              <FinanceSelectionBanner
                eyebrow="Selected trust account"
                title={statementAccount.customer?.name || 'Selected customer'}
                subtitle={`Credit limit ${formatCurrencyNGN(statementAccount.limit)}`}
                tone="amber"
                metrics={[
                  { label: 'Outstanding', value: formatCurrencyNGN(statementAccount.balance), toneClass: Number(statementAccount.balance || 0) > 0 ? 'text-amber-700' : 'text-emerald-700' },
                  { label: 'Filtered entries', value: String(filteredStatement.length) },
                  { label: 'Activity view', value: statementViewLabels[statementView] },
                ]}
                helper="Select another ledger row to inspect its history, or use the row actions to save a draw or repayment."
              />
              <StatementPanel
                accent="amber"
                summaryItems={buildTrustFundStatementPanelSummaryItems(statementSummary)}
                navigationActions={buildTrustFundStatementActions({
                  account: statementAccount,
                  onBackToLedger: scrollToLedger,
                  onOpenPrimary: () => runTrustFundPrimaryAction(statementAccount, { openDraw, openRepay }),
                  activeLabel: activeRailAction,
                })}
                toolbarProps={{
                  onPrint: handlePrintStatement,
                  onExport: handleExportStatement,
                  datePresets: statementDatePresets,
                  activeDatePreset: statementDatePreset,
                  onDatePresetChange: handleStatementPresetChange,
                  activityViews: trustStatementViews,
                  activeActivityView: statementView,
                  activityCounts: statementCounts,
                  onActivityViewChange: setStatementView,
                  dateRange: statementDateRange,
                  onDateChange: handleStatementDateChange,
                  activeViewLabel: statementViewLabels[statementView],
                  dateSummary: statementDateSummary,
                  showReset: filtersAreActive,
                  onReset: resetStatementFilters,
                  accent: 'amber',
                }}
                entries={mapTrustFundStatementPanelEntries(filteredStatement)}
                showAll={showAllStatement}
                onToggleShowAll={() => setShowAllStatement((current) => !current)}
                renderTitle={getTrustFundStatementEntryTitle}
                renderMeta={getTrustFundStatementEntryMeta}
                renderAmount={(transaction) => (
                  <span className={transaction.type === 'draw' ? 'text-amber-700' : 'text-emerald-700'}>
                    {formatCurrencyNGN(Math.abs(transaction.amount))}
                  </span>
                )}
                emptyState={{
                  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
                  title: statementView === 'draw' ? 'No draws on this account yet' : 'No repayments on this account yet',
                  description: 'Switch filters or record new activity to build the account history.',
                }}
              />
            </div>
          ) : (
            <EmptyState
              icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
              title="No account activity yet"
              description="The first draw or repayment on this account will appear here."
              tone="emerald"
            />
          )
        ) : (
          <EmptyState
            icon="M4 6h16M4 12h16M4 18h16"
            title="Choose an account to view history"
            description="Activity history helps you verify what was released, what was recovered, and the balance after each move."
            tone="amber"
          />
        )}
      </Card>
      </div>

      {showModal ? (
        <ModalShell
          title={modalType === 'create' ? 'Save Trust Account' : modalType === 'draw' ? 'Save Draw' : 'Save Repayment'}
          subtitle={modalType === 'create' ? 'Set the customer credit limit and account note.' : `Working on ${selectedAccount?.customer?.name || 'selected account'}.`}
          size="2xl"
          tone={modalType === 'create' ? 'violet' : modalType === 'draw' ? 'amber' : 'emerald'}
          headerLayout="stacked"
          stickyHeader
          busy={modalBusy}
          dismissPreset="guarded"
          busyDismissPreset="locked"
          draftState={modalBusy ? 'saving' : trustModalDirty ? 'dirty' : null}
          draftStatePreset={modalType === 'create' ? 'setup' : 'editor'}
          closeGuardPreset={modalType === 'create' ? 'cancelSetup' : 'leaveEditor'}
          scrollAreaClassName="pr-0"
          bodyClassName="pb-1"
          headerBadgePreset={modalType === 'create' ? 'setup' : 'action'}
          headerBadgeTone={modalType === 'create' ? 'violet' : modalType === 'draw' ? 'amber' : 'emerald'}
          headerBadgeLabel={modalType === 'create' ? 'Account setup' : modalType === 'draw' ? 'Draw action' : 'Repayment action'}
          onClose={resetTrustModal}
        >
          <TrustFundModalForm
            accountRecommendation={accountRecommendation}
            availableToDraw={availableToDraw}
            createErrorMessageText={createErrorMessageText}
            createModalFields={createModalFields}
            customerFieldConfig={customerFieldConfig}
            customersError={customersError}
            customersFailed={customersFailed}
            drawShortcutPresentation={drawShortcutPresentation}
            handleCreate={handleCreate}
            handleTransaction={handleTransaction}
            modalBusy={modalBusy}
            modalType={modalType}
            recommendedDrawAmount={recommendedDrawAmount}
            recommendedRepaymentAmount={recommendedRepaymentAmount}
            repayShortcutPresentation={repayShortcutPresentation}
            selectedAccount={selectedAccount}
            selectedOutstanding={selectedOutstanding}
            setAmount={setAmount}
            setTransactionAutoFillHint={setTransactionAutoFillHint}
            transactionAutoFillHint={transactionAutoFillHint}
            transactionAutoFillPresentation={transactionAutoFillPresentation}
            transactionErrorMessageText={transactionErrorMessageText}
            transactionModalFields={transactionModalFields}
            transactionPositiveMessage={transactionPositiveMessage}
            transactionRecommendation={transactionRecommendation}
            transactionRecommendationNextReviewDate={transactionRecommendationNextReviewDate}
            transactionRecommendationRiskLevel={transactionRecommendationRiskLevel}
            transactionRecommendationTone={transactionRecommendationTone}
            transactionRecommendationWhy={transactionRecommendationWhy}
            transactionSubmitDisabled={transactionSubmitDisabled}
            transactionValidationMessage={transactionValidationMessage}
          />
        </ModalShell>
      ) : null}

      <Toast tone={toast?.tone} message={toast?.message} />
      {selectedLedgerAccount ? (
        <FinanceMobileShortcutRail
          title={selectedLedgerAccount.customer?.name || 'Selected customer'}
          subtitle={getTrustFundPrimaryActionKey(selectedLedgerAccount) === 'repay'
            ? 'Outstanding balance needs attention'
            : 'Account is clear and ready for a draw'}
          activeActionLabel={activeRailAction}
          tone="amber"
          actions={buildTrustFundMobileActions({
            account: selectedLedgerAccount,
            onLedger: scrollToLedger,
            onPrimary: openSelectedLedgerAction,
            onActivity: scrollToAccountActivity,
          })}
        />
      ) : null}
    </div>
  );
}

function TrustFundModalForm({
  accountRecommendation,
  availableToDraw,
  createErrorMessageText,
  createModalFields,
  customerFieldConfig,
  customersError,
  customersFailed,
  drawShortcutPresentation,
  handleCreate,
  handleTransaction,
  modalBusy,
  modalType,
  recommendedDrawAmount,
  recommendedRepaymentAmount,
  repayShortcutPresentation,
  selectedAccount,
  selectedOutstanding,
  setAmount,
  setTransactionAutoFillHint,
  transactionAutoFillHint,
  transactionAutoFillPresentation,
  transactionErrorMessageText,
  transactionModalFields,
  transactionPositiveMessage,
  transactionRecommendation,
  transactionRecommendationNextReviewDate,
  transactionRecommendationRiskLevel,
  transactionRecommendationTone,
  transactionRecommendationWhy,
  transactionSubmitDisabled,
  transactionValidationMessage,
}) {
  const modal = useModalShell();

  return (
    <form onSubmit={modalType === 'create' ? handleCreate : handleTransaction} className="space-y-4">
      {modalType === 'create' ? (
        <>
          <FinanceFormError message={createErrorMessageText} />
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Account setup</p>
            <div className="mt-3 space-y-3">
              <div>
                <FinanceInputField field={customerFieldConfig} value={customerFieldConfig.value} onChange={customerFieldConfig.onChange} />
                <FinanceFormHint
                  id="trust-customer-error"
                  message={customersFailed ? getErrorMessage(customersError, 'Customer list is unavailable right now.') : null}
                  className="mt-2"
                />
              </div>
              {createModalFields.map((field) => <FinanceInputField key={field.key} field={field} value={field.value} onChange={field.onChange} />)}
            </div>
          </div>
        </>
      ) : (
        <>
          <FinanceFormError message={transactionErrorMessageText} />
          <FinanceSelectionBanner
            eyebrow={modalType === 'draw' ? 'Draw action' : 'Repayment action'}
            title={selectedAccount?.customer?.name || 'Selected customer'}
            subtitle={`Available limit ${formatCurrencyNGN(selectedAccount?.limit || 0)}`}
            tone="amber"
            metrics={[
              {
                label: modalType === 'draw' ? 'Outstanding now' : 'Outstanding before repayment',
                value: formatCurrencyNGN(selectedAccount?.balance || 0),
                toneClass: Number(selectedAccount?.balance || 0) > 0 ? 'text-amber-700' : 'text-emerald-700',
              },
              {
                label: 'Recovered so far',
                value: formatCurrencyNGN(selectedAccount?.total_repaid || 0),
              },
            ]}
            helper={modalType === 'draw'
              ? `Use draws only when the customer is approved to take more credit from this limit. Remaining headroom: ${formatCurrencyNGN(availableToDraw)}.`
              : `Repayments reduce the current outstanding balance on this account. Current outstanding: ${formatCurrencyNGN(selectedOutstanding)}.`}
          />
          {transactionModalFields.map((field) => <FinanceInputField key={field.key} field={field} value={field.value} onChange={field.onChange} />)}
          <FinanceFormHint message={transactionAutoFillHint} className="text-sky-700" />
          <FinanceReasonBadge label={transactionAutoFillPresentation?.badge?.label} tone={transactionAutoFillPresentation?.badge?.tone} />
          <FinanceFormHint message={transactionAutoFillPresentation?.why} className="text-slate-500" />
          <FinanceFormHint message={transactionValidationMessage} />
          <FinanceFormHint message={transactionPositiveMessage} className={transactionValidationMessage ? '' : 'text-emerald-600'} />
          <FinanceRecommendationCard
            message={transactionRecommendation}
            tone={transactionRecommendationTone}
            summaryLabel={transactionAutoFillPresentation?.summaryLabel}
            summaryTone={transactionAutoFillPresentation?.summaryTone}
            why={transactionRecommendationWhy}
            riskLevel={transactionRecommendationRiskLevel}
            nextReviewDate={transactionRecommendationNextReviewDate}
          />
          <div className="flex flex-wrap gap-2">
            {modalType === 'draw' && availableToDraw > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setTransactionAutoFillHint(null);
                  setAmount(String(recommendedDrawAmount));
                }}
                aria-label={`Use available draw limit ${formatCurrencyNGN(recommendedDrawAmount)}`}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
              >
                {accountRecommendation?.action === 'draw_within_limit'
                  ? `${drawShortcutPresentation?.badge?.label || 'Within headroom'}: use remaining headroom`
                  : 'Use remaining headroom'}
              </button>
            ) : null}
            {modalType === 'repay' && selectedOutstanding > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setTransactionAutoFillHint(null);
                  setAmount(String(recommendedRepaymentAmount));
                }}
                aria-label={`Clear outstanding balance ${formatCurrencyNGN(recommendedRepaymentAmount)}`}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              >
                {(accountRecommendation?.action === 'collect_repayment_first' || accountRecommendation?.action === 'account_clear')
                  ? `${repayShortcutPresentation?.badge?.label || 'Risk reduction'}: clear outstanding`
                  : 'Clear outstanding'}
              </button>
            ) : null}
          </div>
        </>
      )}
      <ModalActions tone={modalType === 'create' ? 'violet' : modalType === 'draw' ? 'amber' : 'emerald'} preset="form">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={modal.requestClose}
          disabled={modalBusy}
          data-modal-dismiss="true"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={transactionSubmitDisabled}
        >
          {modalBusy ? 'Saving...' : 'Save'}
        </Button>
      </ModalActions>
    </form>
  );
}
