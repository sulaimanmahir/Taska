<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductCategoryRequest;
use App\Http\Requests\Products\UpdateProductCategoryRequest;
use App\Http\Resources\ProductCategoryResource;
use App\Models\ProductCategory;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = ProductCategory::where('business_id', $request->user()->current_business_id)
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(StoreProductCategoryRequest $request)
    {
        $validated = $request->validated();
        $validated['business_id'] = $request->user()->current_business_id;
        $validated['slug'] = str()->slug($validated['name']);

        $category = ProductCategory::create($validated);

        return response()->json(
            (new ProductCategoryResource($category))->resolve(),
            201
        );
    }

    public function update(UpdateProductCategoryRequest $request, ProductCategory $category)
    {
        $this->authorize('update', $category);
        $validated = $request->validated();

        if (isset($validated['name'])) {
            $validated['slug'] = str()->slug($validated['name']);
        }

        $category->update($validated);

        return response()->json(
            (new ProductCategoryResource($category->fresh()))->resolve()
        );
    }
}
