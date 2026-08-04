<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_profile_settings(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'owner@example.com',
            'phone' => '08030000000',
        ]);
        $business = $this->makeBusiness('Taska Pharmacy', 'pharmacy');
        $this->attachMembership($user, $business, 'admin');

        $user->forceFill([
            'current_business_id' => $business->id,
            'current_branch_id' => $business->branches()->value('id'),
        ])->save();

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/auth/profile', [
                'name' => 'Amina Bello',
                'email' => 'amina@example.com',
                'phone' => '08031112222',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Profile updated successfully')
            ->assertJsonPath('user.name', 'Amina Bello')
            ->assertJsonPath('user.email', 'amina@example.com')
            ->assertJsonPath('user.phone', '08031112222')
            ->assertJsonPath('current_business.id', $business->id)
            ->assertJsonPath('current_business.business_type', 'pharmacy');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Amina Bello',
            'email' => 'amina@example.com',
            'phone' => '08031112222',
        ]);
    }

    public function test_authenticated_user_can_update_current_business_settings(): void
    {
        $user = User::factory()->create();
        $business = $this->makeBusiness('Taska Retail', 'retail');
        $branch = $this->attachMembership($user, $business, 'admin');

        $user->forceFill([
            'current_business_id' => $business->id,
            'current_branch_id' => $branch->id,
        ])->save();

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/auth/current-business', [
                'name' => 'Taska Prime Retail',
                'email' => 'prime@example.com',
                'phone' => '08039990000',
                'address' => '12 Market Road',
                'city' => 'Kano',
                'state' => 'Kano',
                'country' => 'Nigeria',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Business settings updated successfully')
            ->assertJsonPath('current_business.id', $business->id)
            ->assertJsonPath('current_business.name', 'Taska Prime Retail')
            ->assertJsonPath('current_business.email', 'prime@example.com')
            ->assertJsonPath('current_business.phone', '08039990000')
            ->assertJsonPath('current_business.address', '12 Market Road')
            ->assertJsonPath('current_business.city', 'Kano')
            ->assertJsonPath('current_business.state', 'Kano')
            ->assertJsonPath('current_business.country', 'Nigeria')
            ->assertJsonPath('current_business.location', '12 Market Road, Kano, Nigeria');

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'name' => 'Taska Prime Retail',
            'email' => 'prime@example.com',
            'phone' => '08039990000',
            'address' => '12 Market Road',
            'city' => 'Kano',
            'state' => 'Kano',
            'country' => 'Nigeria',
        ]);
    }

    public function test_profile_update_enforces_unique_email_addresses(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.com']);
        User::factory()->create(['email' => 'taken@example.com']);

        $token = $user->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/auth/profile', [
                'name' => 'Owner',
                'email' => 'taken@example.com',
                'phone' => '08034445555',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_business_settings_update_enforces_unique_business_email_addresses(): void
    {
        $user = User::factory()->create();
        $business = $this->makeBusiness('Taska Retail', 'retail');
        $branch = $this->attachMembership($user, $business, 'admin');
        $otherBusiness = $this->makeBusiness('Taska Hotel', 'hotel');
        $otherBusiness->update(['email' => 'taken-business@example.com']);

        $user->forceFill([
            'current_business_id' => $business->id,
            'current_branch_id' => $branch->id,
        ])->save();

        $token = $user->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/auth/current-business', [
                'name' => 'Taska Retail',
                'email' => 'taken-business@example.com',
                'phone' => '08038889999',
                'address' => 'Retail Yard',
                'city' => 'Kaduna',
                'state' => 'Kaduna',
                'country' => 'Nigeria',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_business_settings_update_requires_an_active_business_context(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/auth/current-business', [
                'name' => 'Taska Retail',
                'email' => 'retail@example.com',
                'phone' => '08037778888',
            ])
            ->assertNotFound()
            ->assertJsonPath('message', 'No active business selected');
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

    private function attachMembership(User $user, Business $business, string $roleSlug): Branch
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

        return $branch;
    }
}
