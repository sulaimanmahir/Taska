<?php

namespace App\Services;

use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountSettingsService
{
    public function __construct(
        private BusinessContextService $businessContextService,
    ) {
    }

    public function updateProfile(User $user, array $payload): User
    {
        return DB::transaction(function () use ($user, $payload) {
            $user->fill($this->normalizePayload($payload));
            $user->save();

            return $user->fresh();
        });
    }

    public function updateCurrentBusiness(User $user, array $payload): ?Business
    {
        if (!$user->current_business_id) {
            return null;
        }

        $business = $this->businessContextService->findAccessibleBusiness($user, $user->current_business_id);

        if (!$business) {
            return null;
        }

        return DB::transaction(function () use ($business, $payload) {
            $business->fill($this->normalizePayload($payload));
            $business->save();

            return $business->fresh();
        });
    }

    private function normalizePayload(array $payload): array
    {
        return collect($payload)
            ->map(function ($value) {
                if (!is_string($value)) {
                    return $value;
                }

                $trimmed = trim($value);

                return $trimmed === '' ? null : $trimmed;
            })
            ->all();
    }
}
