<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class BusinessContextService
{
    public function summarizeBusinessesForUser(User $user): Collection
    {
        $supportsBilling = Schema::hasTable('business_subscriptions') && Schema::hasTable('subscription_plans');
        $query = $user->businesses()
            ->withCount('branches')
            ->with(['branches' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('id')])
            ->where(function ($query) {
                $query->where('business_user.status', 'active')
                    ->orWhereNull('business_user.status');
            });

        if ($supportsBilling) {
            $query->with('subscription.plan');
        }

        $memberships = $query->get();
        $membershipBusinessIds = $memberships->pluck('id');
        $fallbackRoleAssignments = Role::query()
            ->whereIn('id', $memberships->pluck('pivot.role_id')->filter()->map(fn ($roleId) => (int) $roleId))
            ->whereIn('business_id', $membershipBusinessIds)
            ->get()
            ->keyBy(fn (Role $role) => $this->roleAssignmentKey($role->business_id, $role->id));

        $roleAssignments = $user->roles()
            ->wherePivotIn('business_id', $membershipBusinessIds)
            ->get()
            ->keyBy(fn (Role $role) => (int) $role->pivot->business_id);

        return $memberships->map(function (Business $business) use ($user, $roleAssignments, $fallbackRoleAssignments, $supportsBilling) {
            $role = $roleAssignments->get($business->id)
                ?? ($business->pivot?->role_id
                    ? $fallbackRoleAssignments->get($this->roleAssignmentKey($business->id, (int) $business->pivot->role_id))
                    : null);

            $currentBranch = $this->resolveAssignedBranchForBusiness($business);
            $typeConfig = config("business_types.types.{$business->business_type}", []);
            $subscriptionStatus = $supportsBilling ? ($business->subscription?->status ?? 'not_subscribed') : 'not_configured';
            $subscriptionPlan = $supportsBilling ? $business->subscription?->plan?->name : null;
            $subscriptionPlanSlug = $supportsBilling ? $business->subscription?->plan?->slug : null;

            return [
                'id' => $business->id,
                'name' => $business->name,
                'business_type' => $business->business_type,
                'business_type_label' => $typeConfig['name'] ?? str($business->business_type)->headline()->toString(),
                'active_business_types' => $business->activeBusinessTypes(),
                'business_category' => $business->business_category ?? ($typeConfig['group'] ?? 'general'),
                'logo_url' => $business->logo_url,
                'email' => $business->email,
                'phone' => $business->phone,
                'address' => $business->address,
                'city' => $business->city,
                'state' => $business->state,
                'country' => $business->country,
                'currency' => $business->currency,
                'timezone' => $business->timezone,
                'role_name' => $role?->name ?? str($user->role ?? 'staff')->headline()->toString(),
                'role_slug' => $role?->slug ?? ($user->role ?? 'staff'),
                'branch_count' => $business->branches_count ?? $business->branches->count(),
                'branch_id' => $currentBranch?->id,
                'subscription_status' => $subscriptionStatus,
                'subscription_plan' => $subscriptionPlan,
                'subscription_plan_slug' => $subscriptionPlanSlug,
                'modules' => $business->modules ?? [],
                'is_active' => $business->is_active,
                'membership_status' => $business->pivot?->status ?? 'active',
                'location' => $this->formatLocation($business),
                'current' => (int) $user->current_business_id === (int) $business->id,
            ];
        })->values();
    }

    public function summarizeCurrentBusiness(?Business $business, Collection $summaries): ?array
    {
        if (!$business) {
            return null;
        }

        return $summaries->firstWhere('id', $business->id);
    }

    public function findAccessibleBusiness(User $user, int $businessId): ?Business
    {
        $supportsBilling = Schema::hasTable('business_subscriptions') && Schema::hasTable('subscription_plans');
        $query = $user->businesses()
            ->withCount('branches')
            ->with(['branches' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('id')])
            ->where(function ($query) {
                $query->where('business_user.status', 'active')
                    ->orWhereNull('business_user.status');
            })
            ->where('businesses.id', $businessId);

        if ($supportsBilling) {
            $query->with('subscription.plan');
        }

        return $query->first();
    }

    public function resolveAssignedBranchForBusiness(Business $business): ?Branch
    {
        $assignedBranchId = $business->pivot?->branch_id ? (int) $business->pivot->branch_id : null;

        if ($assignedBranchId) {
            $assignedBranch = $business->branches->firstWhere('id', $assignedBranchId);

            if ($assignedBranch?->is_active) {
                return $assignedBranch;
            }
        }

        return $this->resolveBranchForBusiness($business);
    }

    public function resolveBranchForBusiness(Business $business): ?Branch
    {
        return $business->branches->first(fn (Branch $branch) => $branch->is_primary && $branch->is_active)
            ?? $business->branches->first(fn (Branch $branch) => $branch->is_active)
            ?? $business->branches->firstWhere('is_primary', true)
            ?? $business->branches->first();
    }

    private function formatLocation(Business $business): ?string
    {
        $parts = collect([$business->address, $business->city, $business->state, $business->country])
            ->filter()
            ->unique()
            ->values();

        return $parts->isEmpty() ? null : $parts->implode(', ');
    }

    private function roleAssignmentKey(int $businessId, int $roleId): string
    {
        return $businessId . ':' . $roleId;
    }
}
