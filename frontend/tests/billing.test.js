import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBillingCancelDetailContext,
  buildBillingInvoiceRows,
  buildBillingMethodPresentation,
  buildBillingMethodRemovalDetailContext,
  buildBillingOverviewMetrics,
  buildBillingUsageItems,
  getBillingDefaultMethodLabel,
  getBillingMethodConfirmLabel,
  getBillingMethodPrimaryLabel,
  getBillingMethodSecondaryLabel,
  getBillingPendingConfirmBusy,
  getBillingStatusClass,
} from '../src/lib/billing.js';
import { formatCurrencyNGN, formatShortDate } from '../src/lib/financeFormatters.js';

test('billing status helpers keep tone mapping stable', () => {
  assert.equal(getBillingStatusClass('paid'), 'bg-emerald-100 text-emerald-700');
  assert.equal(getBillingStatusClass('trial'), 'bg-sky-100 text-sky-700');
  assert.equal(getBillingStatusClass('missing'), 'bg-slate-100 text-slate-700');
});

test('billing overview metrics summarize plan and invoices cleanly', () => {
  const overview = buildBillingOverviewMetrics({
    plan: { name: 'Growth' },
    days_remaining: 14,
  }, [
    { status: 'paid', total: '10000' },
    { status: 'pending', total: 5000 },
  ], formatCurrencyNGN);

  assert.equal(overview.activePlanName, 'Growth');
  assert.equal(overview.daysRemaining, 14);
  assert.equal(overview.paidInvoices, 1);
  assert.equal(overview.totalInvoiced, 15000);
  assert.deepEqual(overview.cards, [
    {
      label: 'Active Plan',
      value: 'Growth',
      helper: 'Current subscription attached to this business',
      tone: 'violet',
    },
    {
      label: 'Days Remaining',
      value: '14',
      helper: 'Time left before the current cycle closes',
      tone: 'sky',
    },
    {
      label: 'Paid Invoices',
      value: '1',
      helper: 'Billing records already settled successfully',
      tone: 'emerald',
    },
    {
      label: 'Total Invoiced',
      value: formatCurrencyNGN(15000),
      helper: 'Combined billed amount across recent invoices',
      tone: 'amber',
    },
  ]);
});

test('billing payment method helpers format card and bank labels consistently', () => {
  const cardMethod = {
    id: 1,
    type: 'card',
    brand: 'Visa',
    last_four: '4242',
    expiry_month: '08',
    expiry_year: '2030',
    is_default: true,
  };
  const bankMethod = {
    id: 2,
    type: 'bank',
    bank_name: 'Zenith',
    account_number: '0001234567',
  };

  assert.equal(getBillingMethodPrimaryLabel(cardMethod), 'Visa •••• 4242');
  assert.equal(getBillingMethodPrimaryLabel(bankMethod), 'Zenith •••• 4567');
  assert.deepEqual(getBillingMethodSecondaryLabel(cardMethod), {
    text: 'Expires 08/2030',
    isDefault: true,
  });
  assert.deepEqual(getBillingMethodSecondaryLabel(bankMethod), {
    text: 'Bank transfer method',
    isDefault: false,
  });
  assert.equal(getBillingMethodConfirmLabel(cardMethod), 'Visa ending in 4242');
  assert.equal(getBillingDefaultMethodLabel([bankMethod, cardMethod]), 'Visa •••• 4242');
  assert.equal(getBillingDefaultMethodLabel([bankMethod]), 'None marked');
});

test('billing payment method presentation exposes row state for actions', () => {
  const method = {
    id: 4,
    type: 'bank',
    bank_name: 'Access',
    account_number: '9876543210',
  };

  assert.deepEqual(buildBillingMethodPresentation(method, {
    settingDefaultId: 4,
    removingId: 9,
  }), {
    primaryLabel: 'Access •••• 3210',
    secondary: {
      text: 'Bank transfer method',
      isDefault: false,
    },
    confirmLabel: 'Access ending in 3210',
    badgeLabel: 'BNK',
    badgeClassName: 'bg-blue-600 text-white',
    isSettingDefault: true,
    isRemoving: false,
  });
});

test('billing usage items and invoice rows normalize display values', () => {
  assert.deepEqual(buildBillingUsageItems([
    { feature_key: 'staff_accounts', current: '9', limit: '12' },
    { feature_key: 'warehouse_slots', current: 3, limit: 0 },
  ]), [
    {
      feature_key: 'staff_accounts',
      current: '9',
      limit: '12',
      currentValue: '9',
      ratio: 75,
      label: 'staff accounts',
    },
    {
      feature_key: 'warehouse_slots',
      current: 3,
      limit: 0,
      currentValue: '3',
      ratio: 0,
      label: 'warehouse slots',
    },
  ]);

  assert.deepEqual(buildBillingInvoiceRows([
    {
      id: 12,
      invoice_number: 'INV-0012',
      total: 20000,
      status: 'paid',
      paid_at: '2026-05-02',
    },
  ], formatCurrencyNGN, formatShortDate), [
    {
      id: 12,
      invoiceNumber: 'INV-0012',
      totalLabel: formatCurrencyNGN(20000),
      status: 'paid',
      statusClassName: 'bg-emerald-100 text-emerald-700',
      dateLabel: formatShortDate('2026-05-02', 'No date'),
      viewHref: '/billing/invoices/12',
    },
  ]);
});

test('billing confirm helpers keep dialog context and busy state aligned', () => {
  assert.deepEqual(buildBillingCancelDetailContext({
    billing_cycle: 'monthly',
    ends_at: '2026-06-15',
    days_remaining: 20,
  }, 'Growth', formatShortDate), {
    planName: 'Growth',
    billingCycle: 'monthly',
    renewsOn: formatShortDate('2026-06-15', 'No renewal date set'),
    daysRemainingLabel: '20 days',
  });

  assert.deepEqual(buildBillingMethodRemovalDetailContext({
    methodLabel: 'Visa ending in 4242',
  }, [{ id: 1 }, { id: 2 }], 'Visa •••• 4242'), {
    methodLabel: 'Visa ending in 4242',
    savedMethodsCount: '2',
    defaultMethodLabel: 'Visa •••• 4242',
  });

  assert.equal(getBillingPendingConfirmBusy({ type: 'cancel' }, true, null), true);
  assert.equal(getBillingPendingConfirmBusy({ type: 'remove-method', methodId: 3 }, false, 3), true);
  assert.equal(getBillingPendingConfirmBusy({ type: 'remove-method', methodId: 3 }, false, 4), false);
  assert.equal(getBillingPendingConfirmBusy(null, false, null), false);
});
