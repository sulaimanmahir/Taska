<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'module' => 'dashboard'],
            ['name' => 'View Branches', 'slug' => 'branches.view', 'module' => 'branches'],
            ['name' => 'Create Branches', 'slug' => 'branches.create', 'module' => 'branches'],
            ['name' => 'Edit Branches', 'slug' => 'branches.edit', 'module' => 'branches'],
            ['name' => 'View Warehouses', 'slug' => 'warehouses.view', 'module' => 'warehouses'],
            ['name' => 'Create Warehouses', 'slug' => 'warehouses.create', 'module' => 'warehouses'],
            ['name' => 'Edit Warehouses', 'slug' => 'warehouses.edit', 'module' => 'warehouses'],
            ['name' => 'View Products', 'slug' => 'products.view', 'module' => 'products'],
            ['name' => 'Create Products', 'slug' => 'products.create', 'module' => 'products'],
            ['name' => 'Edit Products', 'slug' => 'products.edit', 'module' => 'products'],
            ['name' => 'Delete Products', 'slug' => 'products.delete', 'module' => 'products'],
            ['name' => 'View Categories', 'slug' => 'categories.view', 'module' => 'products'],
            ['name' => 'Create Categories', 'slug' => 'categories.create', 'module' => 'products'],
            ['name' => 'Edit Categories', 'slug' => 'categories.edit', 'module' => 'products'],
            ['name' => 'View Inventory', 'slug' => 'inventory.view', 'module' => 'inventory'],
            ['name' => 'Manage Inventory', 'slug' => 'inventory.manage', 'module' => 'inventory'],
            ['name' => 'View Sales', 'slug' => 'sales.view', 'module' => 'sales'],
            ['name' => 'Create Sales', 'slug' => 'sales.create', 'module' => 'sales'],
            ['name' => 'View Purchases', 'slug' => 'purchases.view', 'module' => 'purchases'],
            ['name' => 'Create Purchases', 'slug' => 'purchases.create', 'module' => 'purchases'],
            ['name' => 'View Customers', 'slug' => 'customers.view', 'module' => 'crm'],
            ['name' => 'Create Customers', 'slug' => 'customers.create', 'module' => 'crm'],
            ['name' => 'Edit Customers', 'slug' => 'customers.edit', 'module' => 'crm'],
            ['name' => 'View Suppliers', 'slug' => 'suppliers.view', 'module' => 'suppliers'],
            ['name' => 'Create Suppliers', 'slug' => 'suppliers.create', 'module' => 'suppliers'],
            ['name' => 'Edit Suppliers', 'slug' => 'suppliers.edit', 'module' => 'suppliers'],
            ['name' => 'View Expenses', 'slug' => 'expenses.view', 'module' => 'expenses'],
            ['name' => 'Create Expenses', 'slug' => 'expenses.create', 'module' => 'expenses'],
            ['name' => 'View Trust Fund', 'slug' => 'trust.view', 'module' => 'trust'],
            ['name' => 'Manage Trust Fund', 'slug' => 'trust.manage', 'module' => 'trust'],
            ['name' => 'View Staff', 'slug' => 'staff.view', 'module' => 'staff'],
            ['name' => 'Manage Staff', 'slug' => 'staff.manage', 'module' => 'staff'],
            ['name' => 'View Reports', 'slug' => 'reports.view', 'module' => 'reports'],
            ['name' => 'View Settings', 'slug' => 'settings.view', 'module' => 'settings'],
            ['name' => 'Manage Settings', 'slug' => 'settings.manage', 'module' => 'settings'],
        ];

        foreach ($permissions as $perm) {
            Permission::updateOrCreate(['slug' => $perm['slug']], $perm);
        }
    }
}