<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccessAuditLogResource;
use App\Models\AccessAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccessAuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AccessAuditLog::query()
            ->with('actor:id,name')
            ->where('business_id', $request->user()->current_business_id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json(AccessAuditLogResource::collection($logs)->resolve());
    }
}
