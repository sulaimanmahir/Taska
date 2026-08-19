<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\NGO\StoreNGODistributionRequest;
use App\Http\Requests\NGO\StoreNGODistributionSignatureRequest;
use App\Http\Resources\NGODistributionResource;
use App\Http\Resources\NGODistributionSignatureResource;
use App\Models\NGODistribution;
use App\Services\NGOWarehouseService;
use Illuminate\Http\Request;

class NGOWarehouseController extends Controller
{
    use ValidatesBusinessOwnership;

    public function __construct(
        private NGOWarehouseService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
    }

    public function storeDonor(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'compliance_reference' => 'nullable|string|max:255',
        ]);

        return response()->json($this->service->createDonor($validated, $request->user()->current_business_id), 201);
    }

    public function storePartnerRequest(Request $request)
    {
        $validated = $request->validate([
            'partner_name' => 'required|string|max:255',
            'request_notes' => 'nullable|string',
            'needed_by' => 'nullable|date',
            'status' => 'nullable|in:pending,approved,fulfilled,cancelled',
        ]);

        return response()->json($this->service->createPartnerRequest($validated, $request->user()->current_business_id, $request->user()->current_branch_id), 201);
    }

    public function storeDistribution(StoreNGODistributionRequest $request)
    {
        $businessId = $request->user()->current_business_id;

        return (new NGODistributionResource(
            $this->service->createDistribution($request->validated(), $businessId, $request->user()->current_branch_id, $request->user()->id)
        ))->response()->setStatusCode(201);
    }

    public function storeSignature(StoreNGODistributionSignatureRequest $request, NGODistribution $distribution)
    {
        $this->authorize('update', $distribution);

        return (new NGODistributionSignatureResource(
            $this->service->captureSignature($distribution, $request->validated())
        ))->response()->setStatusCode(201);
    }
}
