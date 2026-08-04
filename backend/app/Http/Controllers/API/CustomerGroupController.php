<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customers\StoreCustomerGroupRequest;
use App\Http\Requests\Customers\UpdateCustomerGroupRequest;
use App\Http\Resources\CustomerGroupResource;
use App\Models\CustomerGroup;
use Illuminate\Http\Request;

class CustomerGroupController extends Controller
{
    public function index(Request $request)
    {
        $groups = CustomerGroup::where('business_id', $request->user()->current_business_id)
            ->withCount('customers')
            ->orderBy('name')
            ->get();

        return response()->json($groups);
    }

    public function store(StoreCustomerGroupRequest $request)
    {
        $validated = $request->validated();
        $validated['business_id'] = $request->user()->current_business_id;
        $validated['slug'] = str()->slug($validated['name']);

        $group = CustomerGroup::create($validated);

        return response()->json(
            (new CustomerGroupResource($group))->resolve(),
            201
        );
    }

    public function update(UpdateCustomerGroupRequest $request, CustomerGroup $group)
    {
        $this->authorize('update', $group);
        $validated = $request->validated();

        if (isset($validated['name'])) {
            $validated['slug'] = str()->slug($validated['name']);
        }

        $group->update($validated);

        return response()->json(
            (new CustomerGroupResource($group->fresh()))->resolve()
        );
    }

    public function destroy(CustomerGroup $group)
    {
        $this->authorize('delete', $group);
        $group->delete();

        return response()->json(['message' => 'Group deleted']);
    }
}
