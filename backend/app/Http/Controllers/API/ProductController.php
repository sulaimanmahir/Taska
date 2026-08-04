<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductCategoryRequest;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductCategoryRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Resources\ProductCategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::where('business_id', $request->user()->current_business_id)->with(['category', 'inventoryItems']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")->orWhere('sku', 'like', "%{$request->search}%");
            });
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->boolean('low_stock')) {
            $query->whereExists(function ($subQuery) {
                $subQuery->selectRaw('1')
                    ->from('inventory_items')
                    ->whereColumn('inventory_items.product_id', 'products.id')
                    ->whereColumn('inventory_items.quantity', '<=', 'inventory_items.reorder_point')
                    ->whereColumn('inventory_items.business_id', 'products.business_id');
            });
        }

        $products = $query->orderBy('name')->paginate(20);

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $validated['business_id'] = $businessId;
        $validated['track_inventory'] = $validated['track_inventory'] ?? 'yes';
        $validated['product_type'] = $validated['product_type'] ?? 'good';

        $product = Product::create($validated);
        return response()->json(
            (new ProductResource($product->load('category')))->resolve(),
            201
        );
    }

    public function show(Product $product)
    {
        $this->authorize('view', $product);
        return response()->json(
            (new ProductResource($product->load('category', 'variants')))->resolve()
        );
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $this->authorize('update', $product);
        $validated = $request->validated();

        $product->update($validated);
        return response()->json(
            (new ProductResource($product->fresh()->load('category')))->resolve()
        );
    }
}
