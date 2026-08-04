<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NGODistributionSignatureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'distribution_id' => $this->distribution_id,
            'beneficiary_name' => $this->beneficiary_name,
            'signed_by' => $this->signed_by,
            'signature_reference' => $this->signature_reference,
            'signed_at' => $this->signed_at?->toJSON(),
            'distribution' => $this->whenLoaded('distribution', fn () => [
                'id' => $this->distribution?->id,
                'distribution_reference' => $this->distribution?->distribution_reference,
                'beneficiary_name' => $this->distribution?->beneficiary_name,
                'status' => $this->distribution?->status,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
