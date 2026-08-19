<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBusinessTeamMemberRequest;
use App\Http\Requests\UpdateBusinessTeamMemberRequest;
use App\Models\User;
use App\Services\BusinessTeamService;
use Illuminate\Http\Request;

class BusinessTeamController extends Controller
{
    public function __construct(
        private BusinessTeamService $businessTeamService,
    ) {
    }

    public function index(Request $request)
    {
        return response()->json($this->businessTeamService->getTeamContext($request->user()));
    }

    public function store(StoreBusinessTeamMemberRequest $request)
    {
        return response()->json(
            $this->businessTeamService->addMember($request->user(), $request->validated()),
            201
        );
    }

    public function update(UpdateBusinessTeamMemberRequest $request, User $member)
    {
        return response()->json(
            $this->businessTeamService->updateMember($request->user(), $member, $request->validated())
        );
    }

    public function resendInvite(Request $request, User $member)
    {
        return response()->json(
            $this->businessTeamService->resendInvite($request->user(), $member)
        );
    }
}
