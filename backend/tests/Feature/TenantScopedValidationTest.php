<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use App\Models\Staff;
use App\Models\User;
use App\Services\BusinessProvisioningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TenantScopedValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_store_and_update_reject_customer_groups_from_other_businesses(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        ['business' => $otherBusiness] = $this->createSeparateBusiness();

        $localGroupId = DB::table('customer_groups')->insertGetId([
            'business_id' => $business->id,
            'name' => 'VIP',
            'slug' => 'vip',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $foreignGroupId = DB::table('customer_groups')->insertGetId([
            'business_id' => $otherBusiness->id,
            'name' => 'Foreign VIP',
            'slug' => 'foreign-vip',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/customers', [
                'name' => 'Amina Bello',
                'phone' => '08030001111',
                'customer_group_id' => $foreignGroupId,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['customer_group_id']);

        $customer = Customer::create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'Cash Buyer',
            'customer_group_id' => $localGroupId,
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/customers/{$customer->id}", [
                'customer_group_id' => $foreignGroupId,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['customer_group_id']);
    }

    public function test_staff_store_and_update_reject_branches_from_other_businesses(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        ['branch' => $foreignBranch] = $this->createSeparateBusiness();
        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/staff', [
                'name' => 'Musa Aliyu',
                'role' => 'Supervisor',
                'branch_id' => $foreignBranch->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);

        $staff = Staff::create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'Current Staff',
            'role' => 'Clerk',
            'status' => 'active',
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/staff/{$staff->id}", [
                'branch_id' => $foreignBranch->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);
    }

    public function test_product_store_and_update_reject_categories_from_other_businesses(): void
    {
        ['owner' => $owner, 'business' => $business] = $this->createProvisionedWorkspace();
        ['business' => $otherBusiness] = $this->createSeparateBusiness();

        $localCategory = ProductCategory::create([
            'business_id' => $business->id,
            'name' => 'Beverages',
            'slug' => 'beverages',
        ]);
        $foreignCategory = ProductCategory::create([
            'business_id' => $otherBusiness->id,
            'name' => 'Foreign Goods',
            'slug' => 'foreign-goods',
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/products', [
                'name' => 'Sachet Water',
                'selling_price' => 250,
                'category_id' => $foreignCategory->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);

        $product = Product::create([
            'business_id' => $business->id,
            'category_id' => $localCategory->id,
            'name' => 'Bottled Water',
            'selling_price' => 500,
            'track_inventory' => 'yes',
            'product_type' => 'good',
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/products/{$product->id}", [
                'category_id' => $foreignCategory->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    public function test_product_category_store_rejects_parent_categories_from_other_businesses(): void
    {
        ['owner' => $owner] = $this->createProvisionedWorkspace();
        ['business' => $otherBusiness] = $this->createSeparateBusiness();

        $foreignCategory = ProductCategory::create([
            'business_id' => $otherBusiness->id,
            'name' => 'Foreign Parent',
            'slug' => 'foreign-parent',
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/product-categories', [
                'name' => 'Child Category',
                'parent_id' => $foreignCategory->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['parent_id']);
    }

    public function test_order_store_rejects_customers_products_and_variants_from_other_businesses(): void
    {
        ['owner' => $owner, 'business' => $business] = $this->createProvisionedWorkspace();
        ['business' => $otherBusiness] = $this->createSeparateBusiness();

        $localProduct = Product::create([
            'business_id' => $business->id,
            'name' => 'Local Sachet Water',
            'selling_price' => 250,
            'track_inventory' => 'yes',
            'product_type' => 'good',
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $otherBusiness->id,
            'name' => 'Foreign Customer',
            'customer_type' => 'individual',
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherBusiness->id,
            'name' => 'Foreign Pack',
            'selling_price' => 500,
            'track_inventory' => 'yes',
            'product_type' => 'good',
        ]);

        $foreignVariant = ProductVariant::create([
            'product_id' => $foreignProduct->id,
            'name' => 'Foreign Variant',
            'selling_price' => 500,
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/orders', [
                'customer_id' => $foreignCustomer->id,
                'items' => [
                    [
                        'product_id' => $localProduct->id,
                        'variant_id' => $foreignVariant->id,
                        'quantity' => 1,
                        'unit_price' => 250,
                        'total' => 250,
                    ],
                    [
                        'product_id' => $foreignProduct->id,
                        'quantity' => 1,
                        'unit_price' => 500,
                        'total' => 500,
                    ],
                ],
                'subtotal' => 750,
                'total' => 750,
                'paid' => 750,
                'payment_method' => 'cash',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'customer_id',
                'items.0.variant_id',
                'items.1.product_id',
            ]);
    }

    public function test_expense_store_rejects_categories_from_other_businesses(): void
    {
        ['owner' => $owner, 'business' => $business] = $this->createProvisionedWorkspace();
        ['business' => $otherBusiness] = $this->createSeparateBusiness();

        DB::table('expense_categories')->insert([
            [
                'business_id' => $business->id,
                'name' => 'Local Ops',
                'slug' => 'local-ops',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $otherBusiness->id,
                'name' => 'Foreign Ops',
                'slug' => 'foreign-ops',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $foreignCategoryId = DB::table('expense_categories')
            ->where('business_id', $otherBusiness->id)
            ->value('id');

        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/expenses', [
                'expense_category_id' => $foreignCategoryId,
                'description' => 'Foreign category expense',
                'amount' => 4500,
                'payment_method' => 'cash',
                'expense_date' => now()->toDateString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['expense_category_id']);
    }

    public function test_trust_account_store_rejects_customers_from_other_businesses(): void
    {
        ['owner' => $owner] = $this->createProvisionedWorkspace();
        ['business' => $otherBusiness, 'branch' => $otherBranch] = $this->createSeparateBusiness();

        $foreignCustomer = Customer::create([
            'business_id' => $otherBusiness->id,
            'branch_id' => $otherBranch->id,
            'name' => 'Foreign Trust Customer',
            'customer_type' => 'individual',
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/trust-accounts', [
                'customer_id' => $foreignCustomer->id,
                'account_type' => 'credit',
                'limit' => 15000,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id']);
    }

    private function createProvisionedWorkspace(): array
    {
        $owner = User::factory()->create([
            'name' => 'Business Owner',
            'email' => 'owner@example.com',
            'phone' => '08030000000',
            'role' => 'admin',
        ]);

        /** @var BusinessProvisioningService $provisioning */
        $provisioning = app(BusinessProvisioningService::class);

        $result = $provisioning->createBusinessForUser($owner, [
            'business_name' => 'Taska Retail',
            'business_email' => 'retail@example.com',
            'business_type' => 'retail',
            'business_category' => 'commerce',
            'business_location' => '12 Market Road',
            'primary_branch_name' => 'HQ',
            'contact_phone' => '08030000000',
            'role' => 'admin',
        ]);

        return [
            'owner' => $owner->fresh(),
            'business' => $result['business']->fresh(),
            'branch' => $result['branch']->fresh(),
        ];
    }

    private function createSeparateBusiness(): array
    {
        $owner = User::factory()->create([
            'name' => 'Other Owner',
            'email' => 'other-owner@example.com',
            'phone' => '08035550000',
            'role' => 'admin',
        ]);

        /** @var BusinessProvisioningService $provisioning */
        $provisioning = app(BusinessProvisioningService::class);

        $result = $provisioning->createBusinessForUser($owner, [
            'business_name' => 'Taska Hotel',
            'business_email' => 'hotel@example.com',
            'business_type' => 'hotel',
            'business_category' => 'hospitality',
            'business_location' => '8 Resort Road',
            'primary_branch_name' => 'Hotel HQ',
            'contact_phone' => '08035550000',
            'role' => 'admin',
        ]);

        return [
            'owner' => $owner->fresh(),
            'business' => $result['business']->fresh(),
            'branch' => $result['branch']->fresh(),
        ];
    }
}
