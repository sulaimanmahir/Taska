<?php

namespace App\Services;

use App\Models\Business;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BusinessWarehouseService
{
    public function __construct(
        private BusinessContextService $businessContextService,
    ) {
    }

    public function getWarehouses(User $actor): LengthAwarePaginator
    {
        $business = $this->resolveCurrentBusiness($actor);

        return Warehouse::query()
            ->where('business_id', $business->id)
            ->with('branch:id,name')
            ->orderByDesc('is_default')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->paginate(20);
    }

    public function createWarehouse(User $actor, array $payload): array
    {
        $business = $this->resolveCurrentBusiness($actor);
        $hasDefault = Warehouse::query()
            ->where('business_id', $business->id)
            ->where('is_default', true)
            ->exists();
        $isDefault = !$hasDefault
            ? true
            : (array_key_exists('is_default', $payload) ? (bool) $payload['is_default'] : false);
        $isActive = array_key_exists('is_active', $payload) ? (bool) $payload['is_active'] : true;

        if ($isDefault && !$isActive) {
            throw ValidationException::withMessages([
                'is_active' => ['Default warehouses must stay active.'],
            ]);
        }

        $warehouse = DB::transaction(function () use ($business, $payload, $isDefault, $isActive) {
            if ($isDefault) {
                Warehouse::query()
                    ->where('business_id', $business->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            return Warehouse::create([
                'business_id' => $business->id,
                'branch_id' => $payload['branch_id'] ?? null,
                'name' => $payload['name'],
                'slug' => $payload['slug'] ?? $this->generateUniqueWarehouseSlug($business->id, $payload['name']),
                'description' => $payload['description'] ?? null,
                'address' => $payload['address'] ?? null,
                'is_default' => $isDefault,
                'is_active' => $isActive,
            ]);
        });

        return [
            'message' => 'Warehouse created successfully.',
            'warehouse' => $warehouse->fresh('branch:id,name'),
        ];
    }

    public function updateWarehouse(User $actor, Warehouse $warehouse, array $payload): array
    {
        $business = $this->resolveCurrentBusiness($actor);
        $warehouse = $this->resolveWarehouse($business, $warehouse);

        $nextIsActive = array_key_exists('is_active', $payload) ? (bool) $payload['is_active'] : (bool) $warehouse->is_active;
        $nextIsDefault = array_key_exists('is_default', $payload) ? (bool) $payload['is_default'] : (bool) $warehouse->is_default;

        if ($nextIsDefault && !$nextIsActive) {
            throw ValidationException::withMessages([
                'is_active' => ['Default warehouses must stay active.'],
            ]);
        }

        $activeWarehouseCount = $this->countActiveWarehouses($business);
        $replacementDefault = null;

        if ($warehouse->is_active && !$nextIsActive && $activeWarehouseCount <= 1) {
            throw ValidationException::withMessages([
                'is_active' => ['This workspace must keep at least one active warehouse.'],
            ]);
        }

        if ($warehouse->is_default && (!$nextIsDefault || !$nextIsActive)) {
            $replacementDefault = Warehouse::query()
                ->where('business_id', $business->id)
                ->where('id', '!=', $warehouse->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->first();

            if (!$replacementDefault) {
                throw ValidationException::withMessages([
                    'is_default' => ['Promote another active warehouse before removing the current default warehouse.'],
                ]);
            }
        }

        $warehouse = DB::transaction(function () use ($business, $warehouse, $payload, $nextIsDefault, $nextIsActive, $replacementDefault) {
            if ($nextIsDefault) {
                Warehouse::query()
                    ->where('business_id', $business->id)
                    ->where('id', '!=', $warehouse->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            if ($replacementDefault) {
                Warehouse::query()
                    ->where('business_id', $business->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);

                $replacementDefault->forceFill(['is_default' => true])->save();
            }

            $warehouse->update([
                'branch_id' => array_key_exists('branch_id', $payload) ? ($payload['branch_id'] ?? null) : $warehouse->branch_id,
                'name' => $payload['name'] ?? $warehouse->name,
                'slug' => array_key_exists('slug', $payload) ? ($payload['slug'] ?? $warehouse->slug) : $warehouse->slug,
                'description' => array_key_exists('description', $payload) ? ($payload['description'] ?? null) : $warehouse->description,
                'address' => array_key_exists('address', $payload) ? ($payload['address'] ?? null) : $warehouse->address,
                'is_default' => $replacementDefault ? false : $nextIsDefault,
                'is_active' => $nextIsActive,
            ]);

            return $warehouse->fresh('branch:id,name');
        });

        return [
            'message' => 'Warehouse updated successfully.',
            'warehouse' => $warehouse,
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

    private function resolveWarehouse(Business $business, Warehouse $warehouse): Warehouse
    {
        if ((int) $warehouse->business_id !== (int) $business->id) {
            abort(404, 'Warehouse not found for this workspace.');
        }

        return $warehouse;
    }

    private function countActiveWarehouses(Business $business): int
    {
        return Warehouse::query()
            ->where('business_id', $business->id)
            ->where('is_active', true)
            ->count();
    }

    private function generateUniqueWarehouseSlug(int $businessId, string $name): string
    {
        $base = Str::slug($name);
        $slug = $base !== '' ? $base : 'warehouse';
        $candidate = $slug;
        $suffix = 1;

        while (Warehouse::query()->where('business_id', $businessId)->where('slug', $candidate)->exists()) {
            $candidate = "{$slug}-{$suffix}";
            $suffix += 1;
        }

        return $candidate;
    }
}
