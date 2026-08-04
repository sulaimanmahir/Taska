<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\StoreStaffRequest;
use App\Http\Requests\Staff\UpdateStaffRequest;
use App\Http\Resources\StaffResource;
use App\Models\Staff;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $query = Staff::where('business_id', $request->user()->current_business_id)
            ->with('branch');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $staff = $query->orderBy('name')->paginate(20);
        return response()->json($staff);
    }

    public function store(StoreStaffRequest $request)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $validated['business_id'] = $businessId;
        $validated['branch_id'] = $validated['branch_id'] ?? $request->user()->current_branch_id;

        $staff = Staff::create($validated);
        return response()->json(
            (new StaffResource($staff->load('branch')))->resolve(),
            201
        );
    }

    public function show(Staff $staff)
    {
        $this->authorize('view', $staff);
        return response()->json(
            (new StaffResource($staff->load('branch')))->resolve()
        );
    }

    public function update(UpdateStaffRequest $request, Staff $staff)
    {
        $this->authorize('update', $staff);
        $validated = $request->validated();

        $staff->update($validated);
        return response()->json(
            (new StaffResource($staff->fresh()->load('branch')))->resolve()
        );
    }
}
