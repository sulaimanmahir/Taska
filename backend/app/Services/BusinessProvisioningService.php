<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class BusinessProvisioningService
{
    public function __construct(
        private BillingService $billingService,
    ) {
    }

    public function registerOwnerWithBusiness(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $user = User::create([
                'name' => $payload['name'],
                'email' => $payload['email'],
                'password' => Hash::make($payload['password']),
                'phone' => $payload['phone'] ?? null,
                'role' => $payload['role'] ?? 'admin',
            ]);

            return $this->createBusinessForUser($user, array_merge($payload, [
                'business_email' => $payload['business_email'] ?? $payload['email'],
            ]), true);
        });
    }

    public function createBusinessForUser(User $user, array $payload, bool $createToken = false): array
    {
        return DB::transaction(function () use ($user, $payload, $createToken) {
            $businessType = $payload['business_type'];
            $typeConfig = config("business_types.types.{$businessType}", []);

            $business = Business::create([
                'name' => $payload['business_name'],
                'slug' => $this->generateUniqueBusinessSlug($payload['business_name']),
                'email' => $payload['business_email'] ?? $payload['contact_email'] ?? $user->email,
                'phone' => $payload['contact_phone'] ?? $payload['phone'] ?? null,
                'logo_url' => $payload['logo_url'] ?? null,
                'address' => $payload['business_location'] ?? null,
                'city' => $payload['city'] ?? null,
                'state' => $payload['state'] ?? null,
                'country' => $payload['country'] ?? 'Nigeria',
                'business_type' => $businessType,
                'active_business_types' => [$businessType],
                'business_category' => $payload['business_category'] ?? ($typeConfig['group'] ?? 'general'),
                'modules' => $this->getDefaultModules($businessType),
                'timezone' => 'Africa/Lagos',
            ]);

            $this->createDefaultRoles($business);

            $ownerRole = Role::where('business_id', $business->id)
                ->where('slug', $payload['role'] ?? 'admin')
                ->firstOrFail();

            $branch = Branch::create([
                'business_id' => $business->id,
                'name' => $payload['primary_branch_name'] ?? 'Main Branch',
                'slug' => $this->generateUniqueBranchSlug($business->id, $payload['primary_branch_name'] ?? 'Main Branch'),
                'phone' => $payload['contact_phone'] ?? $payload['phone'] ?? null,
                'address' => $payload['business_location'] ?? null,
                'city' => $payload['city'] ?? null,
                'state' => $payload['state'] ?? null,
                'is_primary' => true,
                'is_active' => true,
            ]);

            Warehouse::firstOrCreate(
                ['business_id' => $business->id, 'slug' => 'main-warehouse'],
                [
                    'branch_id' => $branch->id,
                    'name' => 'Main Warehouse',
                    'slug' => 'main-warehouse',
                    'is_default' => true,
                    'is_active' => true,
                ]
            );

            $this->attachUserToBusiness($user, $business, $ownerRole, $branch, $payload['created_by'] ?? null);

            $this->provisionSubscription($business, $payload['subscription_plan_id'] ?? null, $payload['billing_cycle'] ?? 'monthly');

            $user->forceFill([
                'current_business_id' => $business->id,
                'current_branch_id' => $branch->id,
            ])->save();

            $freshRelations = [];
            if (Schema::hasTable('business_subscriptions') && Schema::hasTable('subscription_plans')) {
                $freshRelations[] = 'subscription.plan';
            }

            return [
                'user' => $user->fresh(),
                'business' => $business->fresh($freshRelations),
                'branch' => $branch,
                'token' => $createToken ? $user->createToken('auth-token')->plainTextToken : null,
            ];
        });
    }

    public function attachUserToBusiness(User $user, Business $business, Role $role, Branch $branch, ?int $createdBy = null, string $status = 'active'): void
    {
        DB::table('business_user')->updateOrInsert(
            [
                'business_id' => $business->id,
                'user_id' => $user->id,
            ],
            [
                'role_id' => $role->id,
                'branch_id' => $branch->id,
                'status' => $status,
                'created_by' => $createdBy,
                // An invited member hasn't actually joined yet - joined_at is
                // set for real once they accept the invite (see
                // BusinessTeamService::acceptInvite()).
                'joined_at' => $status === 'active' ? now() : null,
            ]
        );

        DB::table('role_user')->updateOrInsert(
            [
                'role_id' => $role->id,
                'user_id' => $user->id,
                'business_id' => $business->id,
            ],
            [
                'assigned_by' => $createdBy,
                'assigned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function repairBusinessState(Business $business): array
    {
        $restoredAssignments = $this->repairUserRoleAssignments($business);
        $roles = Role::where('business_id', $business->id)->get();
        $syncedRoles = 0;

        foreach ($roles as $role) {
            $this->syncRolePermissions($role);
            $syncedRoles += 1;
        }

        $subscriptionCreated = false;

        if (
            Schema::hasTable('business_subscriptions')
            && Schema::hasTable('subscription_plans')
            && !$business->subscription()->exists()
        ) {
            try {
                $this->billingService->createTrialSubscription($business);
                $subscriptionCreated = true;
            } catch (\RuntimeException) {
                // If plans are not seeded yet, the caller can seed and rerun the repair command.
            }
        }

        return [
            'business_id' => $business->id,
            'restored_role_assignments' => $restoredAssignments,
            'synced_roles' => $syncedRoles,
            'created_trial_subscription' => $subscriptionCreated,
        ];
    }

    private function createDefaultRoles(Business $business): void
    {
        foreach (config('business_types.roles', []) as $roleData) {
            $role = Role::firstOrCreate(
                ['business_id' => $business->id, 'slug' => $roleData['slug']],
                array_merge($roleData, ['business_id' => $business->id])
            );

            $this->syncRolePermissions($role);
        }
    }

    public function syncRolePermissions(Role $role): void
    {
        $allowedPermissions = match ($role->slug) {
            'admin', 'support_admin' => Permission::pluck('id')->all(),
            'manager' => Permission::whereIn('module', ['dashboard', 'branches', 'warehouses', 'products', 'inventory', 'sales', 'purchases', 'crm', 'suppliers', 'reports', 'settings'])->pluck('id')->all(),
            'cashier' => Permission::whereIn('module', ['dashboard', 'sales', 'crm'])->pluck('id')->all(),
            'accountant' => Permission::whereIn('module', ['dashboard', 'sales', 'expenses', 'reports', 'settings'])->pluck('id')->all(),
            'inventory_officer' => Permission::whereIn('module', ['dashboard', 'products', 'inventory', 'purchases', 'suppliers'])->pluck('id')->all(),
            'receptionist' => Permission::whereIn('module', ['dashboard', 'crm'])->pluck('id')->all(),
            default => Permission::whereIn('module', ['dashboard'])->pluck('id')->all(),
        };

        if (!empty($allowedPermissions)) {
            $role->permissions()->syncWithoutDetaching($allowedPermissions);
        }
    }

    private function provisionSubscription(Business $business, ?int $planId, string $billingCycle): void
    {
        if ($planId) {
            $this->billingService->subscribe($business, $planId, $billingCycle);
            return;
        }

        try {
            $this->billingService->createTrialSubscription($business);
        } catch (\RuntimeException) {
            // Development and tests may not seed billing plans; business setup should still succeed.
        }
    }

    private function repairUserRoleAssignments(Business $business): int
    {
        $assignments = DB::table('business_user')
            ->where('business_id', $business->id)
            ->whereNotNull('role_id')
            ->get();

        $restored = 0;

        foreach ($assignments as $assignment) {
            $payload = [
                'assigned_by' => $assignment->created_by,
                'assigned_at' => $assignment->joined_at ?? now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $existing = DB::table('role_user')->where([
                'role_id' => $assignment->role_id,
                'user_id' => $assignment->user_id,
                'business_id' => $assignment->business_id,
            ])->exists();

            DB::table('role_user')->updateOrInsert(
                [
                    'role_id' => $assignment->role_id,
                    'user_id' => $assignment->user_id,
                    'business_id' => $assignment->business_id,
                ],
                $payload
            );

            if (! $existing) {
                $restored += 1;
            }
        }

        return $restored;
    }

    private function generateUniqueBusinessSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (Business::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix += 1;
        }

        return $slug;
    }

    private function generateUniqueBranchSlug(int $businessId, string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (Branch::where('business_id', $businessId)->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix += 1;
        }

        return $slug;
    }

    private function getDefaultModules(string $businessType): array
    {
        return config("business_types.types.{$businessType}.modules")
            ?? config('business_types.types.mixed.modules', []);
    }
}
