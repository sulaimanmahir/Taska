<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\BusinessContextService;
use App\Services\BusinessTeamService;
use Illuminate\Http\Request;

class TeamInviteController extends Controller
{
    public function __construct(
        private BusinessTeamService $businessTeamService,
        private BusinessContextService $businessContextService,
    ) {
    }

    public function show(string $token)
    {
        return response()->json($this->businessTeamService->getInviteContext($token));
    }

    public function accept(Request $request)
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ]);

        $result = $this->businessTeamService->acceptInvite($validated['token'], $validated['password']);
        $user = $result['user'];

        $token = $user->createToken('auth-token')->plainTextToken;
        $businessSummaries = $this->businessContextService->summarizeBusinessesForUser($user);
        $currentBusiness = $this->businessContextService->findAccessibleBusiness($user, $user->current_business_id);
        $currentBusinessSummary = $this->businessContextService->summarizeCurrentBusiness($currentBusiness, $businessSummaries);
        $permissions = $currentBusiness ? $user->getAllPermissions($currentBusiness->id) : [];

        return response()->json([
            'message' => 'Invite accepted. You are now a member of '.$result['business']->name.'.',
            'user' => $user,
            'businesses' => $businessSummaries,
            'current_business' => $currentBusinessSummary,
            'permissions' => $permissions,
            'requires_business_selection' => $businessSummaries->count() > 1,
            'needs_business_onboarding' => false,
            'token' => $token,
        ]);
    }
}
