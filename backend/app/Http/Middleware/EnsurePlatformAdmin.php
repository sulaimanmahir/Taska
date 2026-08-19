<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the platform-wide /api/admin/* routes (cross-tenant user/business
 * data, suspend/activate actions). Deliberately separate from the
 * tenant-scoped `role:admin` check (CheckRole), which only proves the user
 * is an admin of their own business - every self-registered business owner
 * passes that check by default.
 */
class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_platform_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized for this role.',
            ], 403);
        }

        return $next($request);
    }
}
