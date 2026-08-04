<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\MobileAgent\ApproveMobileAgentFloatRequest;
use App\Http\Requests\MobileAgent\StoreMobileAgentReversalRequest;
use App\Http\Requests\MobileAgent\StoreMobileAgentShortageRequest;
use App\Http\Requests\MobileAgent\StoreMobileAgentTransactionRequest;
use App\Http\Resources\MobileAgentFloatRequestResource;
use App\Http\Resources\MobileAgentReversalResource;
use App\Http\Resources\MobileAgentShortageResource;
use App\Http\Resources\MobileAgentTransactionResource;
use App\Models\MobileAgentCommissionTier;
use App\Models\MobileAgentFloatRequest;
use App\Models\MobileAgentFraudAlert;
use App\Models\MobileAgentReversalLog;
use App\Models\MobileAgentShortageLog;
use App\Models\MobileAgentTransaction;
use App\Services\MobileAgentService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class MobileAgentController extends Controller
{
    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;
        $today = today()->toDateString();

        $summary = MobileAgentTransaction::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(processed_at) = date('now') THEN transaction_amount ELSE 0 END), 0) as volume_today,
                COALESCE(SUM(CASE WHEN date(processed_at) = date('now') THEN commission_amount ELSE 0 END), 0) as commissions_today,
                COALESCE(SUM(CASE WHEN status = 'reversal_pending' THEN 1 ELSE 0 END), 0) as reversals_pending
            ")
            ->first();

        $rankings = MobileAgentTransaction::query()
            ->where('business_id', $businessId)
            ->selectRaw('agent_name, COUNT(*) as transactions_count, COALESCE(SUM(transaction_amount), 0) as volume, COALESCE(SUM(commission_amount), 0) as commission')
            ->groupBy('agent_name')
            ->orderByDesc('commission')
            ->limit(5)
            ->get();

        return response()->json([
            'summary' => [
                'volume_today' => (float) ($summary?->volume_today ?? 0),
                'commissions_today' => (float) ($summary?->commissions_today ?? 0),
                'float_requests_pending' => MobileAgentFloatRequest::where('business_id', $businessId)->where('status', 'pending')->count(),
                'reversals_pending' => (int) ($summary?->reversals_pending ?? 0),
                'shortages_open' => MobileAgentShortageLog::where('business_id', $businessId)->where('status', 'open')->count(),
                'fraud_alerts_open' => MobileAgentFraudAlert::where('business_id', $businessId)->where('is_resolved', false)->count(),
                'float_approved_today' => (float) MobileAgentFloatRequest::where('business_id', $businessId)->whereDate('approved_at', $today)->sum('approved_amount'),
                'cash_shortage_today' => (float) MobileAgentShortageLog::where('business_id', $businessId)->whereDate('logged_at', $today)->sum('shortage_amount'),
            ],
            'agent_rankings' => $rankings,
        ]);
    }

    public function tiers(Request $request)
    {
        return response()->json(
            MobileAgentCommissionTier::where('business_id', $request->user()->current_business_id)
                ->orderBy('service_type')
                ->orderBy('minimum_volume')
                ->get()
        );
    }

    public function storeTier(Request $request, MobileAgentService $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'service_type' => 'required|in:cash_in,cash_out,transfer,bill_payment,airtime',
            'minimum_volume' => 'nullable|numeric|min:0',
            'maximum_volume' => 'nullable|numeric|min:0',
            'commission_rate' => 'nullable|numeric|min:0',
            'flat_bonus' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json($service->createCommissionTier($validated, $request->user()->current_business_id), 201);
    }

    public function floatRequests(Request $request)
    {
        return response()->json(
            MobileAgentFloatRequest::where('business_id', $request->user()->current_business_id)
                ->latest('requested_at')
                ->get()
        );
    }

    public function storeFloatRequest(Request $request, MobileAgentService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'staff_id' => ['nullable', $this->activeBusinessUserRule($businessId)],
            'agent_name' => 'required|string|max:255',
            'requested_amount' => 'required|numeric|min:0',
            'reason' => 'nullable|string|max:255',
        ]);

        return response()->json($service->createFloatRequest($validated, $businessId), 201);
    }

    public function approveFloatRequest(ApproveMobileAgentFloatRequest $request, MobileAgentFloatRequest $floatRequest, MobileAgentService $service)
    {
        $this->authorize('update', $floatRequest);

        return new MobileAgentFloatRequestResource(
            $service->approveFloatRequest($floatRequest, $request->validated())
        );
    }

    public function transactions(Request $request)
    {
        return response()->json(
            MobileAgentTransaction::where('business_id', $request->user()->current_business_id)
                ->with('commissionTier')
                ->latest('processed_at')
                ->get()
        );
    }

    public function storeTransaction(StoreMobileAgentTransactionRequest $request, MobileAgentService $service)
    {
        $businessId = $request->user()->current_business_id;

        return (new MobileAgentTransactionResource(
            $service->createTransaction($request->validated(), $businessId)
        ))->response()->setStatusCode(201);
    }

    public function reversals(Request $request)
    {
        return response()->json(
            MobileAgentReversalLog::where('business_id', $request->user()->current_business_id)
                ->with('transaction')
                ->latest('requested_at')
                ->get()
        );
    }

    public function storeReversal(StoreMobileAgentReversalRequest $request, MobileAgentService $service)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();
        $transaction = MobileAgentTransaction::findOrFail($validated['mobile_agent_transaction_id']);

        $this->authorize('view', $transaction);

        return (new MobileAgentReversalResource(
            $service->createReversal($validated, $businessId)
        ))->response()->setStatusCode(201);
    }

    public function shortages(Request $request)
    {
        return response()->json(
            MobileAgentShortageLog::where('business_id', $request->user()->current_business_id)
                ->latest('logged_at')
                ->get()
        );
    }

    public function storeShortage(StoreMobileAgentShortageRequest $request, MobileAgentService $service)
    {
        $businessId = $request->user()->current_business_id;

        return (new MobileAgentShortageResource(
            $service->createShortage($request->validated(), $businessId)
        ))->response()->setStatusCode(201);
    }

    public function fraudAlerts(Request $request)
    {
        return response()->json(
            MobileAgentFraudAlert::where('business_id', $request->user()->current_business_id)
                ->with('transaction')
                ->latest('flagged_at')
                ->get()
        );
    }

    private function businessOwnedRule(string $table, int $businessId): Exists
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }

    private function activeBusinessUserRule(int $businessId): Exists
    {
        return Rule::exists('users', 'id')->where(function ($query) use ($businessId) {
            $query->whereExists(function ($membershipQuery) use ($businessId) {
                $membershipQuery
                    ->selectRaw('1')
                    ->from('business_user')
                    ->whereColumn('business_user.user_id', 'users.id')
                    ->where('business_user.business_id', $businessId)
                    ->where('business_user.status', 'active');
            });
        });
    }
}
