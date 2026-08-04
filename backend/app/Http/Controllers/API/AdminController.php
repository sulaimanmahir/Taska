<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Business;
use App\Models\Subscription;
use App\Models\Transaction;
use App\Models\SupportTicket;
use App\Models\Referral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function stats(Request $request)
    {
        $totalUsers = User::count();
        $activeBusinesses = Business::where('is_active', true)->count();
        $monthlyRevenue = Transaction::where('status', 'success')
            ->whereMonth('created_at', now()->month)
            ->sum('amount');
        $pendingSupport = SupportTicket::where('status', 'open')->count();
        $pendingPayouts = DB::table('partner_payouts')->where('status', 'pending')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'totalUsers' => $totalUsers,
                'activeBusinesses' => $activeBusinesses,
                'monthlyRevenue' => $monthlyRevenue,
                'pendingSupport' => $pendingSupport,
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
                $subscription = Subscription::where('user_id', $user->id)
                    ->where('status', 'active')
                    ->first();
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'business_name' => $user->businesses->first()->name ?? null,
                    'business_type' => $user->businesses->first()->business_type ?? null,
                    'plan' => $subscription?->plan?->slug ?? 'free',
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function businesses(Request $request)
    {
        $businesses = Business::with('owner')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($business) {
                return [
                    'id' => $business->id,
                    'business_name' => $business->name,
                    'owner_name' => $business->owner->name ?? null,
                    'owner_email' => $business->owner->email ?? null,
                    'business_type' => $business->business_type,
                    'is_active' => $business->is_active,
                    'created_at' => $business->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $businesses]);
    }

    public function plans(Request $request)
    {
        $plans = DB::table('plans')->get();

        return response()->json(['success' => true, 'data' => $plans]);
    }

    public function transactions(Request $request)
    {
        $transactions = Transaction::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'user_name' => $tx->user->name ?? null,
                    'type' => $tx->type,
                    'amount' => $tx->amount,
                    'status' => $tx->status,
                    'reference' => $tx->reference,
                    'created_at' => $tx->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $transactions]);
    }

    public function supportTickets(Request $request)
    {
        $tickets = SupportTicket::with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'user_name' => $ticket->user->name ?? null,
                    'subject' => $ticket->subject,
                    'description' => $ticket->description,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'created_at' => $ticket->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $tickets]);
    }

    public function referrals(Request $request)
    {
        $referrals = Referral::with(['referrer', 'referred'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($referral) {
                return [
                    'id' => $referral->id,
                    'referrer_name' => $referral->referrer->name ?? null,
                    'referred_name' => $referral->referred->name ?? null,
                    'commission' => $referral->commission,
                    'status' => $referral->status,
                    'created_at' => $referral->created_at,
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
        $request->validate(['id' => 'required|exists:support_tickets,id']);

        $ticket = SupportTicket::find($request->id);
        $ticket->status = 'resolved';
        $ticket->save();

        return response()->json(['success' => true, 'message' => 'Ticket resolved']);
    }
}