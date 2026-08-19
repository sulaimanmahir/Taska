<?php

namespace App\Services;

use App\Models\ApprovalRequest;
use App\Models\Business;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Gates three actions (expense creation, inventory adjustments, order
 * discounts) behind an optional per-business approval step. Each action
 * type is opt-in - a null threshold or false flag on Business means
 * requiresApproval() always returns false, so an unconfigured business sees
 * no behavior change. When approval is required, the real creation logic is
 * never duplicated here: approve() calls the same service method the
 * direct (below-threshold) controller path already uses.
 */
class ApprovalService
{
    public function __construct(
        private ExpenseService $expenseService,
        private InventoryAdjustmentService $inventoryAdjustmentService,
        private OrderService $orderService,
    ) {
    }

    public function expenseRequiresApproval(Business $business, float $amount): bool
    {
        $threshold = $business->expense_approval_threshold;

        return $threshold !== null && $amount > (float) $threshold;
    }

    public function discountRequiresApproval(Business $business, float $discountAmount): bool
    {
        $threshold = $business->discount_approval_threshold;

        return $threshold !== null && $discountAmount > (float) $threshold;
    }

    public function inventoryAdjustmentRequiresApproval(Business $business): bool
    {
        return (bool) $business->require_inventory_adjustment_approval;
    }

    public function createRequest(
        Business $business,
        User $requester,
        string $actionType,
        array $payload,
        string $summary,
        ?int $branchId = null,
    ): ApprovalRequest {
        return ApprovalRequest::create([
            'business_id' => $business->id,
            'branch_id' => $branchId,
            'requested_by' => $requester->id,
            'action_type' => $actionType,
            'payload' => $payload,
            'summary' => $summary,
            'status' => ApprovalRequest::STATUS_PENDING,
        ]);
    }

    public function approve(ApprovalRequest $approvalRequest, User $approver): array
    {
        if ($approvalRequest->status !== ApprovalRequest::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'approval' => ['This request has already been decided.'],
            ]);
        }

        $result = match ($approvalRequest->action_type) {
            ApprovalRequest::TYPE_EXPENSE => $this->expenseService->createExpense($approvalRequest->payload),
            ApprovalRequest::TYPE_INVENTORY_ADJUSTMENT => $this->inventoryAdjustmentService->adjust(
                $approvalRequest->payload,
                $approvalRequest->business_id,
                $approvalRequest->requested_by,
            ),
            ApprovalRequest::TYPE_ORDER_DISCOUNT => $this->orderService->createOrder(
                $approvalRequest->payload,
                $approvalRequest->requested_by,
            ),
            default => throw ValidationException::withMessages([
                'approval' => ['Unknown approval action type.'],
            ]),
        };

        $approvalRequest->update([
            'status' => ApprovalRequest::STATUS_APPROVED,
            'decided_by' => $approver->id,
            'decided_at' => now(),
        ]);

        return [
            'approval' => $approvalRequest->fresh(),
            'result' => $result,
        ];
    }

    public function decline(ApprovalRequest $approvalRequest, User $approver, ?string $reason): ApprovalRequest
    {
        if ($approvalRequest->status !== ApprovalRequest::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'approval' => ['This request has already been decided.'],
            ]);
        }

        $approvalRequest->update([
            'status' => ApprovalRequest::STATUS_DECLINED,
            'decided_by' => $approver->id,
            'decided_at' => now(),
            'decline_reason' => $reason,
        ]);

        return $approvalRequest->fresh();
    }
}
