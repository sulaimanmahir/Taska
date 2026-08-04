<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;
use App\Models\Branch;
use App\Services\BusinessBranchService;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function __construct(
        private BusinessBranchService $businessBranchService,
    ) {
    }

    public function index(Request $request)
    {
        return response()->json($this->businessBranchService->getBranchContext($request->user()));
    }

    public function store(StoreBranchRequest $request)
    {
        return response()->json(
            $this->businessBranchService->createBranch($request->user(), $request->validated()),
            201
        );
    }

    public function update(UpdateBranchRequest $request, Branch $branch)
    {
        return response()->json(
            $this->businessBranchService->updateBranch($request->user(), $branch, $request->validated())
        );
    }
}
