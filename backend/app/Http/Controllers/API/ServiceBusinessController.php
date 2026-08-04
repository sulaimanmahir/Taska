<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceBusiness\UpdateServiceJobRequest;
use App\Http\Resources\ServiceJobResource;
use App\Models\ServiceJob;
use App\Services\ServiceBusinessService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class ServiceBusinessController extends Controller
{
    public function __construct(
        private ServiceBusinessService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
    }

    public function storeOffering(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'duration_minutes' => 'nullable|integer|min:5',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json($this->service->storeOffering($validated, $request->user()), 201);
    }

    public function storeStaff(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'user_id' => ['nullable', $this->activeBusinessUserRule($businessId)],
            'name' => 'required|string|max:255',
            'specialty' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json($this->service->storeStaff($validated, $request->user()), 201);
    }

    public function storeBooking(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'customer_id' => ['nullable', $this->businessOwnedRule('customers', $businessId)],
            'offering_id' => ['required', $this->businessOwnedRule('service_offerings', $businessId)],
            'scheduled_for' => 'required|date',
            'status' => 'nullable|in:scheduled,confirmed,converted,cancelled,no_show',
            'referral_source' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        return response()->json($this->service->storeBooking($validated, $request->user()), 201);
    }

    public function storeJob(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'booking_id' => ['nullable', $this->businessOwnedRule('service_bookings', $businessId)],
            'customer_id' => ['nullable', $this->businessOwnedRule('customers', $businessId)],
            'offering_id' => ['required', $this->businessOwnedRule('service_offerings', $businessId)],
            'staff_profile_id' => ['nullable', $this->businessOwnedRule('service_staff_profiles', $businessId)],
            'status' => 'nullable|in:open,in_progress,completed,cancelled',
            'quoted_amount' => 'nullable|numeric|min:0',
            'invoice_amount' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        return response()->json($this->service->storeJob($validated, $request->user()), 201);
    }

    public function updateJob(UpdateServiceJobRequest $request, ServiceJob $job)
    {
        $this->authorize('update', $job);

        return new ServiceJobResource(
            $this->service->updateJob($job, $request->validated())
        );
    }

    private function businessOwnedRule(string $table, int $businessId): Exists
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }

    private function activeBusinessUserRule(int $businessId): Exists
    {
        return Rule::exists('users', 'id')->where(function ($query) use ($businessId) {
            $query->whereExists(function ($membershipQuery) use ($businessId) {
                $membershipQuery
                    ->selectRaw('1')
                    ->from('business_user')
                    ->whereColumn('business_user.user_id', 'users.id')
                    ->where('business_user.business_id', $businessId)
                    ->where('business_user.status', 'active');
            });
        });
    }
}
