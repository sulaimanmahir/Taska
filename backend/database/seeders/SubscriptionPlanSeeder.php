<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'Perfect for individuals and small teams getting started',
                'monthly_price' => 0,
                'yearly_price' => 0,
                'display_order' => 1,
                'is_active' => true,
                'is_featured' => false,
                'features' => [
                    ['key' => 'branches', 'name' => 'Branches', 'type' => 'integer', 'value' => '1'],
                    ['key' => 'staff', 'name' => 'Staff Members', 'type' => 'integer', 'value' => '2'],
                    ['key' => 'products', 'name' => 'Products', 'type' => 'integer', 'value' => '50'],
                    ['key' => 'pos_stations', 'name' => 'POS Stations', 'type' => 'integer', 'value' => '1'],
                    ['key' => 'warehouses', 'name' => 'Warehouses', 'type' => 'integer', 'value' => '1'],
                    ['key' => 'ai_insights', 'name' => 'AI Insights', 'type' => 'boolean', 'value' => 'false'],
                    ['key' => 'priority_support', 'name' => 'Priority Support', 'type' => 'boolean', 'value' => 'false'],
                ],
            ],
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'For growing businesses that need more power',
                'monthly_price' => 9900,
                'yearly_price' => 99000,
                'display_order' => 2,
                'is_active' => true,
                'is_featured' => false,
                'features' => [
                    ['key' => 'branches', 'name' => 'Branches', 'type' => 'integer', 'value' => '2'],
                    ['key' => 'staff', 'name' => 'Staff Members', 'type' => 'integer', 'value' => '5'],
                    ['key' => 'products', 'name' => 'Products', 'type' => 'integer', 'value' => '200'],
                    ['key' => 'pos_stations', 'name' => 'POS Stations', 'type' => 'integer', 'value' => '2'],
                    ['key' => 'warehouses', 'name' => 'Warehouses', 'type' => 'integer', 'value' => '2'],
                    ['key' => 'ai_insights', 'name' => 'AI Insights', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'priority_support', 'name' => 'Priority Support', 'type' => 'boolean', 'value' => 'false'],
                    ['key' => 'expenses', 'name' => 'Expense Tracking', 'type' => 'boolean', 'value' => 'true'],
                ],
            ],
            [
                'name' => 'Growth',
                'slug' => 'growth',
                'description' => 'For established businesses ready to scale',
                'monthly_price' => 24900,
                'yearly_price' => 249000,
                'display_order' => 3,
                'is_active' => true,
                'is_featured' => true,
                'features' => [
                    ['key' => 'branches', 'name' => 'Branches', 'type' => 'integer', 'value' => '5'],
                    ['key' => 'staff', 'name' => 'Staff Members', 'type' => 'integer', 'value' => '15'],
                    ['key' => 'products', 'name' => 'Products', 'type' => 'integer', 'value' => '1000'],
                    ['key' => 'pos_stations', 'name' => 'POS Stations', 'type' => 'integer', 'value' => '5'],
                    ['key' => 'warehouses', 'name' => 'Warehouses', 'type' => 'integer', 'value' => '3'],
                    ['key' => 'ai_insights', 'name' => 'AI Insights', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'priority_support', 'name' => 'Priority Support', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'expenses', 'name' => 'Expense Tracking', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'trust_fund', 'name' => 'Trust Fund', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'referrals', 'name' => 'Referral Program', 'type' => 'boolean', 'value' => 'true'],
                ],
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'description' => 'Enterprise-grade features for large organizations',
                'monthly_price' => 49900,
                'yearly_price' => 499000,
                'display_order' => 4,
                'is_active' => true,
                'is_featured' => false,
                'features' => [
                    ['key' => 'branches', 'name' => 'Branches', 'type' => 'integer', 'value' => '999'],
                    ['key' => 'staff', 'name' => 'Staff Members', 'type' => 'integer', 'value' => '999'],
                    ['key' => 'products', 'name' => 'Products', 'type' => 'integer', 'value' => '99999'],
                    ['key' => 'pos_stations', 'name' => 'POS Stations', 'type' => 'integer', 'value' => '999'],
                    ['key' => 'warehouses', 'name' => 'Warehouses', 'type' => 'integer', 'value' => '999'],
                    ['key' => 'ai_insights', 'name' => 'AI Insights', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'priority_support', 'name' => 'Priority Support', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'expenses', 'name' => 'Expense Tracking', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'trust_fund', 'name' => 'Trust Fund', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'referrals', 'name' => 'Referral Program', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'api_access', 'name' => 'API Access', 'type' => 'boolean', 'value' => 'true'],
                    ['key' => 'white_label', 'name' => 'White Label', 'type' => 'boolean', 'value' => 'false'],
                ],
            ],
        ];

        foreach ($plans as $planData) {
            $features = $planData['features'];
            unset($planData['features']);

            $plan = SubscriptionPlan::updateOrCreate(['slug' => $planData['slug']], $planData);

            foreach ($features as $index => $feature) {
                SubscriptionPlanFeature::updateOrCreate(
                    ['plan_id' => $plan->id, 'feature_key' => $feature['key']],
                    [
                        'feature_name' => $feature['name'],
                        'value_type' => $feature['type'],
                        'value' => $feature['value'],
                        'sort_order' => $index,
                    ]
                );
            }
        }
    }
}