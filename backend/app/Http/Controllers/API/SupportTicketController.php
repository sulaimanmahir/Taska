<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;

/**
 * Tenant-side half of the support-ticket loop - a business files a ticket
 * here, a platform admin reviews/resolves it via AdminController::
 * supportTickets()/resolveTicket(). SupportTicket isn't BelongsToBusiness-
 * scoped (see its migration's docblock), so every query here scopes
 * manually, the same way Invoice/ReferralCommission already do for the
 * admin side.
 */
class SupportTicketController extends Controller
{
    public function index(Request $request)
    {
        $tickets = SupportTicket::where('business_id', $request->user()->current_business_id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $tickets]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $ticket = SupportTicket::create([
            'business_id' => $request->user()->current_business_id,
            'created_by' => $request->user()->id,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'status' => SupportTicket::STATUS_OPEN,
        ]);

        return response()->json(['success' => true, 'data' => $ticket], 201);
    }
}
