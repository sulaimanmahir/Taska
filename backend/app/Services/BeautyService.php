<?php

namespace App\Services;

use App\Models\BeautyAppointment;
use App\Models\BeautyProductUsage;
use App\Models\BeautyService as BeautyServiceModel;
use App\Models\BeautyStaffProfile;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BeautyService
{
    public function overview(int $businessId): array
    {
        $summary = BeautyAppointment::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(appointment_at) = date('now') THEN 1 ELSE 0 END), 0) as appointments_today,
                COALESCE(SUM(CASE WHEN date(completed_at) = date('now') THEN 1 ELSE 0 END), 0) as completed_today,
                COALESCE(SUM(CASE WHEN status IN ('scheduled', 'in_service') THEN 1 ELSE 0 END), 0) as pending_queue,
                COALESCE(SUM(CASE WHEN date(completed_at) = date('now') THEN service_price ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN commission_amount ELSE 0 END), 0) as commissions_due,
                COALESCE(SUM(CASE WHEN date(completed_at) = date('now') THEN product_cost ELSE 0 END), 0) as product_cost_today
            ")
            ->first();

        return [
            'summary' => [
                'appointments_today' => (int) ($summary?->appointments_today ?? 0),
                'completed_today' => (int) ($summary?->completed_today ?? 0),
                'pending_queue' => (int) ($summary?->pending_queue ?? 0),
                'revenue_today' => (float) ($summary?->revenue_today ?? 0),
                'commissions_due' => (float) ($summary?->commissions_due ?? 0),
                'product_cost_today' => (float) ($summary?->product_cost_today ?? 0),
                'repeat_clients' => Customer::where('business_id', $businessId)->where('customer_type', 'individual')->where('balance', '<=', 0)->count(),
            ],
            'services' => BeautyServiceModel::where('business_id', $businessId)->orderBy('name')->get(),
            'staff' => BeautyStaffProfile::where('business_id', $businessId)->orderBy('name')->get(),
            'appointments' => BeautyAppointment::with(['customer', 'service', 'staffProfile', 'productUsages'])
                ->where('business_id', $businessId)
                ->latest('appointment_at')
                ->get(),
            'customers' => Customer::where('business_id', $businessId)->orderBy('name')->get(),
            'products' => Product::where('business_id', $businessId)->orderBy('name')->get(),
            'insights' => [
                'profit_driver' => 'High-booking stylists, disciplined product usage, and strong repeat-customer rebooking drive salon margin.',
                'profit_killers' => ['Untracked product use', 'Idle staff chairs', 'Late arrivals and no-shows', 'Underpriced premium services'],
                'daily_decisions' => ['Which staff need more bookings', 'Which services are selling fastest', 'Which products are being overused', 'Which clients should be nudged to rebook'],
            ],
        ];
    }

    public function storeService(array $payload, User $user): BeautyServiceModel
    {
        return BeautyServiceModel::create([
            'business_id' => $user->current_business_id,
            'branch_id' => $user->current_branch_id,
            'name' => $payload['name'],
            'category' => $payload['category'] ?? null,
            'duration_minutes' => $payload['duration_minutes'] ?? 60,
            'price' => $payload['price'] ?? 0,
            'commission_rate' => $payload['commission_rate'] ?? 0,
            'is_active' => $payload['is_active'] ?? true,
        ]);
    }

    public function storeStaff(array $payload, User $user): BeautyStaffProfile
    {
        return BeautyStaffProfile::create([
            'business_id' => $user->current_business_id,
            'branch_id' => $user->current_branch_id,
            'user_id' => $payload['user_id'] ?? null,
            'name' => $payload['name'],
            'specialty' => $payload['specialty'] ?? null,
            'phone' => $payload['phone'] ?? null,
            'is_active' => $payload['is_active'] ?? true,
        ]);
    }

    public function storeAppointment(array $payload, User $user): BeautyAppointment
    {
        $businessId = $user->current_business_id;
        $service = $this->resolveService($businessId, $payload['service_id']);
        $customer = isset($payload['customer_id'])
            ? $this->resolveCustomer($businessId, $payload['customer_id'])
            : null;
        $staffProfile = isset($payload['staff_profile_id'])
            ? $this->resolveStaffProfile($businessId, $payload['staff_profile_id'])
            : null;

        return BeautyAppointment::create([
            'business_id' => $businessId,
            'branch_id' => $user->current_branch_id,
            'customer_id' => $customer?->id,
            'service_id' => $service->id,
            'staff_profile_id' => $staffProfile?->id,
            'appointment_at' => $payload['appointment_at'],
            'status' => $payload['status'] ?? 'scheduled',
            'service_price' => $payload['service_price'] ?? $service->price,
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    public function completeAppointment(BeautyAppointment $appointment, array $payload): BeautyAppointment
    {
        return DB::transaction(function () use ($appointment, $payload) {
            $appointment->loadMissing('service', 'staffProfile');

            $productCost = 0;
            foreach ($payload['product_usages'] ?? [] as $usage) {
                $quantity = (float) ($usage['quantity'] ?? 0);
                $unitCost = (float) ($usage['unit_cost'] ?? 0);
                $totalCost = round($quantity * $unitCost, 2);
                $product = !empty($usage['product_id'])
                    ? $this->resolveProduct($appointment->business_id, $usage['product_id'])
                    : null;
                $productName = $usage['product_name']
                    ?? $product?->name
                    ?? 'Beauty product';

                BeautyProductUsage::create([
                    'appointment_id' => $appointment->id,
                    'business_id' => $appointment->business_id,
                    'product_id' => $product?->id,
                    'product_name' => $productName,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totalCost,
                ]);

                $productCost += $totalCost;
            }

            $servicePrice = (float) ($payload['service_price'] ?? $appointment->service_price ?? $appointment->service?->price ?? 0);
            $commissionRate = (float) ($payload['commission_rate'] ?? $appointment->service?->commission_rate ?? 0);
            $commissionAmount = round($servicePrice * ($commissionRate / 100), 2);

            $appointment->update([
                'status' => 'completed',
                'service_price' => $servicePrice,
                'commission_amount' => $commissionAmount,
                'product_cost' => $productCost,
                'notes' => $payload['notes'] ?? $appointment->notes,
                'completed_at' => now(),
            ]);

            if ($appointment->staffProfile) {
                $appointment->staffProfile->increment('commission_wallet', $commissionAmount);
            }

            return $appointment->fresh(['customer', 'service', 'staffProfile', 'productUsages']);
        });
    }

    private function resolveCustomer(int $businessId, int $customerId): Customer
    {
        return Customer::where('business_id', $businessId)->findOrFail($customerId);
    }

    private function resolveProduct(int $businessId, int $productId): Product
    {
        return Product::where('business_id', $businessId)->findOrFail($productId);
    }

    private function resolveService(int $businessId, int $serviceId): BeautyServiceModel
    {
        return BeautyServiceModel::where('business_id', $businessId)->findOrFail($serviceId);
    }

    private function resolveStaffProfile(int $businessId, int $staffProfileId): BeautyStaffProfile
    {
        return BeautyStaffProfile::where('business_id', $businessId)->findOrFail($staffProfileId);
    }
}
