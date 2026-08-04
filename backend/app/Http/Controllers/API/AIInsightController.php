<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\AIInsightResource;
use App\Services\AiService;
use Illuminate\Http\Request;

class AIInsightController extends Controller
{
    public function __construct(
        private AiService $service,
    ) {
    }

    public function index(Request $request)
    {
        $unreadOnly = $request->boolean('unread_only');
        $grouped = $request->boolean('grouped');

        if ($grouped) {
            return response()->json(
                $this->service->getGroupedInsights($request->user()->current_business_id, $unreadOnly)
            );
        }

        return response()->json(
            AIInsightResource::collection(
                $this->service->getInsights($request->user()->current_business_id, $unreadOnly)
            )->resolve()
        );
    }

    public function markRead(Request $request, int $id)
    {
        return response()->json(
            (new AIInsightResource(
                $this->service->markAsRead($request->user()->current_business_id, $id)
            ))->resolve()
        );
    }

    public function dismiss(Request $request, int $id)
    {
        return response()->json(
            (new AIInsightResource(
                $this->service->dismiss($request->user()->current_business_id, $id)
            ))->resolve()
        );
    }

    public function restore(Request $request, int $id)
    {
        return response()->json(
            (new AIInsightResource(
                $this->service->restore($request->user()->current_business_id, $id)
            ))->resolve()
        );
    }
}
