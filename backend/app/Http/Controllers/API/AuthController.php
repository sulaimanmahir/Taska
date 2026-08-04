<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterOwnerRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\StoreBusinessRequest;
use App\Http\Requests\Auth\SwitchBusinessRequest;
use App\Http\Requests\UpdateBusinessSettingsRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Business;
use App\Models\User;
use App\Services\AccountSettingsService;
use App\Services\BusinessContextService;
use App\Services\BusinessProvisioningService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private AccountSettingsService $accountSettingsService,
        private BusinessProvisioningService $businessProvisioningService,
        private BusinessContextService $businessContextService,
    ) {
    }

    public function register(RegisterOwnerRequest $request)
    {
        $result = $this->businessProvisioningService->registerOwnerWithBusiness($request->validated());
        $summaries = $this->businessContextService->summarizeBusinessesForUser($result['user']);
        $currentBusiness = $this->businessContextService->summarizeCurrentBusiness($result['business'], $summaries);
        $permissions = $result['user']->fresh()->getAllPermissions($result['business']->id);

        return response()->json([
            'user' => $result['user'],
            'business' => $currentBusiness,
            'businesses' => $summaries,
            'current_business' => $currentBusiness,
            'permissions' => $permissions,
            'requires_business_selection' => false,
            'needs_business_onboarding' => false,
            'token' => $result['token'],
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Get user's businesses
        $businessSummaries = $this->businessContextService->summarizeBusinessesForUser($user);
        $currentBusinessId = $user->current_business_id;
        $currentBusiness = $currentBusinessId
            ? $this->businessContextService->findAccessibleBusiness($user, $currentBusinessId)
            : null;

        if (!$currentBusiness && $businessSummaries->count() === 1) {
            $currentBusiness = $this->businessContextService->findAccessibleBusiness($user, $businessSummaries->first()['id']);
        }

        if (!$user->current_business_id && $currentBusiness) {
            $user->current_business_id = $currentBusiness->id;
            $user->current_branch_id = $this->businessContextService->resolveAssignedBranchForBusiness($currentBusiness)?->id;
            $user->save();
        }

        $token = $user->createToken('auth-token')->plainTextToken;
        $currentBusinessSummary = $this->businessContextService->summarizeCurrentBusiness($currentBusiness, $businessSummaries);
        $requiresBusinessSelection = $businessSummaries->count() > 1;
        $needsBusinessOnboarding = $businessSummaries->isEmpty();
        $permissions = $currentBusiness
            ? $user->getAllPermissions($currentBusiness->id)
            : [];

        return response()->json([
            'user' => $user,
            'businesses' => $businessSummaries,
            'current_business' => $currentBusinessSummary,
            'permissions' => $permissions,
            'requires_business_selection' => $requiresBusinessSelection,
            'needs_business_onboarding' => $needsBusinessOnboarding,
            'token' => $token,
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        Password::sendResetLink($request->validated());

        return response()->json([
            'message' => 'If an account exists for that email, Taska has sent a password reset link.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            $request->validated(),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json([
            'message' => 'Password reset successfully. You can now sign in with your new password.',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function profile(Request $request)
    {
        return response()->json($this->buildAuthenticatedContextPayload($request->user()));
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $this->accountSettingsService->updateProfile($request->user(), $request->validated());

        return response()->json([
            'message' => 'Profile updated successfully',
            ...$this->buildAuthenticatedContextPayload($user),
        ]);
    }

    public function updateCurrentBusiness(UpdateBusinessSettingsRequest $request)
    {
        $business = $this->accountSettingsService->updateCurrentBusiness($request->user(), $request->validated());

        if (!$business) {
            return response()->json(['message' => 'No active business selected'], 404);
        }

        return response()->json([
            'message' => 'Business settings updated successfully',
            ...$this->buildAuthenticatedContextPayload($request->user(), $business),
        ]);
    }

    public function switchBusiness(SwitchBusinessRequest $request)
    {
        $user = $request->user();
        $business = $this->businessContextService->findAccessibleBusiness($user, (int) $request->validated('business_id'));

        if (!$business) {
            return response()->json(['message' => 'Business not found'], 404);
        }

        $user->current_business_id = $business->id;
        $user->current_branch_id = $this->businessContextService->resolveAssignedBranchForBusiness($business)?->id;
        $user->save();

        $businessSummaries = $this->businessContextService->summarizeBusinessesForUser($user->fresh());
        $currentBusinessSummary = $this->businessContextService->summarizeCurrentBusiness($business, $businessSummaries);
        $permissions = $user->getAllPermissions($business->id);

        return response()->json([
            'business' => $currentBusinessSummary,
            'businesses' => $businessSummaries,
            'permissions' => $permissions,
            'active_role' => $currentBusinessSummary['role_slug'] ?? $user->role,
        ]);
    }

    public function createBusiness(StoreBusinessRequest $request)
    {
        $payload = array_merge($request->validated(), [
            'role' => 'admin',
            'created_by' => $request->user()->id,
        ]);

        $result = $this->businessProvisioningService->createBusinessForUser($request->user(), $payload);
        $user = $request->user()->fresh();
        $businessSummaries = $this->businessContextService->summarizeBusinessesForUser($user);
        $currentBusinessSummary = $this->businessContextService->summarizeCurrentBusiness($result['business'], $businessSummaries);
        $permissions = $user->getAllPermissions($result['business']->id);

        return response()->json([
            'message' => 'Business created successfully',
            'user' => $user,
            'business' => $currentBusinessSummary,
            'businesses' => $businessSummaries,
            'current_business' => $currentBusinessSummary,
            'permissions' => $permissions,
            'requires_business_selection' => false,
            'needs_business_onboarding' => false,
        ], 201);
    }

    private function buildAuthenticatedContextPayload(User $user, ?Business $currentBusiness = null): array
    {
        $user = $user->fresh();
        $businessSummaries = $this->businessContextService->summarizeBusinessesForUser($user);

        if (!$currentBusiness && $user->current_business_id) {
            $currentBusiness = $this->businessContextService->findAccessibleBusiness($user, $user->current_business_id);
        }

        $currentBusinessSummary = $this->businessContextService->summarizeCurrentBusiness($currentBusiness, $businessSummaries);
        $permissions = $currentBusiness?->id
            ? $user->getAllPermissions($currentBusiness->id)
            : [];

        return [
            'user' => $user,
            'businesses' => $businessSummaries,
            'current_business' => $currentBusinessSummary,
            'permissions' => $permissions,
            'requires_business_selection' => false,
            'needs_business_onboarding' => $businessSummaries->isEmpty(),
        ];
    }
}
