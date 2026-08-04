<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'supplier_id' => $this->supplier_id,
            'warehouse_id' => $this->warehouse_id,
            'created_by' => $this->created_by,
            'purchase_number' => $this->purchase_number,
            'status' => $this->status,
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'total' => $this->total,
            'paid' => $this->paid,
            'outstanding_balance' => $this->outstandingBalance(),
            'notes' => $this->notes,
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->supplier?->id,
                'name' => $this->supplier?->name,
                'phone' => $this->supplier?->phone,
                'email' => $this->supplier?->email,
                'balance' => $this->supplier?->balance,
            ]),
            'warehouse' => $this->whenLoaded('warehouse', fn () => [
                'id' => $this->warehouse?->id,
                'name' => $this->warehouse?->name,
            ]),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'purchase_id' => $item->purchase_id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'quantity_ordered' => $item->quantity_ordered,
                'quantity_received' => $item->quantity_received,
                'unit_cost' => $item->unit_cost,
                'total' => $item->total,
                'product' => $item->relationLoaded('product') ? [
                    'id' => $item->product?->id,
                    'name' => $item->product?->name,
                    'sku' => $item->product?->sku,
                    'low_stock_alert' => $item->product?->low_stock_alert,
                ] : null,
                'variant' => $item->relationLoaded('variant') ? [
                    'id' => $item->variant?->id,
                    'name' => $item->variant?->name,
                    'sku' => $item->variant?->sku,
                ] : null,
                'created_at' => $item->created_at?->toJSON(),
                'updated_at' => $item->updated_at?->toJSON(),
            ])->values()),
            'payments' => $this->whenLoaded(
                'payments',
                fn () => $this->payments->map(
                    fn ($payment) => (new PurchasePaymentResource($payment))->toArray($request)
                )->values()
            ),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
