<?php

/**
 * Gamification catalog: achievement, milestone, and streak *definitions*.
 * This is code (like config/business_types.php), not tenant data - the
 * per-business unlock state lives in business_achievement_unlocks and
 * business_streaks (see the 2026_08_12_* migrations).
 *
 * Design principle (docs/TASKA_DESIGN_CONSTITUTION.md §77): "use
 * gamification to encourage good business habits... never use childish
 * gamification." Every entry here must be tied to a real, checkable
 * business signal already present in the data model - never an arbitrary
 * points currency disconnected from the business itself. Business-type
 * agnostic on purpose: these read from models every vertical already has
 * (Order, Expense, Customer, InventoryItem), not vertical-specific tables,
 * so the same catalog applies whether the business is a pharmacy or a
 * logistics company.
 *
 * `metric` names below are the signal a (not-yet-built) scoring service
 * would compute per business; this file defines *what counts*, not how
 * to compute it - that's the next implementation phase, deliberately not
 * built yet (see docs/TASKA_DESIGN_CONSTITUTION.md's gamification section
 * for what's done vs. still open).
 */

return [

    // One-time unlocks tied to a real cumulative threshold being crossed.
    // Stored in business_achievement_unlocks with category = 'achievement'.
    'achievements' => [
        'first_sale' => [
            'name' => 'First Sale',
            'description' => 'Recorded your first sale on Taska.',
            'metric' => 'orders_count',
            'threshold' => 1,
            'tier' => 'bronze',
        ],
        'first_customer' => [
            'name' => 'First Customer',
            'description' => 'Added your first customer record.',
            'metric' => 'customers_count',
            'threshold' => 1,
            'tier' => 'bronze',
        ],
        'first_expense_logged' => [
            'name' => 'Books Open',
            'description' => 'Logged your first business expense.',
            'metric' => 'expenses_count',
            'threshold' => 1,
            'tier' => 'bronze',
        ],
        'inventory_set_up' => [
            'name' => 'Stocked Up',
            'description' => 'Added 10 or more products to inventory.',
            'metric' => 'products_count',
            'threshold' => 10,
            'tier' => 'bronze',
        ],
        'hundred_sales' => [
            'name' => 'Century',
            'description' => 'Crossed 100 recorded sales.',
            'metric' => 'orders_count',
            'threshold' => 100,
            'tier' => 'silver',
        ],
        'debt_free' => [
            'name' => 'Debt Free',
            'description' => 'Cleared every overdue customer balance.',
            'metric' => 'overdue_receivables_total',
            'threshold' => 0,
            'comparator' => 'lte',
            'tier' => 'silver',
        ],
        'multi_branch' => [
            'name' => 'Growing Footprint',
            'description' => 'Opened a second branch or warehouse.',
            'metric' => 'branches_count',
            'threshold' => 2,
            'tier' => 'gold',
        ],
    ],

    // Same shape as achievements (stored in the same table, category =
    // 'milestone') but framed around a round-number business outcome
    // rather than "first time doing X" - the distinction is presentation,
    // not data ("₦1,000,000 in lifetime revenue" reads as a milestone to
    // celebrate, not a badge to collect).
    'milestones' => [
        'revenue_1m' => [
            'name' => '₦1,000,000 in Sales',
            'description' => 'Lifetime revenue passed ₦1,000,000.',
            'metric' => 'lifetime_revenue',
            'threshold' => 1_000_000,
        ],
        'revenue_10m' => [
            'name' => '₦10,000,000 in Sales',
            'description' => 'Lifetime revenue passed ₦10,000,000.',
            'metric' => 'lifetime_revenue',
            'threshold' => 10_000_000,
        ],
        'customers_100' => [
            'name' => '100 Customers',
            'description' => 'Built a base of 100 recorded customers.',
            'metric' => 'customers_count',
            'threshold' => 100,
        ],
        'one_year_active' => [
            'name' => 'One Year on Taska',
            'description' => 'A full year of operating on Taska.',
            'metric' => 'account_age_days',
            'threshold' => 365,
        ],
    ],

    // Consecutive-day habits, tracked via BusinessStreak::recordActivity().
    // Kept short and deliberately tied to habits that are genuinely good
    // for the business to keep (not engagement-for-its-own-sake metrics
    // like "days opened the app").
    'streaks' => [
        'daily_sales_logged' => [
            'name' => 'Daily Sales Streak',
            'description' => 'Consecutive days with at least one recorded sale.',
        ],
        'zero_overdue_receivables' => [
            'name' => 'Clean Ledger Streak',
            'description' => 'Consecutive days with no overdue customer balance.',
        ],
        'daily_expense_logged' => [
            'name' => 'Expense Discipline Streak',
            'description' => 'Consecutive days with expenses reconciled same-day.',
        ],
    ],

];
