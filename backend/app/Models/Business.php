<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Business extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'logo_url',
        'address',
        'city',
        'state',
        'country',
        'business_type',
        'active_business_types',
        'business_category',
        'modules',
        'currency',
        'timezone',
        'is_active',
        'expense_approval_threshold',
        'discount_approval_threshold',
        'require_inventory_adjustment_approval',
    ];

    protected $casts = [
        'modules' => 'array',
        'active_business_types' => 'array',
        'is_active' => 'boolean',
        'expense_approval_threshold' => 'decimal:2',
        'discount_approval_threshold' => 'decimal:2',
        'require_inventory_adjustment_approval' => 'boolean',
    ];

    public function approvalRequests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'business_user')
            ->withPivot('role_id', 'branch_id', 'status', 'created_by', 'joined_at');
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class);
    }

    public function productCategories(): HasMany
    {
        return $this->hasMany(ProductCategory::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function healthSnapshots(): HasMany
    {
        return $this->hasMany(BusinessHealthSnapshot::class);
    }

    public function streaks(): HasMany
    {
        return $this->hasMany(BusinessStreak::class);
    }

    public function achievementUnlocks(): HasMany
    {
        return $this->hasMany(BusinessAchievementUnlock::class);
    }

    public function primaryBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'primary_branch_id');
    }

    public function defaultWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'default_warehouse_id');
    }

    public function isModuleEnabled(string $module): bool
    {
        $modules = $this->modules ?? [];
        return in_array($module, $modules);
    }

    /**
     * Which top-level verticals are active on this business. Falls back to
     * [business_type] for any row that predates the active_business_types
     * column or somehow ended up null - keeps single-vertical behavior the
     * default even if a caller bypasses the backfilled column.
     */
    public function activeBusinessTypes(): array
    {
        $types = $this->active_business_types;

        return !empty($types) ? $types : array_filter([$this->business_type]);
    }

    public function hasActiveBusinessType(string $type): bool
    {
        return in_array($type, $this->activeBusinessTypes(), true);
    }

    /**
     * The business's earliest-joined admin-role member. Derived rather than
     * a stored column since there's no dedicated "owner" concept in the
     * schema - a business is owned by whichever admin-role member joined
     * business_user first, same as how AdminController used to assume a
     * Business::owner() relation existed (it never did).
     */
    public function owner(): ?User
    {
        $adminRoleIds = Role::where('business_id', $this->id)->where('slug', 'admin')->pluck('id');

        if ($adminRoleIds->isEmpty()) {
            return null;
        }

        return $this->users()
            ->wherePivotIn('role_id', $adminRoleIds)
            ->orderBy('business_user.joined_at')
            ->first();
    }

    public function subscription(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(BusinessSubscription::class, 'business_id');
    }

    public function activeSubscription(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(BusinessSubscription::class, 'business_id')
            ->whereIn('status', [
                BusinessSubscription::STATUS_TRIAL,
                BusinessSubscription::STATUS_ACTIVE,
            ]);
    }

    public function invoices(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Invoice::class, 'business_id');
    }

    public function paymentMethods(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PaymentMethod::class, 'business_id');
    }

    public function billingNotifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BillingNotification::class, 'business_id');
    }

    public function autoRenewConsent(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(AutoRenewConsent::class, 'business_id');
    }

    public function referralAgents(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ReferralAgent::class, 'business_id');
    }

    public function referredBusinesses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ReferralTracking::class, 'referred_business_id');
    }
}
