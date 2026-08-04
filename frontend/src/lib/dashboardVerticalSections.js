import { formatDashboardCurrency } from './dashboardFormatters.js';

export const dashboardVerticalSections = [
  {
    types: ['delivery_company'],
    title: 'Delivery Operations',
    focusTitle: 'Courier Focus',
    metrics: (dashboard) => [
      { label: 'Pickups Pending', value: dashboard?.delivery?.pickups_pending || 0, tone: 'amber' },
      { label: 'In Transit', value: dashboard?.delivery?.in_transit || 0, tone: 'sky' },
      { label: 'Completed Today', value: dashboard?.delivery?.completed_today || 0, tone: 'emerald' },
      { label: 'Ageing Parcels', value: dashboard?.delivery?.ageing_parcels || 0, tone: 'rose' },
      { label: 'Open Complaints', value: dashboard?.delivery?.open_complaints || 0, tone: 'orange' },
      { label: 'Wallet Payouts Today', value: formatDashboardCurrency(dashboard?.delivery?.wallet_outflow_today || 0), tone: 'violet' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Fast delivery completion and tight remittance control protect courier cash flow.',
      },
      {
        title: 'What to do next',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['logistics'],
    title: 'Logistics Operations',
    focusTitle: 'Logistics Focus',
    metrics: (dashboard) => [
      { label: 'Trips Today', value: dashboard?.logistics?.trips_today || 0, tone: 'sky' },
      { label: 'Active Trips', value: dashboard?.logistics?.active_trips || 0, tone: 'violet' },
      { label: 'Revenue Today', value: formatDashboardCurrency(dashboard?.logistics?.revenue_today || 0), tone: 'emerald' },
      { label: 'Fuel Cost Today', value: formatDashboardCurrency(dashboard?.logistics?.fuel_cost_today || 0), tone: 'amber' },
      { label: 'Open Maintenance', value: dashboard?.logistics?.maintenance_open || 0, tone: 'rose' },
      { label: 'Receivables', value: formatDashboardCurrency(dashboard?.logistics?.receivables_outstanding || 0), tone: 'orange' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Trip profitability, fleet utilization, and disciplined fuel control protect transport margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 4),
      },
    ],
  },
  {
    types: ['retail', 'supermarket'],
    title: 'Retail Operations',
    focusTitle: 'Retail Focus',
    metrics: (dashboard) => [
      { label: 'Cash Balance', value: formatDashboardCurrency(dashboard?.retail?.cash_balance || 0), tone: 'emerald' },
      { label: 'Debtors', value: formatDashboardCurrency(dashboard?.retail?.debtors || 0), tone: 'amber' },
      { label: 'Open Shifts', value: dashboard?.retail?.open_shifts || 0, tone: 'violet' },
      { label: 'Loyalty Customers', value: dashboard?.retail?.loyalty_customers || 0, tone: 'fuchsia' },
      { label: 'Petty Cash Today', value: formatDashboardCurrency(dashboard?.retail?.petty_cash_today || 0), tone: 'sky' },
      { label: 'Refunds Today', value: formatDashboardCurrency(dashboard?.retail?.refunds_today || 0), tone: 'rose' },
    ],
    focusItems: () => [
      {
        title: 'Daily owner question',
        body: 'Are cashiers closing cleanly, are refunds controlled, and are low-stock items being restocked before they choke revenue?',
      },
      {
        title: 'Silent profit killer',
        body: 'Untracked petty cash, weak shift closeout, and underpriced split-payment sales quietly bleed margin.',
      },
    ],
  },
  {
    types: ['wholesale'],
    title: 'Wholesale Operations',
    focusTitle: 'Distributor Focus',
    metrics: (dashboard) => [
      { label: 'Route Runs Today', value: dashboard?.wholesale?.route_runs_today || 0, tone: 'indigo' },
      { label: 'Active Reps', value: dashboard?.wholesale?.active_reps || 0, tone: 'violet' },
      { label: 'Bulk Orders', value: dashboard?.wholesale?.bulk_orders_today || 0, tone: 'fuchsia' },
      { label: 'Route Collections', value: formatDashboardCurrency(dashboard?.wholesale?.route_collections_today || 0), tone: 'emerald' },
      { label: 'Customer Debt', value: formatDashboardCurrency(dashboard?.wholesale?.customer_debt || 0), tone: 'amber' },
      { label: 'Transfers Today', value: dashboard?.wholesale?.stock_transfers_today || 0, tone: 'sky' },
    ],
    focusItems: () => [
      {
        title: 'Daily owner question',
        body: 'Are route reps collecting cleanly, are bulk prices disciplined, and is stock sitting in the right depot?',
      },
      {
        title: 'Silent profit killer',
        body: 'Weak route planning and uncontrolled negotiated pricing can erase margin before month-end reports expose it.',
      },
    ],
  },
  {
    types: ['pure_water_factory'],
    title: 'Factory Economics',
    focusTitle: 'Factory Focus',
    metrics: (dashboard) => [
      { label: 'Units Produced', value: dashboard?.production?.units_produced_today || 0, tone: 'emerald' },
      { label: 'Packaging Cost', value: formatDashboardCurrency(dashboard?.production?.packaging_cost_today || 0), tone: 'amber' },
      { label: 'Generator Fuel', value: formatDashboardCurrency(dashboard?.production?.generator_fuel_today || 0), tone: 'orange' },
      { label: 'Electricity Cost', value: formatDashboardCurrency(dashboard?.production?.electricity_cost_today || 0), tone: 'sky' },
      { label: 'Downtime', value: `${dashboard?.production?.downtime_today || 0} mins`, tone: 'rose' },
      { label: 'Profit Estimate', value: formatDashboardCurrency(dashboard?.production?.profit_estimate_today || 0), tone: 'violet' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Tight packaging, energy, and downtime control protect water-factory margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['pure_water_retail'],
    title: 'Pure Water Retail Operations',
    focusTitle: 'Water Retail Focus',
    metrics: (dashboard) => [
      { label: 'Revenue Today', value: formatDashboardCurrency(dashboard?.pure_water_retail?.revenue_today || 0), tone: 'sky' },
      { label: 'Packages Sold', value: dashboard?.pure_water_retail?.packages_sold_today || 0, tone: 'cyan' },
      { label: 'Crates Outstanding', value: dashboard?.pure_water_retail?.crates_outstanding || 0, tone: 'blue' },
      { label: 'Wholesale Revenue', value: formatDashboardCurrency(dashboard?.pure_water_retail?.wholesale_revenue_today || 0), tone: 'indigo' },
      { label: 'Retailer Debt', value: formatDashboardCurrency(dashboard?.pure_water_retail?.retailer_debt || 0), tone: 'amber' },
      { label: 'Transfers Out', value: dashboard?.pure_water_retail?.transfers_out_today || 0, tone: 'emerald' },
    ],
    focusItems: () => [
      {
        title: 'Daily owner question',
        body: 'Are outlet stock levels balanced, are retailer prices disciplined, and are crates returning fast enough to avoid replacement losses?',
      },
      {
        title: 'Silent profit killer',
        body: 'Loose route-drop dispatches, untracked crates, and casual wholesale pricing quietly eat margin in pure-water retail.',
      },
    ],
  },
  {
    types: ['farm'],
    title: 'Crop Farming Operations',
    focusTitle: 'Farm Focus',
    metrics: (dashboard) => [
      { label: 'Active Plots', value: dashboard?.farm?.active_plots || 0, tone: 'lime' },
      { label: 'Hectares Cultivated', value: dashboard?.farm?.hectares_under_cultivation || 0, tone: 'emerald' },
      { label: 'Input Cost Today', value: formatDashboardCurrency(dashboard?.farm?.input_cost_today || 0), tone: 'amber' },
      { label: 'Harvest Today', value: dashboard?.farm?.harvest_today || 0, tone: 'teal' },
      { label: 'Harvest Revenue', value: formatDashboardCurrency(dashboard?.farm?.harvest_revenue_today || 0), tone: 'sky' },
      { label: 'Losses Today', value: dashboard?.farm?.losses_today || 0, tone: 'rose' },
    ],
    focusItems: () => [
      {
        title: 'Daily owner question',
        body: 'Are plots getting the right inputs on time, and are we seeing yield or loss signals early enough to intervene?',
      },
      {
        title: 'Silent profit killer',
        body: 'Late planting, sloppy input logging, and undocumented harvest losses quietly reduce farm profitability.',
      },
    ],
  },
  {
    types: ['school'],
    title: 'School Operations',
    focusTitle: 'School Focus',
    metricsClassName: 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4',
    metrics: (dashboard) => [
      { label: 'Students', value: dashboard?.school?.enrolled_students || 0, tone: 'sky' },
      { label: 'Fees Collected', value: formatDashboardCurrency(dashboard?.school?.fees_collected || 0), tone: 'emerald' },
      { label: 'Promoted', value: dashboard?.school?.students_promoted || 0, tone: 'amber' },
      { label: 'Attendance', value: `${dashboard?.school?.attendance_rate || 0}%`, tone: 'violet' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Fee collection discipline and enrolment retention drive school stability.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['pharmacy'],
    title: 'Pharmacy Risk Control',
    focusTitle: 'Pharmacy Focus',
    metrics: (dashboard) => [
      { label: 'Near Expiry', value: dashboard?.pharmacy?.near_expiry_batches || 0, tone: 'amber' },
      { label: 'Discounted Batches', value: dashboard?.pharmacy?.discounted_batches || 0, tone: 'emerald' },
      { label: 'Expired Units', value: dashboard?.pharmacy?.expired_units || 0, tone: 'rose' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Expiry control and medicine substitution discipline protect pharmacy margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['restaurant'],
    title: 'Restaurant Control',
    focusTitle: 'Restaurant Focus',
    metrics: (dashboard) => [
      { label: 'Active Tables', value: dashboard?.restaurant?.active_tables || 0, tone: 'violet' },
      { label: 'Kitchen Queue', value: dashboard?.restaurant?.pending_kitchen_tickets || 0, tone: 'amber' },
      { label: 'Gross Margin', value: formatDashboardCurrency(dashboard?.restaurant?.gross_margin_today || 0), tone: 'emerald' },
      { label: 'Takeaway Today', value: dashboard?.restaurant?.takeaway_today || 0, tone: 'sky' },
      { label: 'Delivery Orders', value: dashboard?.restaurant?.delivery_today || 0, tone: 'fuchsia' },
      { label: 'Waste Cost', value: formatDashboardCurrency(dashboard?.restaurant?.waste_cost_today || 0), tone: 'rose' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Fast table turns, recipe discipline, and kitchen-loss control protect restaurant margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['mobile_agent'],
    title: 'Agent Banking Control',
    focusTitle: 'Agent Focus',
    metrics: (dashboard) => [
      { label: 'Volume Today', value: formatDashboardCurrency(dashboard?.mobile_agent?.volume_today || 0), tone: 'sky' },
      { label: 'Commissions', value: formatDashboardCurrency(dashboard?.mobile_agent?.commissions_today || 0), tone: 'emerald' },
      { label: 'Float Requests', value: dashboard?.mobile_agent?.float_requests_pending || 0, tone: 'amber' },
      { label: 'Reversals Pending', value: dashboard?.mobile_agent?.reversals_pending || 0, tone: 'violet' },
      { label: 'Shortages Open', value: dashboard?.mobile_agent?.shortages_open || 0, tone: 'rose' },
      { label: 'Fraud Alerts', value: dashboard?.mobile_agent?.fraud_alerts_open || 0, tone: 'orange' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Float discipline and reversal control protect agency banking earnings.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['textile'],
    title: 'Textile Operations',
    focusTitle: 'Textile Focus',
    metrics: (dashboard) => [
      { label: 'Active Jobs', value: dashboard?.textile?.active_jobs || 0, tone: 'violet' },
      { label: 'Overdue Jobs', value: dashboard?.textile?.overdue_jobs || 0, tone: 'rose' },
      { label: 'Consignment Open', value: dashboard?.textile?.consignment_open || 0, tone: 'amber' },
      { label: 'Measurements', value: dashboard?.textile?.measurements_saved || 0, tone: 'sky' },
      { label: 'Color Variants', value: dashboard?.textile?.color_variants || 0, tone: 'fuchsia' },
      { label: 'Debtor Exposure', value: formatDashboardCurrency(dashboard?.textile?.debtor_exposure || 0), tone: 'orange' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Tailoring throughput and disciplined fabric conversion protect textile margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['fuel_business'],
    title: 'Fuel Station Control',
    focusTitle: 'Fuel Focus',
    metrics: (dashboard) => [
      { label: 'Sales Today', value: formatDashboardCurrency(dashboard?.fuel?.sales_today || 0), tone: 'emerald' },
      { label: 'Litres Today', value: `${Number(dashboard?.fuel?.litres_today || 0).toFixed(2)} L`, tone: 'sky' },
      { label: 'Low Tanks', value: dashboard?.fuel?.low_stock_tanks || 0, tone: 'amber' },
      { label: 'Open Shifts', value: dashboard?.fuel?.open_shifts || 0, tone: 'violet' },
      { label: 'Shortage Today', value: formatDashboardCurrency(dashboard?.fuel?.shortage_today || 0), tone: 'rose' },
      { label: 'Alerts Open', value: dashboard?.fuel?.alerts_open || 0, tone: 'orange' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Pump accuracy and wet stock control protect fuel-station margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['agro_dealer'],
    title: 'Agro Dealer Control',
    focusTitle: 'Agro Focus',
    metrics: (dashboard) => [
      { label: 'Forecast Quantity', value: dashboard?.agro?.forecast_quantity || 0, tone: 'lime' },
      { label: 'Programme Sales', value: formatDashboardCurrency(dashboard?.agro?.programme_sales_total || 0), tone: 'emerald' },
      { label: 'Subsidy Receivable', value: formatDashboardCurrency(dashboard?.agro?.subsidy_receivable || 0), tone: 'amber' },
      { label: 'Reserved Quantity', value: dashboard?.agro?.reserved_quantity || 0, tone: 'sky' },
      { label: 'Outstanding Credit', value: formatDashboardCurrency(dashboard?.agro?.outstanding_credit || 0), tone: 'rose' },
      { label: 'Pending Advisories', value: dashboard?.agro?.advisories_pending || 0, tone: 'violet' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Seasonal demand planning and credit recovery protect agro cash flow.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['construction'],
    title: 'Building Materials Control',
    focusTitle: 'Building Materials Focus',
    metrics: (dashboard) => [
      { label: 'Today Sales', value: formatDashboardCurrency(dashboard?.construction?.today_sales || 0), tone: 'emerald' },
      { label: 'Outstanding Debts', value: formatDashboardCurrency(dashboard?.construction?.outstanding_debts || 0), tone: 'rose' },
      { label: 'Pending Deliveries', value: dashboard?.construction?.pending_deliveries || 0, tone: 'amber' },
      { label: 'Quotations Pending', value: dashboard?.construction?.quotations_pending || 0, tone: 'violet' },
      { label: 'Top Contractor', value: dashboard?.construction?.top_contractor || 'No contractor yet', tone: 'sky' },
      { label: 'Monthly Profit Estimate', value: formatDashboardCurrency(dashboard?.construction?.monthly_profit_estimate || 0), tone: 'orange' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Quotation discipline, contractor pricing, and site-delivery control protect building-material margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 4),
      },
    ],
  },
  {
    types: ['commodity'],
    title: 'Commodity Trading Control',
    focusTitle: 'Commodity Focus',
    metrics: (dashboard) => [
      { label: 'Revenue Today', value: formatDashboardCurrency(dashboard?.commodity?.revenue_today || 0), tone: 'emerald' },
      { label: 'Stock Weight', value: `${Number(dashboard?.commodity?.stock_weight_kg || 0).toFixed(2)} kg`, tone: 'sky' },
      { label: 'Open Lots', value: dashboard?.commodity?.lots_open || 0, tone: 'violet' },
      { label: 'Supplier Payables', value: formatDashboardCurrency(dashboard?.commodity?.supplier_payables || 0), tone: 'amber' },
      { label: 'Shrinkage Today', value: `${Number(dashboard?.commodity?.shrinkage_today_kg || 0).toFixed(2)} kg`, tone: 'rose' },
      { label: 'High Moisture Lots', value: dashboard?.commodity?.high_moisture_lots || 0, tone: 'orange' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Buying well, controlling moisture, and settling trades quickly protects commodity margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 4),
      },
    ],
  },
  {
    types: ['beauty'],
    title: 'Beauty Operations Control',
    focusTitle: 'Beauty Focus',
    metrics: (dashboard) => [
      { label: 'Appointments Today', value: dashboard?.beauty?.appointments_today || 0, tone: 'fuchsia' },
      { label: 'Pending Queue', value: dashboard?.beauty?.pending_queue || 0, tone: 'amber' },
      { label: 'Revenue Today', value: formatDashboardCurrency(dashboard?.beauty?.revenue_today || 0), tone: 'emerald' },
      { label: 'Commissions Due', value: formatDashboardCurrency(dashboard?.beauty?.commissions_due || 0), tone: 'rose' },
      { label: 'Product Cost Today', value: formatDashboardCurrency(dashboard?.beauty?.product_cost_today || 0), tone: 'violet' },
      { label: 'Active Stylists', value: dashboard?.beauty?.active_staff || 0, tone: 'slate' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Booking density, strong repeat clients, and clean commission control protect salon margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['service'],
    title: 'Service Operations Control',
    focusTitle: 'Service Focus',
    metrics: (dashboard) => [
      { label: 'Bookings Today', value: dashboard?.service?.bookings_today || 0, tone: 'orange' },
      { label: 'Open Jobs', value: dashboard?.service?.open_jobs || 0, tone: 'amber' },
      { label: 'Revenue Today', value: formatDashboardCurrency(dashboard?.service?.revenue_today || 0), tone: 'emerald' },
      { label: 'Outstanding Invoices', value: formatDashboardCurrency(dashboard?.service?.invoices_outstanding || 0), tone: 'rose' },
      { label: 'Overdue Invoices', value: dashboard?.service?.overdue_invoices || 0, tone: 'violet' },
      { label: 'Assigned Staff', value: dashboard?.service?.assigned_staff || 0, tone: 'slate' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Booking conversion, staff utilization, and invoice follow-up protect service-business cash flow.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['mixed', 'general'],
    title: 'SME Owner Control',
    focusTitle: 'SME Focus',
    metrics: (dashboard) => [
      { label: 'Net Cash Today', value: formatDashboardCurrency(dashboard?.general_sme?.net_cash_today || 0), tone: 'emerald' },
      { label: 'Debtor Exposure', value: formatDashboardCurrency(dashboard?.general_sme?.debtor_exposure || 0), tone: 'amber' },
      { label: 'Target Attainment', value: `${Number(dashboard?.general_sme?.target_attainment || 0).toFixed(1)}%`, tone: 'violet' },
      { label: 'Cash In Today', value: formatDashboardCurrency(dashboard?.general_sme?.cash_in_today || 0), tone: 'sky' },
      { label: 'Cash Out Today', value: formatDashboardCurrency(dashboard?.general_sme?.cash_out_today || 0), tone: 'rose' },
      { label: 'Follow-ups Due', value: dashboard?.general_sme?.followups_due || 0, tone: 'orange' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Cash discipline, collections, and daily target tracking keep mixed businesses healthy.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 4),
      },
    ],
  },
  {
    types: ['warehouse'],
    title: 'Warehouse Control',
    focusTitle: 'Warehouse Focus',
    metricsClassName: 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4',
    metrics: (dashboard) => [
      { label: 'Sources', value: dashboard?.warehouse?.donor_sources || 0, tone: 'cyan' },
      { label: 'Pending Requests', value: dashboard?.warehouse?.partner_requests_pending || 0, tone: 'amber' },
      { label: 'Releases Today', value: dashboard?.warehouse?.distributions_today || 0, tone: 'emerald' },
      { label: 'Expiry Alerts', value: dashboard?.warehouse?.expiry_alerts || 0, tone: 'rose' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Clean stock accountability and fast release handling protect warehouse performance.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
  {
    types: ['livestock'],
    title: 'Livestock Control',
    focusTitle: 'Livestock Focus',
    metrics: (dashboard) => [
      { label: 'Animals', value: dashboard?.livestock?.total_animals || 0, tone: 'amber' },
      { label: 'Average Weight', value: `${Number(dashboard?.livestock?.average_weight_kg || 0).toFixed(2)} kg`, tone: 'sky' },
      { label: 'Milk Today', value: `${Number(dashboard?.livestock?.milk_today_litres || 0).toFixed(2)} L`, tone: 'emerald' },
      { label: 'Pens', value: dashboard?.livestock?.pens || 0, tone: 'violet' },
      { label: 'Open Outbreaks', value: dashboard?.livestock?.open_outbreaks || 0, tone: 'rose' },
      { label: 'Sales Today', value: formatDashboardCurrency(dashboard?.livestock?.sales_today || 0), tone: 'orange' },
    ],
    focusItems: (dashboard) => [
      {
        title: 'Why it matters',
        body: dashboard?.owner_focus?.profit_driver || 'Weight gains, milk yield, disease control, and honest sales logging protect livestock margin.',
      },
      {
        title: 'Owner decisions today',
        lines: (dashboard?.owner_focus?.daily_decisions || []).slice(0, 3),
      },
    ],
  },
];

export function getDashboardVerticalSection(businessType) {
  const aliases = {
    ngo_warehouse: 'warehouse',
  };

  return dashboardVerticalSections.find((section) => section.types.includes(businessType))
    || dashboardVerticalSections.find((section) => section.types.includes(aliases[businessType]))
    || null;
}
