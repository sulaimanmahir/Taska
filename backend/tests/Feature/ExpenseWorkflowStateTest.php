<?php

namespace Tests\Feature;

use App\Models\ExpenseCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ExpenseWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_expenses_and_updates_categories_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('general', 'expense-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $categoryResponse = $this->postJson('/api/expense-categories', [
            'name' => 'Fuel and Transport',
            'description' => 'Daily movement costs',
        ])->assertCreated();

        $categoryId = $categoryResponse->json('id');

        $categoryResponse
            ->assertJsonPath('name', 'Fuel and Transport')
            ->assertJsonPath('slug', 'fuel-and-transport');

        $this->postJson('/api/expenses', [
            'expense_category_id' => $categoryId,
            'description' => 'Urgent delivery fuel top-up',
            'amount' => 8500,
            'payment_method' => 'transfer',
            'reference' => 'TRF-4451',
            'expense_date' => today()->toDateString(),
        ])
            ->assertCreated()
            ->assertJsonPath('description', 'Urgent delivery fuel top-up')
            ->assertJsonPath('amount', '8500.00')
            ->assertJsonPath('category.name', 'Fuel and Transport');

        $this->patchJson("/api/expense-categories/{$categoryId}", [
            'name' => 'Fuel, Transport and Logistics',
            'is_active' => true,
        ])
            ->assertOk()
            ->assertJsonPath('name', 'Fuel, Transport and Logistics')
            ->assertJsonPath('slug', 'fuel-transport-and-logistics')
            ->assertJsonPath('is_active', true);
    }

    public function test_it_rejects_foreign_tenant_expense_category_links_and_updates(): void
    {
        $tenant = $this->createTenantContext('general', 'expense-scope@example.com');
        $otherTenant = $this->createTenantContext('general', 'expense-scope-other@example.com');

        $foreignCategory = ExpenseCategory::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Category',
            'slug' => 'foreign-category',
            'is_active' => true,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/expenses', [
            'expense_category_id' => $foreignCategory->id,
            'description' => 'Invalid expense',
            'amount' => 4000,
            'payment_method' => 'cash',
            'expense_date' => today()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['expense_category_id']);

        $this->patchJson("/api/expense-categories/{$foreignCategory->id}", [
            'name' => 'Hijacked Category',
        ])->assertStatus(403);
    }
}
