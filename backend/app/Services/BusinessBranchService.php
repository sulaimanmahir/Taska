<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BusinessBranchService
{
    public function __construct(
        private BusinessContextService $businessContextService,
        private AccessAuditLogger $accessAuditLogger,
    ) {
    }

    public function getBranchContext(User $actor): array
    {
        $business = $this->resolveCurrentBusiness($actor);
        $branches = $this->loadBranches($business, $actor);

        return [
            'business' => [
                'id' => $business->id,
                'name' => $business->name,
                'business_type' => $business->business_type,
                'business_type_label' => config("business_types.types.{$business->business_type}.name", str($business->business_type)->headline()->toString()),
                'current_branch_id' => (int) $actor->current_business_id === (int) $business->id
                    ? ($actor->current_branch_id ? (int) $actor->current_branch_id : null)
                    : null,
            ],
            'summary' => [
                'branch_count' => $branches->count(),
                'active_branch_count' => $branches->where('is_active', true)->count(),
                'inactive_branch_count' => $branches->where('is_active', false)->count(),
                'branch_coverage_count' => $branches->where('active_member_count', '>', 0)->count(),
                'warehouse_count' => $branches->sum('warehouse_count'),
            ],
            'branches' => $branches->values()->all(),
        ];
    }

    public function createBranch(User $actor, array $payload): array
    {
        $business = $this->resolveCurrentBusiness($actor);
        $isActive = array_key_exists('is_active', $payload) ? (bool) $payload['is_active'] : true;
        $hasPrimary = Branch::query()
            ->where('business_id', $business->id)
            ->where('is_primary', true)
            ->exists();
        $isPrimary = !$hasPrimary
            ? true
            : (array_key_exists('is_primary', $payload)
            ? (bool) $payload['is_primary']
            : false);

        if ($isPrimary && !$isActive) {
            throw ValidationException::withMessages([
                'is_active' => ['Primary branches must stay active.'],
            ]);
        }

        $branch = DB::transaction(function () use ($business, $payload, $isPrimary, $isActive) {
            if ($isPrimary) {
                Branch::query()
                    ->where('business_id', $business->id)
                    ->where('is_primary', true)
                    ->update(['is_primary' => false]);
            }

            return Branch::create([
                'business_id' => $business->id,
                'name' => $payload['name'],
                'slug' => $payload['slug'] ?? $this->generateUniqueBranchSlug($business->id, $payload['name']),
                'phone' => $payload['phone'] ?? null,
                'address' => $payload['address'] ?? null,
                'city' => $payload['city'] ?? null,
                'state' => $payload['state'] ?? null,
                'is_primary' => $isPrimary,
                'is_active' => $isActive,
            ]);
        });

        $this->accessAuditLogger->log(
            $business,
            $actor,
            'branch_created',
            'branch',
            $branch->id,
            $branch->name,
            $this->accessAuditLogger->diff([], [
                'is_primary' => $isPrimary,
                'is_active' => $isActive,
            ], ['is_primary', 'is_active']),
        );

        return [
            'message' => 'Branch created successfully.',
            ...$this->getBranchContext($actor),
        ];
    }

    public function updateBranch(User $actor, Branch $branch, array $payload): array
    {
        $business = $this->resolveCurrentBusiness($actor);
        $branch = $this->resolveBranch($business, $branch);
        $nextIsActive = array_key_exists('is_active', $payload) ? (bool) $payload['is_active'] : (bool) $branch->is_active;
        $nextIsPrimary = array_key_exists('is_primary', $payload) ? (bool) $payload['is_primary'] : (bool) $branch->is_primary;

        if ($nextIsPrimary && !$nextIsActive) {
            throw ValidationException::withMessages([
                'is_active' => ['Primary branches must stay active.'],
            ]);
        }

        $activeMemberCount = $this->countActiveMembers($business, $branch);
        $activeBranchCount = $this->countActiveBranches($business);

        if ($branch->is_active && !$nextIsActive) {
            if ($activeMemberCount > 0) {
                throw ValidationException::withMessages([
                    'is_active' => ['Move or suspend active members assigned to this branch before deactivating it.'],
                ]);
            }

            if ($activeBranchCount <= 1) {
                throw ValidationException::withMessages([
                    'is_active' => ['This workspace must keep at least one active branch.'],
                ]);
            }
        }

        $replacementPrimary = null;

        if ($branch->is_primary && (!$nextIsPrimary || !$nextIsActive)) {
            $replacementPrimary = Branch::query()
                ->where('business_id', $business->id)
                ->where('id', '!=', $branch->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->first();

            if (!$replacementPrimary) {
                throw ValidationException::withMessages([
                    'is_primary' => ['Promote another active branch before removing the current primary branch.'],
                ]);
            }
        }

        $beforeState = [
            'name' => $branch->name,
            'is_primary' => (bool) $branch->is_primary,
            'is_active' => (bool) $branch->is_active,
        ];
        $finalIsPrimary = $replacementPrimary ? false : $nextIsPrimary;

        DB::transaction(function () use ($branch, $business, $payload, $nextIsActive, $nextIsPrimary, $replacementPrimary) {
            if ($nextIsPrimary) {
                Branch::query()
                    ->where('business_id', $business->id)
                    ->where('id', '!=', $branch->id)
                    ->where('is_primary', true)
                    ->update(['is_primary' => false]);
            }

            if ($replacementPrimary) {
                Branch::query()
                    ->where('business_id', $business->id)
                    ->where('is_primary', true)
                    ->update(['is_primary' => false]);

                $replacementPrimary->forceFill(['is_primary' => true])->save();
            }

            $branch->update([
                'name' => $payload['name'] ?? $branch->name,
                'slug' => array_key_exists('slug', $payload) ? ($payload['slug'] ?? $branch->slug) : $branch->slug,
                'phone' => array_key_exists('phone', $payload) ? ($payload['phone'] ?? null) : $branch->phone,
                'address' => array_key_exists('address', $payload) ? ($payload['address'] ?? null) : $branch->address,
                'city' => array_key_exists('city', $payload) ? ($payload['city'] ?? null) : $branch->city,
                'state' => array_key_exists('state', $payload) ? ($payload['state'] ?? null) : $branch->state,
                'is_primary' => $replacementPrimary ? false : $nextIsPrimary,
                'is_active' => $nextIsActive,
            ]);
        });

        $this->accessAuditLogger->log(
            $business,
            $actor,
            'branch_updated',
            'branch',
            $branch->id,
            $payload['name'] ?? $beforeState['name'],
            $this->accessAuditLogger->diff($beforeState, [
                'name' => $payload['name'] ?? $beforeState['name'],
                'is_primary' => $finalIsPrimary,
                'is_active' => $nextIsActive,
            ], ['name', 'is_primary', 'is_active']),
        );

        return [
            'message' => 'Branch updated successfully.',
            ...$this->getBranchContext($actor),
        ];
    }

    private function resolveCurrentBusiness(User $user): Business
    {
        if (!$user->current_business_id) {
            abort(404, 'No active business selected.');
        }

        $business = $this->businessContextService->findAccessibleBusiness($user, $user->current_business_id);

        if (!$business) {
            abort(404, 'Active business not found.');
        }

        return $business;
    }

    private function resolveBranch(Business $business, Branch $branch): Branch
    {
        if ((int) $branch->business_id !== (int) $business->id) {
            abort(404, 'Branch not found for this workspace.');
        }

        return $branch;
    }

    private function loadBranches(Business $business, User $actor): Collection
    {
        $memberCounts = DB::table('business_user')
            ->selectRaw(
                "branch_id, count(*) as member_count, sum(case when status = 'suspended' then 1 else 0 end) as suspended_member_count, sum(case when status = 'active' or status is null then 1 else 0 end) as active_member_count"
            )
            ->where('business_id', $business->id)
            ->whereNotNull('branch_id')
            ->groupBy('branch_id')
            ->get()
            ->keyBy('branch_id');

        $warehouseCounts = DB::table('warehouses')
            ->selectRaw('branch_id, count(*) as warehouse_count')
            ->where('business_id', $business->id)
            ->whereNotNull('branch_id')
            ->groupBy('branch_id')
            ->get()
            ->keyBy('branch_id');

        $activeBranchCount = $this->countActiveBranches($business);

        return Branch::query()
            ->where('business_id', $business->id)
            ->orderByDesc('is_primary')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get()
            ->map(function (Branch $branch) use ($actor, $business, $memberCounts, $warehouseCounts, $activeBranchCount) {
                $memberCount = $memberCounts->get($branch->id);
                $warehouseCount = $warehouseCounts->get($branch->id);
                $activeMemberCount = (int) ($memberCount?->active_member_count ?? 0);
                $isLastActiveBranch = (bool) $branch->is_active && $activeBranchCount <= 1;

                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'slug' => $branch->slug,
                    'phone' => $branch->phone,
                    'address' => $branch->address,
                    'city' => $branch->city,
                    'state' => $branch->state,
                    'location' => $this->formatLocation($branch),
                    'is_primary' => (bool) $branch->is_primary,
                    'is_active' => (bool) $branch->is_active,
                    'member_count' => (int) ($memberCount?->member_count ?? 0),
                    'active_member_count' => $activeMemberCount,
                    'suspended_member_count' => (int) ($memberCount?->suspended_member_count ?? 0),
                    'warehouse_count' => (int) ($warehouseCount?->warehouse_count ?? 0),
                    'is_current_user_branch' => (int) $actor->current_business_id === (int) $business->id
                        && (int) $actor->current_branch_id === (int) $branch->id,
                    'is_last_active_branch' => $isLastActiveBranch,
                    'can_deactivate' => (bool) $branch->is_active && $activeMemberCount === 0 && !$isLastActiveBranch,
                    'deactivation_block_reason' => $activeMemberCount > 0
                        ? 'Move or suspend active members before turning this branch off.'
                        : ($isLastActiveBranch ? 'Every workspace must keep at least one active branch.' : null),
                ];
            })
            ->values();
    }

    private function countActiveBranches(Business $business): int
    {
        return Branch::query()
            ->where('business_id', $business->id)
            ->where('is_active', true)
            ->count();
    }

    private function countActiveMembers(Business $business, Branch $branch): int
    {
        return DB::table('business_user')
            ->where('business_id', $business->id)
            ->where('branch_id', $branch->id)
            ->where(function ($query) {
                $query->where('status', 'active')
                    ->orWhereNull('status');
            })
            ->count();
    }

    private function formatLocation(Branch $branch): ?string
    {
        $parts = collect([$branch->address, $branch->city, $branch->state])
            ->filter()
            ->unique()
            ->values();

        return $parts->isEmpty() ? null : $parts->implode(', ');
    }

    private function generateUniqueBranchSlug(int $businessId, string $name): string
    {
        $base = Str::slug($name);
        $slug = $base !== '' ? $base : 'branch';
        $candidate = $slug;
        $suffix = 1;

        while (Branch::query()->where('business_id', $businessId)->where('slug', $candidate)->exists()) {
            $candidate = "{$slug}-{$suffix}";
            $suffix += 1;
        }

        return $candidate;
    }
}
