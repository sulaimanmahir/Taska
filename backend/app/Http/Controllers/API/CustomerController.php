<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customers\StoreCustomerGroupRequest;
use App\Http\Requests\Customers\StoreCustomerRequest;
use App\Http\Requests\Customers\UpdateCustomerGroupRequest;
use App\Http\Requests\Customers\UpdateCustomerRequest;
use App\Http\Resources\CustomerGroupResource;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Models\CustomerGroup;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::where('business_id', $request->user()->current_business_id)
            ->with('group');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        if ($request->group_id) {
            $query->where('customer_group_id', $request->group_id);
        }

        $customers = $query->orderBy('name')->paginate(20);

        return response()->json($customers);
    }

    public function store(StoreCustomerRequest $request)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $validated['business_id'] = $businessId;
        $validated['branch_id'] = $request->user()->current_branch_id;

        $customer = Customer::create($validated);

        return response()->json(
            (new CustomerResource($customer->load('group')))->resolve(),
            201
        );
    }

    public function show(Customer $customer)
    {
        $this->authorize('view', $customer);
        
        return response()->json(
            (new CustomerResource($customer->load('group', 'orders')))->resolve()
        );
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        $this->authorize('update', $customer);
        $validated = $request->validated();

        $customer->update($validated);

        return response()->json(
            (new CustomerResource($customer->fresh()->load('group')))->resolve()
        );
    }

    public function destroy(Customer $customer)
    {
        $this->authorize('delete', $customer);
        $customer->delete();

        return response()->json(['message' => 'Customer deleted']);
    }
}
