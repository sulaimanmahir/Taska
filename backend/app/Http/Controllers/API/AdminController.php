<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Business;
use App\Models\BusinessSubscription;
use App\Models\Invoice;
use App\Models\ReferralCommission;
use App\Models\ReferralPayout;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

/**
 * Platform-wide, cross-tenant admin dashboard (gated by is_platform_admin,
 * see EnsurePlatformAdmin). This previously referenced App\Models\Transaction/
 * Subscription/SupportTicket/Referral and a Business::owner() relation, none
 * of which existed anywhere in the codebase - every method here fatal-
 * errored. Rewired to real models: BusinessSubscription/Invoice for
 * billing, ReferralCommission/ReferralPayout for referrals, and a derived
 * Business::owner() (earliest-joined admin-role member, since there's no
 * stored "owner" concept). Support tickets are a genuine gap, not a wiring
 * bug - no ticket model/table exists in this codebase at all, so that
 * endpoint intentionally returns an empty/not-yet-available response
 * rather than pretending data exists (see ROADMAP.md).
 */
class AdminController extends Controller
{
    public function stats(Request $request)
    {
        $totalUsers = User::count();
        $activeBusinesses = Business::where('is_active', true)->count();
        $monthlyRevenue = Invoice::where('status', Invoice::STATUS_PAID)
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('total');
        $pendingPayouts = ReferralPayout::where('status', 'pending')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'totalUsers' => $totalUsers,
                'activeBusinesses' => $activeBusinesses,
                'monthlyRevenue' => $monthlyRevenue,
                'pendingSupport' => 0,
                'pendingPayouts' => $pendingPayouts,
            ]
        ]);
    }

    public function users(Request $request)
    {
        $users = User::with('businesses')
            ->withCount('businesses as business_count')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                $business = $user->businesses->first();
                $subscription = $business
                    ? BusinessSubscription::where('business_id', $business->id)
                        ->whereIn('status', [BusinessSubscription::STATUS_TRIAL, BusinessSubscription::STATUS_ACTIVE])
                        ->with('plan')
                        ->first()
                    : null;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'business_name' => $business->name ?? null,
                    'business_type' => $business->business_type ?? null,
                    'plan' => $subscription?->plan?->slug ?? 'free',
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function businesses(Request $request)
    {
        $businesses = Business::orderBy('created_at', 'desc')
            ->get()
            ->map(function ($business) {
                $owner = $business->owner();

                return [
                    'id' => $business->id,
                    'business_name' => $business->name,
                    'owner_name' => $owner?->name,
                    'owner_email' => $owner?->email,
                    'business_type' => $business->business_type,
                    'is_active' => $business->is_active,
                    'created_at' => $business->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $businesses]);
    }

    public function plans(Request $request)
    {
        $plans = SubscriptionPlan::orderBy('display_order')->get();

        return response()->json(['success' => true, 'data' => $plans]);
    }

    public function transactions(Request $request)
    {
        $transactions = Invoice::with('business')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function (Invoice $invoice) {
                // Billing is scoped to a business, not a user, in this
                // schema - "user_name" (the field the frontend already
                // reads) shows the paying business's owner.
                $owner = $invoice->business?->owner();

                return [
                    'id' => $invoice->id,
                    'user_name' => $owner?->name ?? $invoice->business?->name,
                    'type' => $invoice->type,
                    'amount' => $invoice->total,
                    'status' => $invoice->status,
                    'reference' => $invoice->gateway_reference,
                    'created_at' => $invoice->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $transactions]);
    }

    public function supportTickets(Request $request)
    {
        // No support-ticket model/table exists anywhere in this codebase -
        // this is a real, tracked gap (see ROADMAP.md), not a bug to paper
        // over. Returning an honest empty list rather than fabricating data
        // or fatal-erroring.
        return response()->json(['success' => true, 'data' => []]);
    }

    public function referrals(Request $request)
    {
        $referrals = ReferralCommission::with(['agent', 'referredBusiness'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function (ReferralCommission $commission) {
                $agentName = trim(($commission->agent?->first_name ?? '') . ' ' . ($commission->agent?->last_name ?? ''));

                return [
                    'id' => $commission->id,
                    'referrer_name' => $agentName !== '' ? $agentName : null,
                    'referred_name' => $commission->referredBusiness?->name,
                    'commission' => $commission->amount,
                    'status' => $commission->status,
                    'created_at' => $commission->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $referrals]);
    }

    public function suspendUser(Request $request)
    {
        $request->validate(['id' => 'required|exists:users,id']);

        $user = User::find($request->id);
        $user->is_active = false;
        $user->save();

        return response()->json(['success' => true, 'message' => 'User suspended']);
    }

    public function activateUser(Request $request)
    {
        $request->validate(['id' => 'required|exists:users,id']);

        $user = User::find($request->id);
        $user->is_active = true;
        $user->save();

        return response()->json(['success' => true, 'message' => 'User activated']);
    }

    public function suspendBusiness(Request $request)
    {
        $request->validate(['id' => 'required|exists:businesses,id']);

        $business = Business::find($request->id);
        $business->is_active = false;
        $business->save();

        return response()->json(['success' => true, 'message' => 'Business suspended']);
    }

    public function resolveTicket(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Support tickets are not available yet - no ticket system has been built.',
        ], 501);
    }
}
