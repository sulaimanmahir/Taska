<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Referrals\ListReferralCommissionsRequest;
use App\Http\Requests\Referrals\ListReferralPayoutsRequest;
use App\Http\Requests\Referrals\ProcessReferralPayoutRequest;
use App\Http\Requests\Referrals\StoreReferralAgentRequest;
use App\Http\Requests\Referrals\StoreReferralPayoutRequest;
use App\Http\Requests\Referrals\UpdateReferralAgentRequest;
use App\Http\Resources\ReferralAgentResource;
use App\Http\Resources\ReferralCommissionResource;
use App\Http\Resources\ReferralPayoutResource;
use App\Models\ReferralAgent;
use App\Models\ReferralCommission;
use App\Models\ReferralPayout;
use App\Models\ReferralTier;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerReferralController extends Controller
{
    public function __construct(private ReferralService $referralService)
    {
    }

    public function registerAgent(StoreReferralAgentRequest $request): JsonResponse
    {
        $business = $request->user()->business;
        $agent = $this->referralService->registerAgent($request->validated(), $business);

        return response()->json([
            'success' => true,
            'message' => 'Agent registration submitted',
            'data' => (new ReferralAgentResource($agent))->resolve(),
        ], 201);
    }

    public function getAgents(Request $request): JsonResponse
    {
        $business = $request->user()->business;
        $agents = $business->referralAgents()
            ->with(['commissions' => function ($query) {
                $query->latest()->take(5);
            }])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => ReferralAgentResource::collection($agents->getCollection())->resolve(),
            'meta' => [
                'current_page' => $agents->currentPage(),
                'last_page' => $agents->lastPage(),
                'total' => $agents->total(),
            ],
        ]);
    }

    public function getAgent(Request $request, int $id): JsonResponse
    {
        $agent = ReferralAgent::with(['documents', 'onboardingSteps', 'commissions'])->findOrFail($id);
        $this->authorize('view', $agent);

        $stats = $this->referralService->getAgentStats($agent);
        $agent->setAttribute('stats', $stats);

        return response()->json([
            'success' => true,
            'data' => (new ReferralAgentResource($agent))->resolve(),
        ]);
    }

    public function approveAgent(Request $request, int $id): JsonResponse
    {
        $agent = ReferralAgent::findOrFail($id);
        $this->authorize('update', $agent);

        $this->referralService->approveAgent($agent);
        $agent->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Agent approved',
            'data' => (new ReferralAgentResource($agent))->resolve(),
        ]);
    }

    public function updateAgent(UpdateReferralAgentRequest $request, int $id): JsonResponse
    {
        $agent = ReferralAgent::findOrFail($id);
        $this->authorize('update', $agent);
        $agent->update($request->validated());
        $agent->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Agent updated',
            'data' => (new ReferralAgentResource($agent))->resolve(),
        ]);
    }

    public function getTiers(): JsonResponse
    {
        $tiers = ReferralTier::where('is_active', true)->orderBy('min_referrals')->get();

        return response()->json([
            'success' => true,
            'data' => $tiers->map(fn ($tier) => [
                'id' => $tier->id,
                'name' => $tier->name,
                'slug' => $tier->slug,
                'min_referrals' => $tier->min_referrals,
                'max_referrals' => $tier->max_referrals,
                'commission_rate' => $tier->commission_rate,
                'recurring_rate' => $tier->recurring_rate,
                'badge_color' => $tier->badge_color,
            ]),
        ]);
    }

    public function getCommissions(ListReferralCommissionsRequest $request): JsonResponse
    {
        $query = ReferralCommission::query();

        if ($request->has('agent_id')) {
            $query->where('agent_id', $request->input('agent_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        $commissions = $query
            ->whereHas('agent', fn ($agentQuery) => $agentQuery->where('business_id', $request->user()->current_business_id))
            ->with(['agent', 'referredBusiness'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => ReferralCommissionResource::collection($commissions->getCollection())->resolve(),
            'meta' => [
                'current_page' => $commissions->currentPage(),
                'last_page' => $commissions->lastPage(),
                'total' => $commissions->total(),
            ],
        ]);
    }

    public function approveCommission(Request $request, int $id): JsonResponse
    {
        $commission = ReferralCommission::with(['agent', 'referredBusiness'])->findOrFail($id);
        $this->authorize('update', $commission);

        $this->referralService->approveCommission($commission);
        $commission->refresh()->load(['agent', 'referredBusiness']);

        return response()->json([
            'success' => true,
            'message' => 'Commission approved',
            'data' => (new ReferralCommissionResource($commission))->resolve(),
        ]);
    }

    public function getPayouts(ListReferralPayoutsRequest $request): JsonResponse
    {
        $query = ReferralPayout::query();

        if ($request->has('agent_id')) {
            $query->where('agent_id', $request->input('agent_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $payouts = $query
            ->whereHas('agent', fn ($agentQuery) => $agentQuery->where('business_id', $request->user()->current_business_id))
            ->with('agent')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => ReferralPayoutResource::collection($payouts->getCollection())->resolve(),
        ]);
    }

    public function createPayout(StoreReferralPayoutRequest $request): JsonResponse
    {
        $agent = ReferralAgent::findOrFail($request->validated('agent_id'));
        $this->authorize('update', $agent);

        if ((float) $agent->pending_payout < (float) $request->validated('amount')) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient pending earnings',
            ], 400);
        }

        $payout = $this->referralService->createPayout($agent, (float) $request->validated('amount'));
        $payout->load('agent');

        return response()->json([
            'success' => true,
            'message' => 'Payout created',
            'data' => (new ReferralPayoutResource($payout))->resolve(),
        ], 201);
    }

    public function processPayout(ProcessReferralPayoutRequest $request, int $id): JsonResponse
    {
        $payout = ReferralPayout::with('agent')->findOrFail($id);
        $this->authorize('update', $payout);
        $success = $this->referralService->processPayout($payout, $request->validated('gateway'));
        $payout->refresh()->load('agent');

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Payout processed' : 'Payout failed',
            'data' => (new ReferralPayoutResource($payout))->resolve(),
        ]);
    }

    public function getDashboardStats(Request $request): JsonResponse
    {
        $business = $request->user()->business;

        $totalAgents = $business->referralAgents()->count();
        $activeAgents = $business->referralAgents()->where('status', 'active')->count();
        $totalCommissions = ReferralCommission::whereIn('agent_id', $business->referralAgents()->select('id'))
            ->sum('amount');
        $pendingPayouts = ReferralPayout::whereIn('agent_id', $business->referralAgents()->select('id'))
            ->where('status', 'pending')
            ->sum('net_amount');
        $totalPaid = ReferralPayout::whereIn('agent_id', $business->referralAgents()->select('id'))
            ->where('status', 'completed')
            ->sum('net_amount');

        return response()->json([
            'success' => true,
            'data' => [
                'total_agents' => $totalAgents,
                'active_agents' => $activeAgents,
                'total_commissions' => $totalCommissions,
                'pending_payouts' => $pendingPayouts,
                'total_paid' => $totalPaid,
            ],
        ]);
    }
}
