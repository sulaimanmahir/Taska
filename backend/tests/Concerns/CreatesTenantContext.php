<?php

namespace Tests\Concerns;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Role;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

trait CreatesTenantContext
{
    protected function createTenantContext(string $businessType = 'retail', string $email = 'owner@example.com'): array
    {
        $user = User::factory()->create([
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $business = Business::create([
            'name' => 'Test Business ' . str()->random(4),
            'slug' => str()->slug('Test Business ' . str()->random(4)),
            'email' => 'biz-' . str()->random(6) . '@example.com',
            'business_type' => $businessType,
            'modules' => config("business_types.types.{$businessType}.modules", []),
        ]);

        $role = Role::create([
            'business_id' => $business->id,
            'name' => 'Business Owner',
            'slug' => 'admin',
            'description' => 'Full access',
            'is_default' => true,
        ]);

        DB::table('business_user')->insert([
            'business_id' => $business->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
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

        $branch = Branch::create([
            'business_id' => $business->id,
            'name' => 'HQ',
            'slug' => 'hq-' . str()->random(4),
            'is_primary' => true,
            'is_active' => true,
        ]);

        $warehouse = Warehouse::create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'Main Warehouse',
            'slug' => 'warehouse-' . str()->random(4),
            'is_default' => true,
            'is_active' => true,
        ]);

        $user->forceFill([
            'current_business_id' => $business->id,
            'current_branch_id' => $branch->id,
        ])->save();

        return compact('user', 'business', 'branch', 'warehouse', 'role');
    }
}
