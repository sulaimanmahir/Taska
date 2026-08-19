<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Beauty\CompleteBeautyAppointmentRequest;
use App\Http\Resources\BeautyAppointmentResource;
use App\Models\BeautyAppointment;
use App\Services\BeautyService;
use Illuminate\Http\Request;

class BeautyController extends Controller
{
    use ValidatesBusinessOwnership;

    public function __construct(
        private BeautyService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
    }

    public function storeService(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'duration_minutes' => 'nullable|integer|min:5',
            'price' => 'required|numeric|min:0',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json($this->service->storeService($validated, $request->user()), 201);
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

    public function storeAppointment(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'customer_id' => ['nullable', $this->businessOwnedRule('customers', $businessId)],
            'service_id' => ['required', $this->businessOwnedRule('beauty_services', $businessId)],
            'staff_profile_id' => ['nullable', $this->businessOwnedRule('beauty_staff_profiles', $businessId)],
            'appointment_at' => 'required|date',
            'status' => 'nullable|in:scheduled,in_service,completed,cancelled,no_show',
            'service_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        return response()->json($this->service->storeAppointment($validated, $request->user()), 201);
    }

    public function completeAppointment(CompleteBeautyAppointmentRequest $request, BeautyAppointment $appointment)
    {
        $this->authorize('update', $appointment);

        return (new BeautyAppointmentResource(
            $this->service->completeAppointment($appointment, $request->validated())
        ))->resolve();
    }
}
