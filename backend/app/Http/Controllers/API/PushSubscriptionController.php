<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePushSubscriptionRequest;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function publicKey(): JsonResponse
    {
        return response()->json([
            'public_key' => config('services.vapid.public_key'),
            'configured' => filled(config('services.vapid.public_key')),
        ]);
    }

    public function store(StorePushSubscriptionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $endpointHash = PushSubscription::hashEndpoint($validated['endpoint']);

        PushSubscription::updateOrCreate(
            ['endpoint_hash' => $endpointHash],
            [
                'business_id' => $request->user()->current_business_id,
                'user_id' => $request->user()->id,
                'endpoint' => $validated['endpoint'],
                'p256dh_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
            ],
        );

        return response()->json(['message' => 'Push subscription saved.'], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['endpoint' => ['required', 'string']]);

        PushSubscription::where('business_id', $request->user()->current_business_id)
            ->where('user_id', $request->user()->id)
            ->where('endpoint_hash', PushSubscription::hashEndpoint($request->input('endpoint')))
            ->delete();

        return response()->json(['message' => 'Push subscription removed.']);
    }
}
