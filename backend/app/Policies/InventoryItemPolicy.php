<?php

namespace App\Policies;

use App\Models\InventoryItem;
use App\Models\User;

class InventoryItemPolicy
{
    public function view(User $user, InventoryItem $inventoryItem): bool
    {
        return (int) $user->current_business_id === (int) $inventoryItem->business_id;
    }

    public function update(User $user, InventoryItem $inventoryItem): bool
    {
        return (int) $user->current_business_id === (int) $inventoryItem->business_id;
    }
}
