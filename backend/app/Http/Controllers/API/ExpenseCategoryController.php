<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expenses\StoreExpenseCategoryRequest;
use App\Http\Requests\Expenses\UpdateExpenseCategoryRequest;
use App\Http\Resources\ExpenseCategoryResource;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = ExpenseCategory::where('business_id', $request->user()->current_business_id)
            ->withCount('expenses')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(StoreExpenseCategoryRequest $request)
    {
        $validated = $request->validated();

        $validated['business_id'] = $request->user()->current_business_id;
        $validated['slug'] = str()->slug($validated['name']);

        $category = ExpenseCategory::create($validated);

        return response()->json(
            (new ExpenseCategoryResource($category))->resolve(),
            201
        );
    }

    public function update(UpdateExpenseCategoryRequest $request, ExpenseCategory $category)
    {
        $this->authorize('update', $category);
        $validated = $request->validated();

        if (isset($validated['name'])) {
            $validated['slug'] = str()->slug($validated['name']);
        }

        $category->update($validated);

        return response()->json(
            (new ExpenseCategoryResource($category->fresh()))->resolve()
        );
    }
}
