<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductionBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'batch_number' => $this->batch_number,
            'production_date' => $this->production_date?->toDateString(),
            'status' => $this->status,
            'total_input_quantity' => $this->total_input_quantity,
            'total_output_quantity' => $this->total_output_quantity,
            'damaged_quantity' => $this->damaged_quantity,
            'wastage_quantity' => $this->wastage_quantity,
            'notes' => $this->notes,
            'machine_runtime_hours' => $this->machine_runtime_hours,
            'downtime_minutes' => $this->downtime_minutes,
            'electricity_cost' => $this->electricity_cost,
            'generator_fuel_cost' => $this->generator_fuel_cost,
            'packaging_cost_total' => $this->packaging_cost_total,
            'total_batch_cost' => $this->total_batch_cost,
            'estimated_revenue' => $this->estimated_revenue,
            'net_margin' => $this->net_margin,
            'cost_per_bag' => $this->cost_per_bag,
            'leakage_losses' => $this->leakage_losses,
            'torn_sacks' => $this->torn_sacks,
            'damaged_nylon' => $this->damaged_nylon,
            'materials' => $this->whenLoaded('materials', fn () => $this->materials->map(fn ($material) => [
                'id' => $material->id,
                'raw_material_id' => $material->raw_material_id,
                'quantity_used' => $material->quantity_used,
                'cost' => $material->cost,
                'raw_material' => $material->relationLoaded('rawMaterial') ? [
                    'id' => $material->rawMaterial?->id,
                    'name' => $material->rawMaterial?->name,
                    'unit' => $material->rawMaterial?->unit,
                    'material_category' => $material->rawMaterial?->material_category,
                ] : null,
            ])->values()),
            'outputs' => $this->whenLoaded('outputs', fn () => $this->outputs->map(fn ($output) => [
                'id' => $output->id,
                'product_id' => $output->product_id,
                'quantity_produced' => $output->quantity_produced,
                'damaged_quantity' => $output->damaged_quantity,
                'selling_price' => $output->selling_price,
                'product' => $output->relationLoaded('product') ? [
                    'id' => $output->product?->id,
                    'name' => $output->product?->name,
                    'sku' => $output->product?->sku,
                ] : null,
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
