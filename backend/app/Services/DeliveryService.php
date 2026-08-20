<?php

namespace App\Services;

use App\Models\DeliveryContact;
use App\Models\DeliveryComplaint;
use App\Models\DeliveryDispute;
use App\Models\DeliveryManifest;
use App\Models\DeliveryOrder;
use App\Models\DeliverySettlement;
use App\Models\DeliveryStatusEvent;
use App\Models\DeliveryVehicle;
use App\Models\DeliveryWalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeliveryService
{
    public function __construct(private readonly OfflineSyncService $offlineSyncService)
    {
    }

    public function createOrder(array $payload, int $businessId, ?int $userId = null): DeliveryOrder
    {
        return DB::transaction(function () use ($payload, $businessId, $userId) {
            $sender = $this->firstOrCreateContact($businessId, $payload['sender']);
            $recipient = $this->firstOrCreateContact($businessId, $payload['recipient']);

            $offlineMetadata = $this->offlineSyncService->stampRecordMetadata([], $payload['offline'] ?? []);
            $deliveryOrder = DeliveryOrder::create([
                'business_id' => $businessId,
                'branch_id' => $payload['branch_id'] ?? null,
                'pickup_branch_id' => $payload['pickup_branch_id'] ?? null,
                'dropoff_branch_id' => $payload['dropoff_branch_id'] ?? null,
                'sender_contact_id' => $sender->id,
                'recipient_contact_id' => $recipient->id,
                'assigned_rider_id' => $payload['assigned_rider_id'] ?? null,
                'vehicle_id' => $payload['vehicle_id'] ?? null,
                'tracking_code' => $this->generateTrackingCode($businessId),
                'delivery_otp_code' => $this->generateOtpCode(),
                'status' => 'pending_pickup',
                'parcel_category' => $payload['parcel_category'],
                'parcel_description' => $payload['parcel_description'] ?? null,
                'pricing_model' => $payload['pricing_model'] ?? 'flat',
                'distance_km' => $payload['distance_km'] ?? null,
                'base_fee' => $payload['base_fee'],
                'distance_fee' => $payload['distance_fee'] ?? 0,
                'urgent_fee' => !empty($payload['is_urgent']) ? ($payload['urgent_fee'] ?? 0) : 0,
                'total_fee' => $payload['base_fee'] + ($payload['distance_fee'] ?? 0) + (!empty($payload['is_urgent']) ? ($payload['urgent_fee'] ?? 0) : 0),
                'cod_amount' => $payload['cod_amount'] ?? 0,
                'amount_remitted' => 0,
                'is_urgent' => (bool) ($payload['is_urgent'] ?? false),
                'pickup_address' => $payload['pickup_address'],
                'dropoff_address' => $payload['dropoff_address'],
                'created_offline' => $offlineMetadata['created_offline'],
                'device_id' => $offlineMetadata['device_id'],
                'local_timestamp' => $offlineMetadata['local_timestamp'],
                'synced_at' => $offlineMetadata['synced_at'],
            ]);

            $this->recordEvent($deliveryOrder, 'pending_pickup', $userId, $payload['notes'] ?? 'Delivery registered.', $payload['offline'] ?? []);

            return $deliveryOrder->load(['sender', 'recipient', 'vehicle', 'assignedRider', 'events']);
        });
    }

    public function markPickedUp(DeliveryOrder $order, array $payload, ?int $userId = null): DeliveryOrder
    {
        return DB::transaction(function () use ($order, $payload, $userId) {
            $order->update([
                'status' => 'picked_up',
                'proof_of_pickup_url' => $payload['proof_url'] ?? $order->proof_of_pickup_url,
                'picked_up_at' => now(),
            ]);

            $this->recordEvent($order, 'picked_up', $userId, $payload['notes'] ?? 'Parcel picked up.', $payload['offline'] ?? [], $payload['proof_url'] ?? null);

            return $order->fresh(['events', 'sender', 'recipient', 'vehicle', 'assignedRider']);
        });
    }

    public function markDelivered(DeliveryOrder $order, array $payload, ?int $userId = null): DeliveryOrder
    {
        return DB::transaction(function () use ($order, $payload, $userId) {
            $amountRemitted = (float) ($payload['amount_remitted'] ?? $order->amount_remitted);
            $codFraudFlagged = $order->cod_amount > 0 && $amountRemitted < $order->cod_amount;

            $order->update([
                'status' => 'delivered',
                'proof_of_delivery_url' => $payload['proof_url'] ?? $order->proof_of_delivery_url,
                'amount_remitted' => $amountRemitted,
                'delivered_at' => now(),
                'cod_fraud_flagged' => $codFraudFlagged,
            ]);

            $this->recordEvent($order, 'delivered', $userId, $payload['notes'] ?? 'Parcel delivered successfully.', $payload['offline'] ?? [], $payload['proof_url'] ?? null);

            if ($codFraudFlagged) {
                $this->recordEvent($order, 'cod_fraud_flagged', $userId, 'Delivery marked with outstanding COD balance.');
            }

            return $order->fresh(['events', 'sender', 'recipient', 'vehicle', 'assignedRider']);
        });
    }

    public function markFailed(DeliveryOrder $order, array $payload, ?int $userId = null): DeliveryOrder
    {
        return DB::transaction(function () use ($order, $payload, $userId) {
            $status = empty($payload['rescheduled_for']) ? 'failed' : 'rescheduled';
            $order->update([
                'status' => $status,
                'failed_delivery_reason' => $payload['failed_delivery_reason'] ?? 'Failed delivery',
                'rescheduled_for' => $payload['rescheduled_for'] ?? null,
            ]);

            $this->recordEvent($order, $status, $userId, $payload['failed_delivery_reason'] ?? 'Delivery update recorded.', $payload['offline'] ?? []);

            return $order->fresh(['events', 'sender', 'recipient', 'vehicle', 'assignedRider']);
        });
    }

    public function createSettlement(DeliveryOrder $order, array $payload = []): DeliverySettlement
    {
        return DB::transaction(function () use ($order, $payload) {
            $vehicle = $order->vehicle && $order->vehicle->business_id === $order->business_id
                ? $order->vehicle
                : null;

            if (!$vehicle && $order->vehicle_id) {
                $vehicle = DeliveryVehicle::where('business_id', $order->business_id)
                    ->find($order->vehicle_id);
            }

            $riderShare = round($order->total_fee * 0.35, 2);
            $ownerShare = round($order->total_fee * 0.25, 2);
            $companyShare = round($order->total_fee - $riderShare - $ownerShare, 2);

            $fuelDeduction = $vehicle && $vehicle->fuel_responsibility === 'company'
                ? (float) ($payload['fuel_deduction'] ?? round($order->total_fee * 0.05, 2))
                : 0.0;
            $maintenanceDeduction = $vehicle && $vehicle->maintenance_responsibility === 'company'
                ? (float) ($payload['maintenance_deduction'] ?? round($order->total_fee * 0.03, 2))
                : 0.0;

            if ($vehicle && in_array($vehicle->ownership_model, ['rider_owned', 'investor_rider'], true)) {
                $riderShare += $ownerShare;
                $ownerShare = 0.0;
            }

            $settlement = DeliverySettlement::updateOrCreate(
                ['delivery_order_id' => $order->id],
                [
                    'business_id' => $order->business_id,
                    'vehicle_id' => $order->vehicle_id,
                    'rider_id' => $order->assigned_rider_id,
                    'total_delivery_fee' => $order->total_fee,
                    'rider_share' => $riderShare,
                    'owner_share' => $ownerShare,
                    'company_share' => $companyShare,
                    'fuel_deduction' => $fuelDeduction,
                    'maintenance_deduction' => $maintenanceDeduction,
                    'net_rider_payout' => max($riderShare - $fuelDeduction - $maintenanceDeduction, 0),
                    'net_owner_payout' => max($ownerShare, 0),
                    'company_retained_earnings' => $companyShare + $fuelDeduction + $maintenanceDeduction,
                    'status' => $payload['status'] ?? 'approved',
                    'settled_at' => now(),
                ]
            );

            $this->recordEvent($order, 'settlement_created', null, 'Settlement prepared for delivery order.');

            return $settlement;
        });
    }

    public function recordRemittance(DeliveryOrder $order, array $payload, ?int $userId = null): DeliveryOrder
    {
        return DB::transaction(function () use ($order, $payload, $userId) {
            $amountRemitted = (float) ($payload['amount_remitted'] ?? 0);

            if ($amountRemitted > (float) $order->cod_amount) {
                throw ValidationException::withMessages([
                    'amount_remitted' => ['Amount remitted cannot exceed the COD amount for this delivery.'],
                ]);
            }

            $order->update([
                'amount_remitted' => $amountRemitted,
            ]);

            $remainingBalance = max((float) $order->cod_amount - $amountRemitted, 0);

            $this->recordEvent(
                $order,
                'remittance_recorded',
                $userId,
                $payload['notes'] ?? "COD remittance updated. Outstanding balance: {$remainingBalance}.",
                $payload['offline'] ?? [],
                $payload['proof_url'] ?? null
            );

            return $order->fresh(['events', 'sender', 'recipient', 'vehicle', 'assignedRider', 'settlement']);
        });
    }

    public function markSettlementPaid(DeliveryOrder $order, ?int $userId = null): DeliverySettlement
    {
        return DB::transaction(function () use ($order, $userId) {
            $settlement = $order->settlement()->firstOrFail();

            $settlement->update([
                'status' => 'paid',
                'settled_at' => now(),
            ]);

            $this->recordEvent($order, 'settlement_paid', $userId, 'Settlement marked as paid.');

            if ($settlement->rider_id && (float) $settlement->net_rider_payout > 0) {
                DeliveryWalletTransaction::create([
                    'business_id' => $order->business_id,
                    'delivery_order_id' => $order->id,
                    'rider_id' => $settlement->rider_id,
                    'direction' => 'credit',
                    'reference' => 'WALLET-' . strtoupper(str()->random(10)),
                    'reason' => 'Delivery settlement payout',
                    'amount' => $settlement->net_rider_payout,
                    'meta' => [
                        'tracking_code' => $order->tracking_code,
                    ],
                ]);
            }

            return $settlement->fresh();
        });
    }

    public function confirmDeliveryOtp(DeliveryOrder $order, string $otpCode, ?int $userId = null): DeliveryOrder
    {
        return DB::transaction(function () use ($order, $otpCode, $userId) {
            abort_unless($order->delivery_otp_code && hash_equals($order->delivery_otp_code, $otpCode), 422, 'Invalid OTP code.');

            $order->update([
                'delivery_otp_verified_at' => now(),
            ]);

            $this->recordEvent($order, 'otp_confirmed', $userId, 'Delivery OTP verified successfully.');

            return $order->fresh(['events', 'sender', 'recipient', 'vehicle', 'assignedRider', 'settlement']);
        });
    }

    public function createManifest(array $payload, int $businessId, ?int $userId = null): DeliveryManifest
    {
        return DB::transaction(function () use ($payload, $businessId, $userId) {
            $manifest = DeliveryManifest::create([
                'business_id' => $businessId,
                'branch_id' => $payload['branch_id'] ?? null,
                'vehicle_id' => $payload['vehicle_id'] ?? null,
                'rider_id' => $payload['rider_id'] ?? null,
                'created_by' => $userId,
                'manifest_code' => $this->generateManifestCode($businessId),
                'title' => $payload['title'],
                'status' => $payload['status'] ?? 'draft',
                'notes' => $payload['notes'] ?? null,
                'dispatched_at' => ($payload['status'] ?? 'draft') === 'dispatched' ? now() : null,
            ]);

            $orders = DeliveryOrder::query()
                ->where('business_id', $businessId)
                ->whereIn('id', $payload['delivery_order_ids'])
                ->get();

            $manifest->orders()->sync($orders->pluck('id'));

            foreach ($orders as $order) {
                $order->update([
                    'assigned_rider_id' => $payload['rider_id'] ?? $order->assigned_rider_id,
                    'vehicle_id' => $payload['vehicle_id'] ?? $order->vehicle_id,
                    'status' => $manifest->status === 'dispatched' && $order->status === 'pending_pickup'
                        ? 'in_transit'
                        : $order->status,
                ]);

                $this->recordEvent(
                    $order,
                    'manifest_attached',
                    $userId,
                    "Attached to manifest {$manifest->manifest_code}."
                );
            }

            return $manifest->load(['orders.sender', 'orders.recipient', 'vehicle', 'rider']);
        });
    }

    public function createDispute(DeliveryOrder $order, array $payload, ?int $userId = null): DeliveryDispute
    {
        return DB::transaction(function () use ($order, $payload, $userId) {
            $dispute = DeliveryDispute::create([
                'business_id' => $order->business_id,
                'delivery_order_id' => $order->id,
                'created_by' => $userId,
                'category' => $payload['category'],
                'summary' => $payload['summary'],
                'status' => $payload['status'] ?? 'open',
            ]);

            $this->recordEvent(
                $order,
                'dispute_logged',
                $userId,
                $payload['summary']
            );

            return $dispute->load(['order', 'creator']);
        });
    }

    public function createComplaint(DeliveryOrder $order, array $payload, ?int $userId = null): DeliveryComplaint
    {
        return DB::transaction(function () use ($order, $payload, $userId) {
            $complaint = DeliveryComplaint::create([
                'business_id' => $order->business_id,
                'delivery_order_id' => $order->id,
                'created_by' => $userId,
                'source' => $payload['source'] ?? 'internal',
                'category' => $payload['category'],
                'summary' => $payload['summary'],
                'status' => $payload['status'] ?? 'open',
            ]);

            $this->recordEvent($order, 'complaint_logged', $userId, $payload['summary']);

            return $complaint->load(['order', 'creator']);
        });
    }

    private function firstOrCreateContact(int $businessId, array $payload): DeliveryContact
    {
        return DeliveryContact::firstOrCreate(
            [
                'business_id' => $businessId,
                'phone' => $payload['phone'],
                'name' => $payload['name'],
            ],
            [
                'email' => $payload['email'] ?? null,
                'address' => $payload['address'] ?? null,
                'landmark' => $payload['landmark'] ?? null,
            ]
        );
    }

    private function recordEvent(DeliveryOrder $order, string $status, ?int $userId, ?string $notes, array $offline = [], ?string $proofUrl = null): void
    {
        $offlineMetadata = $this->offlineSyncService->stampRecordMetadata([], [
            'created_offline' => $offline['created_offline'] ?? false,
            'device_id' => $offline['device_id'] ?? null,
            'local_timestamp' => $offline['local_timestamp'] ?? null,
        ]);

        DeliveryStatusEvent::create([
            'business_id' => $order->business_id,
            'delivery_order_id' => $order->id,
            'created_by' => $userId,
            'status' => $status,
            'notes' => $notes,
            'proof_url' => $proofUrl,
            'recorded_offline' => $offlineMetadata['created_offline'],
            'device_id' => $offlineMetadata['device_id'],
            'local_timestamp' => $offlineMetadata['local_timestamp'],
            'synced_at' => $offlineMetadata['synced_at'],
        ]);
    }

    private function generateTrackingCode(int $businessId): string
    {
        return 'TSK-' . $businessId . '-' . strtoupper(str()->random(8));
    }

    private function generateManifestCode(int $businessId): string
    {
        return 'MNF-' . $businessId . '-' . strtoupper(str()->random(6));
    }

    private function generateOtpCode(): string
    {
        return (string) random_int(100000, 999999);
    }
}
