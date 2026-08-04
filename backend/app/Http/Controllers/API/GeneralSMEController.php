<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\GeneralSME\StoreSMECashEntryRequest;
use App\Http\Requests\GeneralSME\StoreSMEDailyTargetRequest;
use App\Http\Requests\GeneralSME\StoreSMEFollowUpRequest;
use App\Http\Resources\SMECashEntryResource;
use App\Http\Resources\SMEDailyTargetResource;
use App\Http\Resources\SMEFollowUpResource;
use App\Services\GeneralSMEService;
use Illuminate\Http\Request;

class GeneralSMEController extends Controller
{
    public function __construct(
        private GeneralSMEService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
    }

    public function storeCashEntry(StoreSMECashEntryRequest $request)
    {
        $validated = $request->validated();

        $entry = $this->service->createCashEntry(
            $validated,
            $request->user()->current_business_id,
            $request->user()->current_branch_id,
            $request->user()->id
        );

        return response()->json(
            (new SMECashEntryResource($entry->load('customer')))->resolve(),
            201
        );
    }

    public function storeFollowUp(StoreSMEFollowUpRequest $request)
    {
        $validated = $request->validated();

        $followUp = $this->service->createFollowUp(
            $validated,
            $request->user()->current_business_id,
            $request->user()->current_branch_id
        );

        return response()->json(
            (new SMEFollowUpResource($followUp->load('customer')))->resolve(),
            201
        );
    }

    public function storeDailyTarget(StoreSMEDailyTargetRequest $request)
    {
        $validated = $request->validated();

        $target = $this->service->createDailyTarget(
            $validated,
            $request->user()->current_business_id,
            $request->user()->current_branch_id
        );

        return response()->json(
            (new SMEDailyTargetResource($target))->resolve(),
            201
        );
    }
}
