<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ReferralCode;
use App\Models\ReferralEarning;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LegacyReferralController extends Controller
{
    public function index(Request $request)
    {
        $codes = ReferralCode::where('business_id', $request->user()->current_business_id)
            ->with('referrer')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($codes);
    }

    public function generate(Request $request)
    {
        $businessId = $request->user()->current_business_id;
        $userId = $request->user()->id;

        $code = ReferralCode::create([
            'business_id' => $businessId,
            'referrer_id' => $userId,
            'code' => strtoupper(Str::random(8)),
            'commission_percent' => $request->commission_percent ?? 5,
            'max_uses' => $request->max_uses,
        ]);

        return response()->json($code, 201);
    }

    public function apply(Request $request)
    {
        $code = ReferralCode::where('code', $request->code)
            ->where('is_active', true)
            ->first();

        if (!$code) {
            return response()->json(['message' => 'Invalid referral code'], 404);
        }

        if ($code->max_uses && $code->uses >= $code->max_uses) {
            return response()->json(['message' => 'Referral code usage limit reached'], 400);
        }

        return response()->json($code);
    }

    public function earnings(Request $request)
    {
        $earnings = ReferralEarning::where('business_id', $request->user()->current_business_id)
            ->with('referralCode', 'referredCustomer')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($earnings);
    }
}
