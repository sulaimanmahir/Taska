<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthWorkflowStateTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_registers_and_logs_in_with_business_context_payloads(): void
    {
        $registerResponse = $this->postJson('/api/auth/register', [
            'business_name' => 'Taska Mixed Hub',
            'business_email' => 'mixed-hub@example.com',
            'business_type' => 'mixed',
            'name' => 'Mixed Owner',
            'email' => 'mixed-owner@example.com',
            'password' => 'password123',
            'phone' => '08037770000',
            'role' => 'admin',
        ])->assertCreated();

        $registerResponse
            ->assertJsonPath('current_business.business_type', 'mixed')
            ->assertJsonPath('requires_business_selection', false)
            ->assertJsonPath('needs_business_onboarding', false);

        $this->postJson('/api/auth/login', [
            'email' => 'mixed-owner@example.com',
            'password' => 'password123',
        ])
            ->assertOk()
            ->assertJsonPath('current_business.business_type', 'mixed')
            ->assertJsonPath('needs_business_onboarding', false);
    }

    public function test_it_switches_and_creates_businesses_through_structured_auth_requests(): void
    {
        $user = User::factory()->create([
            'email' => 'auth-structure@example.com',
            'password' => Hash::make('password123'),
        ]);

        $retailBusiness = $this->makeBusiness('Taska Retail', 'retail');
        $schoolBusiness = $this->makeBusiness('Taska School', 'school');

        $this->attachMembership($user, $retailBusiness, 'admin');
        $this->attachMembership($user, $schoolBusiness, 'manager');

        Sanctum::actingAs($user);

        $this->postJson('/api/auth/switch-business', [
            'business_id' => $schoolBusiness->id,
        ])
            ->assertOk()
            ->assertJsonPath('business.id', $schoolBusiness->id)
            ->assertJsonPath('business.business_type', 'school');

        $createResponse = $this->postJson('/api/auth/businesses', [
            'business_name' => 'Taska Delivery Link',
            'business_email' => 'delivery-link@example.com',
            'business_type' => 'delivery_company',
            'business_category' => 'services',
            'business_location' => 'Kaduna, Nigeria',
            'primary_branch_name' => 'Dispatch HQ',
            'contact_phone' => '08038880000',
        ])->assertCreated();

        $newBusinessId = $createResponse->json('business.id');

        $createResponse
            ->assertJsonPath('business.business_type', 'delivery_company')
            ->assertJsonPath('current_business.id', $newBusinessId)
            ->assertJsonPath('needs_business_onboarding', false);

        $this->assertDatabaseHas('business_user', [
            'user_id' => $user->id,
            'business_id' => $newBusinessId,
            'status' => 'active',
        ]);
    }

    private function makeBusiness(string $name, string $businessType): Business
    {
        return Business::create([
            'name' => $name,
            'slug' => str()->slug($name) . '-' . str()->lower(str()->random(4)),
            'email' => str()->slug($name) . '-' . str()->lower(str()->random(4)) . '@example.com',
            'business_type' => $businessType,
            'business_category' => config("business_types.types.{$businessType}.group", 'general'),
            'modules' => config("business_types.types.{$businessType}.modules", []),
        ]);
    }

    private function attachMembership(User $user, Business $business, string $roleSlug): void
    {
        $roleConfig = collect(config('business_types.roles', []))->firstWhere('slug', $roleSlug);

        $role = Role::create([
            'business_id' => $business->id,
            'name' => $roleConfig['name'],
            'slug' => $roleConfig['slug'],
            'description' => $roleConfig['description'],
            'is_default' => $roleConfig['is_default'] ?? false,
        ]);

        $branch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Main Branch',
            'slug' => 'main-branch-' . str()->lower(str()->random(4)),
            'is_primary' => true,
            'is_active' => true,
        ]);

        DB::table('business_user')->insert([
            'business_id' => $business->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'branch_id' => $branch->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        DB::table('role_user')->insert([
            'role_id' => $role->id,
            'user_id' => $user->id,
            'business_id' => $business->id,
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
