<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user || (!$user->hasRole($role) && $user->role !== $role)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized for this role.'
            ], 403);
        }

        return $next($request);
    }
}
