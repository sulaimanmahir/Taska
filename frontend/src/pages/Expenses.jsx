import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import ModalShell, { ModalActions } from '../components/ModalShell';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { useModalShell } from '../components/ModalShellContext';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildExpenseCategoryCard,
  buildExpenseCategoryPayload,
  buildExpenseLedgerRow,
  buildExpenseOverviewMetrics,
  buildExpensePayload,
  createExpenseCategoryForm,
  createExpenseForm,
  filterExpenseLedger,
  getExpenseDatePresets,
} from '../lib/expenses';
import { formatCurrencyNGN } from '../lib/financeFormatters';

function buildExpenseReportParams(dateFrom, dateTo) {
  return { params: { date_from: dateFrom, date_to: dateTo } };
}

export default function Expenses() {
  const queryClient = useQueryClient();
  const datePresets = useMemo(() => getExpenseDatePresets(), []);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState(() => createExpenseForm());
  const [categoryForm, setCategoryForm] = useState(() => createExpenseCategoryForm());
  const [filters, setFilters] = useState({
    categoryId: '',
    dateFrom: datePresets.monthStart,
    dateTo: datePresets.today,
    search: '',
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses', filters.categoryId, filters.dateFrom, filters.dateTo],
    queryFn: () =>
      api.get('/expenses', {
        params: {
          category_id: filters.categoryId || undefined,
          date_from: filters.dateFrom || undefined,
          date_to: filters.dateTo || undefined,
        },
      }).then((response) => response.data),
  });

  const categoriesQuery = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => api.get('/expense-categories').then((response) => response.data ?? []),
  });

  const todaySummaryQuery = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: () => api.get('/expenses/summary').then((response) => response.data ?? {}),
  });

  const weekReportQuery = useQuery({
    queryKey: ['expenses-report', 'week', datePresets.weekStart, datePresets.today],
    queryFn: () =>
      api.get('/reports/expenses', buildExpenseReportParams(datePresets.weekStart, datePresets.today))
        .then((response) => response.data ?? {}),
  });

  const monthReportQuery = useQuery({
    queryKey: ['expenses-report', 'month', datePresets.monthStart, datePresets.today],
    queryFn: () =>
      api.get('/reports/expenses', buildExpenseReportParams(datePresets.monthStart, datePresets.today))
        .then((response) => response.data ?? {}),
  });

  const expenses = expensesQuery.data;
  const categories = categoriesQuery.data ?? [];
  const todaySummary = todaySummaryQuery.data;
  const weekReport = weekReportQuery.data;
  const monthReport = monthReportQuery.data;
  const expensesLoading = expensesQuery.isLoading;
  const expenseQueries = [expensesQuery, categoriesQuery, todaySummaryQuery, weekReportQuery, monthReportQuery];
  const loadError = getErrorMessage(
    expenseQueries.find((query) => query.isError)?.error,
    'We could not load part of the expense workspace right now. Please try again.'
  );

  const invalidateExpenses = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-report'] });
    queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
  };

  const createExpense = useMutation({
    mutationFn: (payload) => api.post('/expenses', payload).then((response) => response.data),
    onSuccess: () => {
      invalidateExpenses();
      setShowExpenseModal(false);
      setExpenseForm(createExpenseForm());
    },
  });

  const createCategory = useMutation({
    mutationFn: (payload) => api.post('/expense-categories', payload).then((response) => response.data),
    onSuccess: () => {
      invalidateExpenses();
      setShowCategoryModal(false);
      setCategoryForm(createExpenseCategoryForm());
    },
  });

  const expenseModalDirty = JSON.stringify(expenseForm) !== JSON.stringify(createExpenseForm());
  const categoryModalDirty = JSON.stringify(categoryForm) !== JSON.stringify(createExpenseCategoryForm());
  const todayCategoryMap = Object.fromEntries((todaySummary?.by_category ?? []).map((item) => [item.name, Number(item.total || 0)]));
  const categoryCards = categories.map((category) => buildExpenseCategoryCard(category, todayCategoryMap, formatCurrencyNGN));
  const ledgerRows = filterExpenseLedger(
    (expenses?.data ?? []).map((expense) => buildExpenseLedgerRow(expense, formatCurrencyNGN)),
    filters.search
  );
  const metrics = buildExpenseOverviewMetrics({
    todaySummary,
    weekTotal: Number(weekReport?.total || 0),
    monthTotal: Number(monthReport?.total || 0),
    categories,
  }, formatCurrencyNGN);

  return (
    <div className="space-y-6">
      {loadError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            expenseQueries.forEach((query) => {
              query.refetch();
            });
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Expense Control"
        title="Expenses and category discipline"
        description="Capture operating spend, keep categories clean, and spot where cash pressure is concentrating before it spreads."
        actions={(
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setShowCategoryModal(true)}>
              New category
            </Button>
            <Button onClick={() => setShowExpenseModal(true)}>
              New expense
            </Button>
          </div>
        )}
      />

      <ResponsiveCardGrid variant="metrics" className="xl:grid-cols-5">
        {metrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader
            title="Today by Category"
            subtitle="See where today’s operating spend is clustering so owners can challenge drift early."
          />
          <div className="space-y-3">
            {(todaySummary?.by_category ?? []).length ? (
              (todaySummary?.by_category ?? []).map((item) => (
                <div key={item.name} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">Spend recorded today</p>
                    </div>
                    <p className="text-right text-sm font-semibold text-slate-900">
                      {formatCurrencyNGN(item.total || 0)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No expense activity has been recorded yet today.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Expense Categories"
            subtitle="Keep the spend structure ready for clean capture, reporting, and future AI insights."
          />
          <div className="space-y-3">
            {categoryCards.length ? (
              categoryCards.map((category) => (
                <div key={category.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{category.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{category.descriptionLabel}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {category.usageLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{category.todayAmountLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">{category.statusLabel}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No categories yet. Create one before logging controlled business spend.
              </p>
            )}
          </div>
        </Card>
      </section>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Expense Register</p>
              <p className="mt-1 text-sm text-slate-500">
                Filter ledger activity by date, category, or text to review where spend is moving.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <select
                className="input"
                value={filters.categoryId}
                onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="date"
                value={filters.dateFrom}
                onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
              />
              <input
                className="input"
                type="date"
                value={filters.dateTo}
                onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
              />
              <input
                className="input"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search expense register"
              />
            </div>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payment</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reference</th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {ledgerRows.map((expense) => (
              <tr key={expense.id} className="border-t border-slate-100">
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-900">{expense.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{expense.approvalLabel}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {expense.categoryLabel}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500">{expense.dateLabel}</td>
                <td className="px-5 py-4 text-slate-500">{expense.paymentMethodLabel}</td>
                <td className="px-5 py-4 text-slate-500">{expense.referenceLabel}</td>
                <td className="px-5 py-4 text-right font-medium text-slate-900">{expense.amountLabel}</td>
              </tr>
            ))}
            {!ledgerRows.length ? (
              <tr className="border-t border-slate-100">
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                  {expensesLoading ? 'Loading expenses...' : 'No expenses matched the current filters.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      {showExpenseModal ? (
        <ModalShell
          title="Save Expense"
          subtitle="Capture the spend with the right category, payment rail, and traceable date."
          tone="amber"
          busy={createExpense.isPending}
          dismissPreset="guarded"
          busyDismissPreset="locked"
          draftState={createExpense.isPending ? 'saving' : expenseModalDirty ? 'dirty' : null}
          draftStatePreset="pending"
          closeGuardPreset="discardDraft"
          scrollAreaClassName="pr-0"
          bodyClassName="pb-1"
          headerBadgePreset="capture"
          headerBadgeLabel="Expense capture"
          onClose={() => {
            setShowExpenseModal(false);
            setExpenseForm(createExpenseForm());
          }}
        >
          <ExpenseModalForm
            categories={categories}
            errorMessage={createExpense.error ? getErrorMessage(createExpense.error, 'Unable to save expense right now.') : ''}
            form={expenseForm}
            isPending={createExpense.isPending}
            onSubmit={(event) => {
              event.preventDefault();
              createExpense.mutate(buildExpensePayload(expenseForm));
            }}
            setForm={setExpenseForm}
          />
        </ModalShell>
      ) : null}

      {showCategoryModal ? (
        <ModalShell
          title="Create Category"
          subtitle="Keep expense classification clean so reporting and AI insights stay usable later."
          tone="sky"
          busy={createCategory.isPending}
          dismissPreset="guarded"
          busyDismissPreset="locked"
          draftState={createCategory.isPending ? 'saving' : categoryModalDirty ? 'dirty' : null}
          draftStatePreset="pending"
          closeGuardPreset="discardDraft"
          scrollAreaClassName="pr-0"
          bodyClassName="pb-1"
          headerBadgePreset="capture"
          headerBadgeLabel="Category setup"
          onClose={() => {
            setShowCategoryModal(false);
            setCategoryForm(createExpenseCategoryForm());
          }}
        >
          <ExpenseCategoryModalForm
            errorMessage={createCategory.error ? getErrorMessage(createCategory.error, 'Unable to create expense category right now.') : ''}
            form={categoryForm}
            isPending={createCategory.isPending}
            onSubmit={(event) => {
              event.preventDefault();
              createCategory.mutate(buildExpenseCategoryPayload(categoryForm));
            }}
            setForm={setCategoryForm}
          />
        </ModalShell>
      ) : null}
    </div>
  );
}

function QueryErrorPanel({ message, onRetry }) {
  return (
    <Card className="border-rose-200 bg-rose-50/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Workspace issue</p>
          <p className="mt-2 text-sm text-rose-700">{message}</p>
        </div>
        <Button variant="secondary" onClick={onRetry}>
          Retry loading
        </Button>
      </div>
    </Card>
  );
}

function ExpenseModalForm({ categories, errorMessage, form, isPending, onSubmit, setForm }) {
  const modal = useModalShell();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
      ) : null}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Description</label>
        <input
          type="text"
          required
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="input"
          placeholder="e.g., Diesel for generator"
          data-autofocus="true"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Amount</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            className="input"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Expense date</label>
          <input
            type="date"
            required
            value={form.expense_date}
            onChange={(event) => setForm({ ...form, expense_date: event.target.value })}
            className="input"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Category</label>
          <select
            required
            value={form.expense_category_id}
            onChange={(event) => setForm({ ...form, expense_category_id: event.target.value })}
            className="input"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Payment method</label>
          <select
            required
            value={form.payment_method}
            onChange={(event) => setForm({ ...form, payment_method: event.target.value })}
            className="input"
          >
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="bank">Bank</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Reference</label>
        <input
          type="text"
          value={form.reference}
          onChange={(event) => setForm({ ...form, reference: event.target.value })}
          className="input"
          placeholder="Receipt number, teller ref, or note"
        />
      </div>
      <ModalActions tone="amber" preset="form">
        <Button type="button" variant="secondary" size="lg" fullWidth onClick={modal.requestClose} disabled={isPending} data-modal-dismiss="true">
          Cancel
        </Button>
        <Button type="submit" size="lg" fullWidth disabled={isPending}>
          {isPending ? 'Saving expense...' : 'Save expense'}
        </Button>
      </ModalActions>
    </form>
  );
}

function ExpenseCategoryModalForm({ errorMessage, form, isPending, onSubmit, setForm }) {
  const modal = useModalShell();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
      ) : null}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Category name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="input"
          placeholder="e.g., Transport"
          data-autofocus="true"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Description</label>
        <textarea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="input min-h-[96px] resize-y py-3"
          rows={2}
          placeholder="What kind of expense belongs in this category?"
        />
      </div>
      <ModalActions tone="sky" preset="form">
        <Button type="button" variant="secondary" size="lg" fullWidth onClick={modal.requestClose} disabled={isPending} data-modal-dismiss="true">
          Cancel
        </Button>
        <Button type="submit" size="lg" fullWidth disabled={isPending}>
          {isPending ? 'Saving category...' : 'Save category'}
        </Button>
      </ModalActions>
    </form>
  );
}
