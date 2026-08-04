<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar_url',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function businesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'business_user')
            ->withPivot('role_id', 'branch_id', 'status', 'created_by', 'joined_at');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user')
            ->withPivot('business_id', 'assigned_by', 'assigned_at', 'expires_at')
            ->withTimestamps();
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_user')
            ->withPivot('business_id');
    }

    public function currentBusiness(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'current_business_id');
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'current_business_id');
    }

    public function currentBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'current_branch_id');
    }

    public function hasRole(string $slug, ?int $businessId = null): bool
    {
        $businessId = $businessId ?? $this->current_business_id;
        
        return $this->roles()
            ->where('roles.slug', $slug)
            ->wherePivot('business_id', $businessId)
            ->exists();
    }

    public function hasPermission(string $permission, ?int $businessId = null): bool
    {
        $businessId = $businessId ?? $this->current_business_id;
        
        $roleIds = $this->roles()
            ->wherePivot('business_id', $businessId)
            ->pluck('roles.id');

        return Permission::where('slug', $permission)
            ->whereHas('roles', fn($q) => $q->whereIn('roles.id', $roleIds))
            ->exists();
    }

    public function assignRole(Role $role, ?int $businessId = null, ?int $assignedBy = null): void
    {
        $businessId = $businessId ?? $this->current_business_id;
        
        $this->roles()->attach($role->id, [
            'business_id' => $businessId,
            'assigned_by' => $assignedBy,
            'assigned_at' => now(),
        ]);
    }

    public function getAllPermissions(?int $businessId = null): array
    {
        $businessId = $businessId ?? $this->current_business_id;
        
        $roleIds = $this->roles()
            ->wherePivot('business_id', $businessId)
            ->pluck('roles.id');

        return Permission::whereHas('roles', fn($q) => $q->whereIn('roles.id', $roleIds))
            ->pluck('slug')
            ->toArray();
    }
}
