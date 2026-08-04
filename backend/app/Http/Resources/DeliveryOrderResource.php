<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'pickup_branch_id' => $this->pickup_branch_id,
            'dropoff_branch_id' => $this->dropoff_branch_id,
            'sender_contact_id' => $this->sender_contact_id,
            'recipient_contact_id' => $this->recipient_contact_id,
            'assigned_rider_id' => $this->assigned_rider_id,
            'vehicle_id' => $this->vehicle_id,
            'tracking_code' => $this->tracking_code,
            'status' => $this->status,
            'parcel_category' => $this->parcel_category,
            'parcel_description' => $this->parcel_description,
            'pricing_model' => $this->pricing_model,
            'distance_km' => $this->distance_km,
            'base_fee' => $this->base_fee,
            'distance_fee' => $this->distance_fee,
            'urgent_fee' => $this->urgent_fee,
            'total_fee' => $this->total_fee,
            'cod_amount' => $this->cod_amount,
            'amount_remitted' => $this->amount_remitted,
            'is_urgent' => $this->is_urgent,
            'pickup_address' => $this->pickup_address,
            'dropoff_address' => $this->dropoff_address,
            'failed_delivery_reason' => $this->failed_delivery_reason,
            'rescheduled_for' => $this->rescheduled_for?->toJSON(),
            'picked_up_at' => $this->picked_up_at?->toJSON(),
            'delivered_at' => $this->delivered_at?->toJSON(),
            'delivery_otp_verified_at' => $this->delivery_otp_verified_at?->toJSON(),
            'cod_fraud_flagged' => $this->cod_fraud_flagged,
            'proof_of_pickup_url' => $this->proof_of_pickup_url,
            'proof_of_delivery_url' => $this->proof_of_delivery_url,
            'sender' => $this->whenLoaded('sender', fn () => [
                'id' => $this->sender?->id,
                'name' => $this->sender?->name,
                'phone' => $this->sender?->phone,
                'email' => $this->sender?->email,
                'address' => $this->sender?->address,
            ]),
            'recipient' => $this->whenLoaded('recipient', fn () => [
                'id' => $this->recipient?->id,
                'name' => $this->recipient?->name,
                'phone' => $this->recipient?->phone,
                'email' => $this->recipient?->email,
                'address' => $this->recipient?->address,
            ]),
            'assigned_rider' => $this->whenLoaded('assignedRider', fn () => [
                'id' => $this->assignedRider?->id,
                'name' => $this->assignedRider?->name,
                'email' => $this->assignedRider?->email,
            ]),
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle?->id,
                'plate_number' => $this->vehicle?->plate_number,
                'owner_name' => $this->vehicle?->owner_name,
            ]),
            'events' => $this->whenLoaded('events', fn () => $this->events->map(fn ($event) => [
                'id' => $event->id,
                'status' => $event->status,
                'notes' => $event->notes,
                'proof_url' => $event->proof_url,
                'recorded_at' => $event->created_at?->toJSON(),
            ])->values()),
            'settlement' => $this->whenLoaded('settlement', fn () => $this->settlement ? [
                'id' => $this->settlement->id,
                'status' => $this->settlement->status,
                'total_delivery_fee' => $this->settlement->total_delivery_fee,
                'net_rider_payout' => $this->settlement->net_rider_payout,
                'net_owner_payout' => $this->settlement->net_owner_payout,
                'company_retained_earnings' => $this->settlement->company_retained_earnings,
                'settled_at' => $this->settlement->settled_at?->toJSON(),
            ] : null),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
