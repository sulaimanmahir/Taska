<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Suppliers\StoreSupplierRequest;
use App\Http\Requests\Suppliers\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::where('business_id', $request->user()->current_business_id);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        $suppliers = $query->orderBy('name')->paginate(20);

        return response()->json($suppliers);
    }

    public function store(StoreSupplierRequest $request)
    {
        $validated = $request->validated();

        $validated['business_id'] = $request->user()->current_business_id;

        $supplier = Supplier::create($validated);

        return response()->json(
            (new SupplierResource($supplier))->resolve(),
            201
        );
    }

    public function show(Supplier $supplier)
    {
        $this->authorize('view', $supplier);
        
        return response()->json(
            (new SupplierResource($supplier->load('purchases')))->resolve()
        );
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        $this->authorize('update', $supplier);
        $validated = $request->validated();

        $supplier->update($validated);

        return response()->json(
            (new SupplierResource($supplier->fresh()))->resolve()
        );
    }

    public function destroy(Supplier $supplier)
    {
        $this->authorize('delete', $supplier);
        $supplier->delete();

        return response()->json(['message' => 'Supplier deleted']);
    }
}
