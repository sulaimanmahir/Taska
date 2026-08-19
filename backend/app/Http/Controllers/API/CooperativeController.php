<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Cooperative\UpdateCooperativeFinancingStatusRequest;
use App\Http\Resources\CooperativeFinancingResource;
use App\Http\Resources\CooperativeProfitCycleResource;
use App\Models\Cooperative;
use App\Models\CooperativeFinancing;
use App\Models\CooperativeGovernanceRecord;
use App\Models\CooperativeProfitCycle;
use App\Services\CooperativeService;
use Illuminate\Http\Request;

class CooperativeController extends Controller
{
    use ValidatesBusinessOwnership;

    public function __construct(private CooperativeService $cooperativeService)
    {
    }

    public function show(Request $request)
    {
        $cooperative = $this->cooperativeService->getContext($request->user()->current_business_id);

        return response()->json($cooperative);
    }

    public function setup(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'slug' => 'nullable|string|max:160',
            'description' => 'nullable|string',
            'share_price' => 'required|numeric|min:1',
            'minimum_member_shares' => 'nullable|integer|min:1',
            'contribution_rule' => 'nullable|string',
            'profit_cycle' => 'required|in:monthly,quarterly,biannual,annual',
            'status' => 'nullable|in:active,draft,suspended',
            'subscription_plan_id' => 'nullable|exists:subscription_plans,id',
            'sharia_notes' => 'nullable|string',
            'loan_settings.required_guarantors' => 'nullable|integer|min:1|max:10',
            'loan_settings.min_shares_per_guarantor' => 'nullable|integer|min:0',
            'loan_settings.min_combined_guarantor_shares' => 'nullable|integer|min:0',
            'loan_settings.borrower_min_shares' => 'nullable|integer|min:0',
            'loan_settings.loan_limit_mode' => 'nullable|in:multiplier,percentage,fixed',
            'loan_settings.loan_limit_value' => 'nullable|numeric|min:0',
            'loan_settings.lock_borrower_shares' => 'nullable|boolean',
            'loan_settings.lock_guarantor_shares' => 'nullable|boolean',
            'loan_settings.liability_mode' => 'nullable|in:equal,proportional,custom',
            'loan_settings.allow_admin_override' => 'nullable|boolean',
            'loan_settings.custom_liability_notes' => 'nullable|string',
            'branding.branding_tier' => 'nullable|in:basic,standard,premium,enterprise',
            'branding.logo_url' => 'nullable|string|max:255',
            'branding.primary_color' => 'nullable|string|max:20',
            'branding.secondary_color' => 'nullable|string|max:20',
            'branding.remove_powered_by_taska' => 'nullable|boolean',
            'branding.custom_domain' => 'nullable|string|max:255',
            'branding.custom_tagline' => 'nullable|string|max:255',
        ]);

        $cooperative = $this->cooperativeService->ensureCooperative($request->user()->current_business_id, $validated);

        return response()->json($cooperative);
    }

    public function dashboard(Request $request)
    {
        $cooperative = $this->cooperativeService->getContext($request->user()->current_business_id);

        if (!$cooperative) {
            return response()->json([
                'configured' => false,
                'summary' => null,
            ]);
        }

        $shareMap = $this->cooperativeService->getMemberShareBalances($cooperative->id);
        $summary = $this->cooperativeService->getReportSnapshot($cooperative);

        return response()->json([
            'configured' => true,
            'cooperative' => $cooperative->load(['loanSettings', 'brandingSettings', 'wallets', 'subscriptionPlan']),
            'summary' => array_merge($summary, [
                'share_price' => (float) $cooperative->share_price,
                'members_with_shares' => count(array_filter($shareMap, fn ($shares) => $shares > 0)),
                'pending_guarantor_approvals' => $cooperative->financing()->where('status', 'pending_guarantor_approval')->count(),
                'pending_admin_approvals' => $cooperative->financing()->where('status', 'pending_admin_approval')->count(),
                'pending_withdrawals' => $cooperative->withdrawals()->where('status', 'requested')->count(),
                'active_investments' => $cooperative->investments()->where('status', 'active')->count(),
            ]),
        ]);
    }

    public function members(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        return response()->json(
            $cooperative->members()->with('customer')->latest()->get()
        );
    }

    public function storeMember(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'customer_id' => ['required', $this->businessOwnedRule('customers', $businessId)],
            'user_id' => ['nullable', $this->activeBusinessUserRule($businessId)],
            'member_number' => 'nullable|string|max:80',
            'role' => 'required|in:member,admin,treasurer,auditor',
            'joined_at' => 'nullable|date',
            'status' => 'nullable|in:active,pending,suspended',
            'notes' => 'nullable|string',
        ]);

        $member = $this->cooperativeService->addMember($cooperative, $validated);

        return response()->json($member->load('customer'), 201);
    }

    public function shares(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        return response()->json($cooperative->shares()->with('member.customer')->latest('issued_at')->get());
    }

    public function purchaseShares(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'member_id' => ['required', $this->businessOwnedRule('cooperative_members', $businessId)],
            'units' => 'required|numeric|min:0.01',
            'price_per_share' => 'nullable|numeric|min:1',
            'transaction_type' => 'nullable|in:purchase,bonus,redeem',
            'issued_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $share = $this->cooperativeService->purchaseShares($cooperative, $validated);

        return response()->json($share, 201);
    }

    public function financing(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        return response()->json(
            $cooperative->financing()->with(['member.customer', 'guarantors.member.customer', 'reports'])->latest()->get()
        );
    }

    public function storeFinancing(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'member_id' => ['required', $this->businessOwnedRule('cooperative_members', $businessId)],
            'financing_type' => 'required|in:qard_hasan,mudarabah,musharakah',
            'amount_requested' => 'nullable|numeric|min:0',
            'capital_amount' => 'nullable|numeric|min:0',
            'cooperative_capital' => 'nullable|numeric|min:0',
            'member_capital' => 'nullable|numeric|min:0',
            'profit_share_cooperative' => 'nullable|numeric|min:0|max:100',
            'profit_share_member' => 'nullable|numeric|min:0|max:100',
            'profit_share_ratio' => 'nullable|string|max:80',
            'business_description' => 'nullable|string',
            'duration_months' => 'nullable|integer|min:1|max:120',
            'repayment_due_date' => 'nullable|date',
            'guarantor_member_ids' => 'nullable|array',
            'guarantor_member_ids.*' => ['integer', $this->businessOwnedRule('cooperative_members', $businessId)],
            'sharia_notes' => 'nullable|string',
        ]);

        $financing = $this->cooperativeService->createFinancing($cooperative, $validated, $request->user()->id);

        return response()->json($financing, 201);
    }

    public function approveGuarantor(Request $request, CooperativeFinancing $financing, int $memberId)
    {
        $this->authorizeFinancing($financing);

        $updated = $this->cooperativeService->approveGuarantor($financing, $memberId);

        return response()->json($updated);
    }

    public function updateFinancingStatus(UpdateCooperativeFinancingStatusRequest $request, CooperativeFinancing $financing)
    {
        $this->authorize('update', $financing);

        $updated = $this->cooperativeService->updateFinancingStatus($financing, $request->validated(), $request->user()->id);

        return new CooperativeFinancingResource($updated);
    }

    public function storeFinancingReport(Request $request, CooperativeFinancing $financing)
    {
        $this->authorizeFinancing($financing);

        $validated = $request->validate([
            'reporting_period_start' => 'required|date',
            'reporting_period_end' => 'required|date|after_or_equal:reporting_period_start',
            'revenue' => 'nullable|numeric|min:0',
            'direct_cost' => 'nullable|numeric|min:0',
            'net_profit' => 'nullable|numeric',
            'cooperative_share_amount' => 'nullable|numeric|min:0',
            'member_share_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:draft,submitted,reviewed',
            'report_notes' => 'nullable|string',
        ]);

        $report = $this->cooperativeService->storeFinancingReport($financing, $validated);

        return response()->json($report, 201);
    }

    public function investments(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        return response()->json($cooperative->investments()->with('product')->latest()->get());
    }

    public function storeInvestment(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'product_id' => ['nullable', $this->businessOwnedRule('products', $businessId)],
            'name' => 'required|string|max:120',
            'category' => 'nullable|string|max:80',
            'status' => 'nullable|in:active,paused,closed',
            'amount' => 'required|numeric|min:0.01',
            'expected_return_rate' => 'nullable|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'linked_inventory' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $investment = $this->cooperativeService->createInvestment($cooperative, $validated);

        return response()->json($investment, 201);
    }

    public function profitCycles(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        return response()->json($cooperative->profitCycles()->with('distributions.member.customer')->latest('cycle_end')->get());
    }

    public function storeProfitCycle(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        $validated = $request->validate([
            'label' => 'required|string|max:120',
            'cycle_start' => 'required|date',
            'cycle_end' => 'required|date|after_or_equal:cycle_start',
            'total_profit' => 'required|numeric',
            'reserve_allocation' => 'nullable|numeric|min:0',
            'charity_allocation' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:draft,approved,distributed',
            'notes' => 'nullable|string',
        ]);

        $cycle = $this->cooperativeService->createProfitCycle($cooperative, $validated);

        return response()->json($cycle, 201);
    }

    public function distributeProfit(Request $request, CooperativeProfitCycle $profitCycle)
    {
        $this->authorize('update', $profitCycle);

        $cycle = $this->cooperativeService->distributeProfit($profitCycle);

        return new CooperativeProfitCycleResource($cycle);
    }

    public function withdrawals(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        return response()->json($cooperative->withdrawals()->with('member.customer')->latest()->get());
    }

    public function storeWithdrawal(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'member_id' => ['required', $this->businessOwnedRule('cooperative_members', $businessId)],
            'withdrawal_type' => 'required|in:profit_withdrawal,share_redemption',
            'status' => 'nullable|in:requested,approved,processed,rejected',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $withdrawal = $this->cooperativeService->requestWithdrawal($cooperative, $validated);

        return response()->json($withdrawal, 201);
    }

    public function governance(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        return response()->json(
            CooperativeGovernanceRecord::where('cooperative_id', $cooperative->id)
                ->latest('record_date')
                ->get()
        );
    }

    public function storeGovernance(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        $validated = $request->validate([
            'record_type' => 'required|in:meeting,audit,resolution,policy',
            'title' => 'required|string|max:160',
            'record_date' => 'nullable|date',
            'status' => 'nullable|in:scheduled,completed,approved,draft',
            'summary' => 'nullable|string',
            'decisions_json' => 'nullable|array',
            'attachment_url' => 'nullable|string|max:255',
        ]);

        $record = $this->cooperativeService->createGovernanceRecord($cooperative, $validated);

        return response()->json($record, 201);
    }

    public function reports(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        return response()->json($this->cooperativeService->getReportSnapshot($cooperative));
    }

    public function settings(Request $request)
    {
        $cooperative = $this->resolveCooperative($request->user()->current_business_id);

        return response()->json([
            'cooperative' => $cooperative->load(['subscriptionPlan', 'loanSettings', 'brandingSettings', 'wallets']),
        ]);
    }

    private function resolveCooperative(int $businessId): Cooperative
    {
        return Cooperative::where('business_id', $businessId)->firstOrFail();
    }

    private function authorizeFinancing(CooperativeFinancing $financing): void
    {
        $this->authorize('update', $financing);
    }

}
