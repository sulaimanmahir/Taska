<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateApprovalSettingsRequest;
use App\Http\Resources\ApprovalRequestResource;
use App\Models\ApprovalRequest;
use App\Services\ApprovalService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ApprovalController extends Controller
{
    public function __construct(
        private ApprovalService $approvalService,
    ) {
    }

    public function settings(Request $request)
    {
        $business = $request->user()->currentBusiness;

        return response()->json([
            'expense_approval_threshold' => $business->expense_approval_threshold,
            'discount_approval_threshold' => $business->discount_approval_threshold,
            'require_inventory_adjustment_approval' => (bool) $business->require_inventory_adjustment_approval,
        ]);
    }

    public function updateSettings(UpdateApprovalSettingsRequest $request)
    {
        $business = $request->user()->currentBusiness;
        $business->update($request->validated());

        return response()->json([
            'message' => 'Approval settings updated successfully.',
            'expense_approval_threshold' => $business->expense_approval_threshold,
            'discount_approval_threshold' => $business->discount_approval_threshold,
            'require_inventory_adjustment_approval' => (bool) $business->require_inventory_adjustment_approval,
        ]);
    }

    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $query = ApprovalRequest::withoutGlobalScope('business')
            ->where('business_id', $businessId)
            ->with(['requester', 'decider', 'branch'])
            ->orderByRaw("status = 'pending' desc")
            ->orderByDesc('created_at');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $approvals = $query->paginate(20);

        return ApprovalRequestResource::collection($approvals)->response();
    }

    public function approve(Request $request, ApprovalRequest $approval)
    {
        $this->authorizeSameBusiness($request, $approval);

        try {
            $result = $this->approvalService->approve($approval, $request->user());
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => $exception->errors(),
            ], 422);
        }

        return response()->json([
            'message' => 'Request approved.',
            'approval' => (new ApprovalRequestResource($result['approval']))->resolve(),
        ]);
    }

    public function decline(Request $request, ApprovalRequest $approval)
    {
        $this->authorizeSameBusiness($request, $approval);
        $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        try {
            $declined = $this->approvalService->decline($approval, $request->user(), $request->input('reason'));
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => $exception->errors(),
            ], 422);
        }

        return response()->json([
            'message' => 'Request declined.',
            'approval' => (new ApprovalRequestResource($declined))->resolve(),
        ]);
    }

    private function authorizeSameBusiness(Request $request, ApprovalRequest $approval): void
    {
        abort_if((int) $approval->business_id !== (int) $request->user()->current_business_id, 404);
    }
}
