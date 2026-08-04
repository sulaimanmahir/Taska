<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class BusinessTeamService
{
    public function __construct(
        private BusinessContextService $businessContextService,
        private BusinessProvisioningService $businessProvisioningService,
    ) {
    }

    public function getTeamContext(User $actor): array
    {
        $business = $this->resolveCurrentBusiness($actor);
        $roles = $this->loadRoles($business);
        $members = $this->loadMembers($business, $actor, $roles);
        $branches = $this->loadBranches($business, $members);

        return [
            'business' => [
                'id' => $business->id,
                'name' => $business->name,
                'business_type' => $business->business_type,
                'business_type_label' => config("business_types.types.{$business->business_type}.name", str($business->business_type)->headline()->toString()),
            ],
            'summary' => [
                'member_count' => $members->count(),
                'active_member_count' => $members->where('status', 'active')->count(),
                'suspended_member_count' => $members->where('status', 'suspended')->count(),
                'branch_coverage_count' => $branches->where('active_member_count', '>', 0)->count(),
            ],
            'roles' => $roles->values()->all(),
            'branches' => $branches->values()->all(),
            'members' => $members->values()->all(),
        ];
    }

    public function addMember(User $actor, array $payload): array
    {
        $business = $this->resolveCurrentBusiness($actor);
        $role = $this->resolveRole($business, $payload['role_slug']);
        $branch = $this->resolveBranch($business, (int) $payload['branch_id']);
        $existingUser = User::where('email', $payload['email'])->first();

        if ($existingUser && $this->hasMembership($business, $existingUser)) {
            throw ValidationException::withMessages([
                'email' => ['That user already belongs to this workspace.'],
            ]);
        }

        $this->businessProvisioningService->syncRolePermissions($role);

        $createdNewUser = false;

        DB::transaction(function () use ($actor, $business, $role, $branch, $payload, $existingUser, &$createdNewUser) {
            $user = $existingUser;

            if (!$user) {
                $createdNewUser = true;
                $user = User::create([
                    'name' => $payload['name'],
                    'email' => $payload['email'],
                    'phone' => $payload['phone'] ?: null,
                    'password' => Hash::make($payload['password']),
                    'role' => $role->slug,
                ]);
            }

            $this->businessProvisioningService->attachUserToBusiness($user, $business, $role, $branch, $actor->id);

            if (!$user->current_business_id) {
                $user->forceFill([
                    'current_business_id' => $business->id,
                    'current_branch_id' => $branch->id,
                    'role' => $role->slug,
                ])->save();
            } elseif ((int) $user->current_business_id === (int) $business->id) {
                $user->forceFill([
                    'current_branch_id' => $branch->id,
                    'role' => $role->slug,
                ])->save();
            }
        });

        return [
            'message' => $createdNewUser
                ? 'New workspace member created successfully.'
                : 'Existing Taska user added to this workspace successfully.',
            'created_new_user' => $createdNewUser,
            ...$this->getTeamContext($actor),
        ];
    }

    public function updateMember(User $actor, User $member, array $payload): array
    {
        $business = $this->resolveCurrentBusiness($actor);
        $membership = $this->getMembership($business, $member);

        if (!$membership) {
            abort(404, 'Workspace member not found.');
        }

        $role = $this->resolveRole($business, $payload['role_slug']);
        $branch = $this->resolveBranch($business, (int) $payload['branch_id']);
        $status = $payload['status'];
        $isSelf = (int) $member->id === (int) $actor->id;

        if (
            $isSelf
            && (
                $membership->role_slug !== $role->slug
                || $this->normalizeStatus($membership->status) !== $status
            )
        ) {
            throw ValidationException::withMessages([
                'member' => ['Use another active admin account to change your own role or workspace status.'],
            ]);
        }

        if ($this->wouldRemoveLastActiveAdmin($business, $membership, $role->slug, $status)) {
            throw ValidationException::withMessages([
                'member' => ['This workspace must keep at least one active business owner.'],
            ]);
        }

        $this->businessProvisioningService->syncRolePermissions($role);

        DB::transaction(function () use ($business, $member, $membership, $role, $branch, $status) {
            DB::table('business_user')
                ->where('business_id', $business->id)
                ->where('user_id', $member->id)
                ->update([
                    'role_id' => $role->id,
                    'branch_id' => $branch->id,
                    'status' => $status,
                ]);

            DB::table('role_user')
                ->where('business_id', $business->id)
                ->where('user_id', $member->id)
                ->delete();

            DB::table('role_user')->insert([
                'role_id' => $role->id,
                'user_id' => $member->id,
                'business_id' => $business->id,
                'assigned_by' => $membership->created_by,
                'assigned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ((int) $member->current_business_id === (int) $business->id) {
                if ($status === 'suspended') {
                    $member->forceFill([
                        'current_business_id' => null,
                        'current_branch_id' => null,
                    ])->save();
                    return;
                }

                $member->forceFill([
                    'current_branch_id' => $branch->id,
                    'role' => $role->slug,
                ])->save();
            }
        });

        return [
            'message' => 'Workspace member access updated successfully.',
            ...$this->getTeamContext($actor),
        ];
    }

    private function resolveCurrentBusiness(User $user): Business
    {
        if (!$user->current_business_id) {
            abort(404, 'No active business selected.');
        }

        $business = $this->businessContextService->findAccessibleBusiness($user, $user->current_business_id);

        if (!$business) {
            abort(404, 'Active business not found.');
        }

        return $business;
    }

    private function loadRoles(Business $business): Collection
    {
        $roleOrder = collect(config('business_types.roles', []))
            ->pluck('slug')
            ->flip()
            ->map(fn ($index) => (int) $index);

        return Role::query()
            ->where('business_id', $business->id)
            ->with('permissions:id,module')
            ->get()
            ->map(function (Role $role) use ($roleOrder) {
                $modules = $role->permissions
                    ->pluck('module')
                    ->filter()
                    ->unique()
                    ->sort()
                    ->values();

                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'description' => $role->description,
                    'is_default' => $role->is_default,
                    'permission_modules' => $modules->all(),
                    'permission_count' => $modules->count(),
                    'sort_order' => $roleOrder->get($role->slug, 999),
                ];
            })
            ->sortBy([
                ['sort_order', 'asc'],
                ['name', 'asc'],
            ])
            ->values();
    }

    private function loadMembers(Business $business, User $actor, Collection $roles): Collection
    {
        $rolesById = $roles->keyBy('id');
        $rows = DB::table('business_user')
            ->join('users', 'users.id', '=', 'business_user.user_id')
            ->leftJoin('roles', 'roles.id', '=', 'business_user.role_id')
            ->leftJoin('branches', 'branches.id', '=', 'business_user.branch_id')
            ->where('business_user.business_id', $business->id)
            ->select([
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'users.current_business_id',
                'business_user.role_id',
                'business_user.branch_id',
                'business_user.status',
                'business_user.joined_at',
                'business_user.created_by',
                'roles.name as role_name',
                'roles.slug as role_slug',
                'branches.name as branch_name',
                'branches.is_primary as branch_is_primary',
            ])
            ->get();

        $activeAdminCount = $rows
            ->filter(fn ($row) => $this->normalizeStatus($row->status) === 'active' && $row->role_slug === 'admin')
            ->count();

        return $rows
            ->map(function ($row) use ($actor, $rolesById, $activeAdminCount) {
                $role = $rolesById->get($row->role_id);
                $permissionModules = collect($role['permission_modules'] ?? [])->values()->all();
                $status = $this->normalizeStatus($row->status);
                $isCurrentUser = (int) $row->id === (int) $actor->id;

                return [
                    'id' => (int) $row->id,
                    'name' => $row->name,
                    'email' => $row->email,
                    'phone' => $row->phone,
                    'role_id' => $row->role_id ? (int) $row->role_id : null,
                    'role_name' => $row->role_name ?? str($row->role_slug ?? 'staff')->headline()->toString(),
                    'role_slug' => $row->role_slug ?? 'staff',
                    'branch_id' => $row->branch_id ? (int) $row->branch_id : null,
                    'branch_name' => $row->branch_name,
                    'branch_is_primary' => (bool) $row->branch_is_primary,
                    'status' => $status,
                    'joined_at' => $row->joined_at,
                    'permission_modules' => $permissionModules,
                    'permission_count' => count($permissionModules),
                    'is_current_user' => $isCurrentUser,
                    'is_last_active_admin' => $status === 'active' && $row->role_slug === 'admin' && $activeAdminCount === 1,
                ];
            })
            ->sortBy([
                [fn ($member) => $member['is_current_user'] ? 0 : 1, 'asc'],
                [fn ($member) => $member['status'] === 'active' ? 0 : 1, 'asc'],
                [fn ($member) => $member['role_slug'] === 'admin' ? 0 : 1, 'asc'],
                ['name', 'asc'],
            ])
            ->values();
    }

    private function loadBranches(Business $business, Collection $members): Collection
    {
        $membersByBranch = $members
            ->filter(fn ($member) => !empty($member['branch_id']))
            ->groupBy('branch_id');

        return Branch::query()
            ->where('business_id', $business->id)
            ->orderByDesc('is_primary')
            ->orderBy('name')
            ->get()
            ->map(function (Branch $branch) use ($membersByBranch) {
                $assignedMembers = collect($membersByBranch->get($branch->id, []));

                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'slug' => $branch->slug,
                    'is_primary' => $branch->is_primary,
                    'is_active' => $branch->is_active,
                    'member_count' => $assignedMembers->count(),
                    'active_member_count' => $assignedMembers->where('status', 'active')->count(),
                ];
            })
            ->values();
    }

    private function resolveRole(Business $business, string $roleSlug): Role
    {
        $role = Role::query()
            ->where('business_id', $business->id)
            ->where('slug', $roleSlug)
            ->first();

        if (!$role) {
            abort(404, 'Role not found for this workspace.');
        }

        return $role;
    }

    private function resolveBranch(Business $business, int $branchId): Branch
    {
        $branch = Branch::query()
            ->where('business_id', $business->id)
            ->where('id', $branchId)
            ->first();

        if (!$branch) {
            abort(404, 'Branch not found for this workspace.');
        }

        return $branch;
    }

    private function hasMembership(Business $business, User $user): bool
    {
        return DB::table('business_user')
            ->where('business_id', $business->id)
            ->where('user_id', $user->id)
            ->exists();
    }

    private function getMembership(Business $business, User $user): ?object
    {
        return DB::table('business_user')
            ->leftJoin('roles', 'roles.id', '=', 'business_user.role_id')
            ->where('business_user.business_id', $business->id)
            ->where('business_user.user_id', $user->id)
            ->select([
                'business_user.business_id',
                'business_user.user_id',
                'business_user.role_id',
                'business_user.branch_id',
                'business_user.status',
                'business_user.created_by',
                'roles.slug as role_slug',
            ])
            ->first();
    }

    private function wouldRemoveLastActiveAdmin(Business $business, object $membership, string $nextRoleSlug, string $nextStatus): bool
    {
        $currentRoleSlug = $membership->role_slug ?? 'staff';
        $currentStatus = $this->normalizeStatus($membership->status);

        if ($currentRoleSlug !== 'admin' || $currentStatus !== 'active') {
            return false;
        }

        if ($nextRoleSlug === 'admin' && $nextStatus === 'active') {
            return false;
        }

        $activeAdminCount = DB::table('business_user')
            ->join('roles', 'roles.id', '=', 'business_user.role_id')
            ->where('business_user.business_id', $business->id)
            ->where(function ($query) {
                $query->where('business_user.status', 'active')
                    ->orWhereNull('business_user.status');
            })
            ->where('roles.slug', 'admin')
            ->count();

        return $activeAdminCount <= 1;
    }

    private function normalizeStatus(?string $status): string
    {
        return $status ?: 'active';
    }
}
