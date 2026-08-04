<?php

namespace Database\Seeders;

use App\Models\AiInsight;
use App\Models\BatchMovement;
use App\Models\Branch;
use App\Models\Business;
use App\Models\ClinicAppointment;
use App\Models\ClinicConsultation;
use App\Models\ControlledDrugLog;
use App\Models\Cooperative;
use App\Models\CooperativeBrandingSetting;
use App\Models\CooperativeFinancing;
use App\Models\CooperativeFinancingReport;
use App\Models\CooperativeGovernanceRecord;
use App\Models\CooperativeGuarantor;
use App\Models\CooperativeInvestment;
use App\Models\CooperativeLoanSetting;
use App\Models\CooperativeMember;
use App\Models\CooperativeProfitCycle;
use App\Models\CooperativeProfitDistribution;
use App\Models\CooperativeShare;
use App\Models\CooperativeWallet;
use App\Models\CooperativeWithdrawal;
use App\Models\Customer;
use App\Models\DeliveryComplaint;
use App\Models\DeliveryContact;
use App\Models\DeliveryDispute;
use App\Models\DeliveryManifest;
use App\Models\DeliveryOrder;
use App\Models\DeliverySettlement;
use App\Models\DeliveryStatusEvent;
use App\Models\DeliveryVehicle;
use App\Models\DeliveryWalletTransaction;
use App\Models\Expense;
use App\Models\HotelBooking;
use App\Models\HotelHousekeepingLog;
use App\Models\HotelMaintenanceRequest;
use App\Models\HotelRoom;
use App\Models\HotelRoomInspectionLog;
use App\Models\HotelStaffShiftLog;
use App\Models\InventoryItem;
use App\Models\LabRequest;
use App\Models\LabTestCatalog;
use App\Models\LogisticsDriverSettlement;
use App\Models\LogisticsFleetAsset;
use App\Models\LogisticsFuelLog;
use App\Models\LogisticsMaintenanceLog;
use App\Models\LogisticsTripSheet;
use App\Models\LogisticsTripStop;
use App\Models\MedicineSubstitutionRule;
use App\Models\Order;
use App\Models\PatientRecord;
use App\Models\Permission;
use App\Models\PharmacyDispense;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductionBatch;
use App\Models\ProductionEnergyLog;
use App\Models\ProductionInputPurchase;
use App\Models\ProductionMaterial;
use App\Models\ProductionOutput;
use App\Models\ProductionWastageLog;
use App\Models\RawMaterial;
use App\Models\RecipeCard;
use App\Models\RecipeIngredient;
use App\Models\RefillReminder;
use App\Models\Role;
use App\Models\FoodWasteLog;
use App\Models\KitchenTicket;
use App\Models\RestaurantTable;
use App\Models\RestaurantTicket;
use App\Models\RestaurantTicketItem;
use App\Models\RestaurantWaiterShift;
use App\Models\Supplier;
use App\Models\SubscriptionPlan;
use App\Models\TableReservation;
use App\Models\TrustAccount;
use App\Models\TrustTransaction;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\CooperativeService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->ensureLegacySchemaCompatibility();
        $this->createAdmin();

        $this->call([
            PermissionSeeder::class,
            SubscriptionPlanSeeder::class,
        ]);

        $businessTypes = config('business_types.types', []);

        foreach ($businessTypes as $type => $config) {
            $account = config("business_types.demo_accounts.{$type}", []);
            $this->seedBusiness($type, $config, $account);
        }

        $this->seedCooperativeDemoAccount($businessTypes['general'] ?? []);
    }

    private function ensureLegacySchemaCompatibility(): void
    {
        if (! Schema::hasTable('categories')) {
            Schema::create('categories', function (Blueprint $table) {
                $table->id();
                $table->string('name')->nullable();
                $table->string('slug')->nullable();
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }
    }

    private function seedBusiness(string $type, array $config, array $account): void
    {
        $email = $account['email'] ?? "{$type}@taska.local";
        $ownerName = $account['name'] ?? ucfirst(str_replace('_', ' ', $type)) . ' Owner';
        $alias = Str::before($email, '@');

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $ownerName,
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '+2348000000000',
                'is_active' => true,
            ]
        );

        $business = Business::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Taska ' . $config['name'],
                'slug' => Str::slug($alias),
                'email' => $email,
                'phone' => '+2348000000000',
                'address' => '123 Result Seekers Avenue, Lagos, Nigeria',
                'city' => 'Lagos',
                'state' => 'Lagos',
                'country' => 'Nigeria',
                'business_type' => $type,
                'modules' => $config['modules'],
                'is_active' => true,
            ]
        );

        foreach (config('business_types.roles', []) as $roleData) {
            $role = Role::firstOrCreate(
                ['business_id' => $business->id, 'slug' => $roleData['slug']],
                $roleData
            );

            $this->syncRolePermissions($role);
        }

        $adminRole = Role::where('business_id', $business->id)->where('slug', 'admin')->firstOrFail();

        if (! $user->businesses()->where('business_id', $business->id)->exists()) {
            DB::table('business_user')->insert([
                'business_id' => $business->id,
                'user_id' => $user->id,
                'role_id' => $adminRole->id,
                'joined_at' => now(),
            ]);

            DB::table('role_user')->insert([
                'role_id' => $adminRole->id,
                'user_id' => $user->id,
                'business_id' => $business->id,
                'assigned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $branch = Branch::updateOrCreate(
            ['business_id' => $business->id, 'slug' => 'main-branch'],
            [
                'name' => 'Main Branch',
                'slug' => 'main-branch',
                'address' => $business->address,
                'is_primary' => true,
                'is_active' => true,
            ]
        );

        $warehouse = Warehouse::updateOrCreate(
            ['business_id' => $business->id, 'slug' => 'main-warehouse'],
            [
                'name' => 'Main Warehouse',
                'slug' => 'main-warehouse',
                'branch_id' => $branch->id,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        $user->forceFill([
            'current_business_id' => $business->id,
            'current_branch_id' => $branch->id,
        ])->save();

        $customers = $this->createCustomers($business->id, $branch->id, $alias);
        $this->createSuppliers($business->id, $alias);
        $products = $this->createProducts($business->id, $warehouse->id, $type, $alias);
        $this->createOrders($business->id, $branch->id, $user->id, $alias, $customers, $products);
        $this->createVerticalOpsData($type, $business->id, $branch->id, $user->id, $customers, $products);
        $this->createExpenses($business->id, $branch->id, $user->id, $alias);
        $this->createTrustAccounts($business->id, $customers);
        $this->createCooperativeOpsData($business->id, $type, $config['name'], $customers, $products);
        $this->createDemoInsights($business->id, $type, $config['name']);
    }

    private function seedCooperativeDemoAccount(array $generalConfig): void
    {
        if ($generalConfig === []) {
            return;
        }

        $cooperativeConfig = array_merge($generalConfig, [
            'name' => 'Cooperative Workspace',
        ]);

        $account = config('business_types.demo_accounts.cooperative', []);

        $this->seedBusiness('general', $cooperativeConfig, $account);
    }

    private function createCustomers(int $businessId, int $branchId, string $alias): Collection
    {
        $profiles = [
            ['name' => 'Amina Bello', 'credit_limit' => 120000, 'balance' => 42000],
            ['name' => 'Chidi Okafor', 'credit_limit' => 80000, 'balance' => 18000],
            ['name' => 'Fatima Yusuf', 'credit_limit' => 60000, 'balance' => 0],
            ['name' => 'Ibrahim Musa', 'credit_limit' => 40000, 'balance' => 12500],
            ['name' => 'Grace Daniel', 'credit_limit' => 30000, 'balance' => 0],
        ];

        return collect($profiles)->map(function (array $profile, int $index) use ($alias, $branchId, $businessId) {
            return Customer::updateOrCreate(
                ['business_id' => $businessId, 'email' => "{$alias}.customer" . ($index + 1) . '@taska.local'],
                [
                    'branch_id' => $branchId,
                    'name' => $profile['name'],
                    'phone' => '+2348100000' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'address' => 'Customer Market Road, Lagos',
                    'city' => 'Lagos',
                    'state' => 'Lagos',
                    'credit_limit' => $profile['credit_limit'],
                    'balance' => $profile['balance'],
                    'customer_type' => $index < 2 ? 'wholesaler' : 'retailer',
                    'is_active' => true,
                ]
            );
        });
    }

    private function createSuppliers(int $businessId, string $alias): void
    {
        $suppliers = [
            'Prime Supply Hub',
            'Northern Trade Depot',
            'Blue Ocean Distribution',
            'Metro Wholesale Partners',
        ];

        foreach ($suppliers as $index => $name) {
            Supplier::updateOrCreate(
                ['business_id' => $businessId, 'email' => "{$alias}.supplier" . ($index + 1) . '@taska.local'],
                [
                    'name' => $name,
                    'phone' => '+2348200000' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'address' => 'Industrial Layout, Lagos',
                ]
            );
        }
    }

    private function createProducts(int $businessId, int $warehouseId, string $type, string $alias): Collection
    {
        $products = collect($this->productBlueprints($type))->map(function (array $item, int $index) use ($alias, $businessId, $warehouseId) {
            $product = Product::updateOrCreate(
                ['business_id' => $businessId, 'sku' => strtoupper(Str::limit($alias, 6, '')) . '-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT)],
                [
                    'category_id' => null,
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'product_type' => 'single',
                    'track_inventory' => 'yes',
                    'cost_price' => $item['cost_price'],
                    'selling_price' => $item['selling_price'],
                    'min_price' => $item['cost_price'],
                    'max_price' => $item['selling_price'] * 1.2,
                    'low_stock_alert' => $item['low_stock_alert'],
                    'track_expiry' => $item['track_expiry'] ?? false,
                    'is_prescription_required' => $item['is_prescription_required'] ?? false,
                    'pharmacy_category' => $item['pharmacy_category'] ?? null,
                    'default_expiry_months' => $item['default_expiry_months'] ?? null,
                    'medicine_type' => $item['medicine_type'] ?? null,
                    'is_controlled_drug' => $item['is_controlled_drug'] ?? false,
                    'allow_substitution' => $item['allow_substitution'] ?? false,
                    'refill_cycle_days' => $item['refill_cycle_days'] ?? null,
                    'is_active' => true,
                ]
            );

            InventoryItem::updateOrCreate(
                ['business_id' => $businessId, 'warehouse_id' => $warehouseId, 'product_id' => $product->id],
                [
                    'quantity' => $item['quantity'],
                    'reserved_quantity' => $item['reserved_quantity'],
                    'reorder_point' => $item['low_stock_alert'],
                    'reorder_quantity' => max($item['low_stock_alert'] * 2, 20),
                ]
            );

            return $product->fresh();
        });

        return $products;
    }

    private function createOrders(
        int $businessId,
        int $branchId,
        int $userId,
        string $alias,
        Collection $customers,
        Collection $products
    ): void {
        if ($products->isEmpty()) {
            return;
        }

        $orderNumbers = collect(range(1, 6))->map(
            fn (int $number) => 'DMO-' . strtoupper(Str::of($alias)->replace('.', '')->replace('-', '')->value()) . '-' . str_pad((string) $number, 3, '0', STR_PAD_LEFT)
        );

        $existingOrderIds = Order::whereIn('order_number', $orderNumbers)
            ->pluck('id');

        if ($existingOrderIds->isNotEmpty()) {
            DB::table('order_items')->whereIn('order_id', $existingOrderIds)->delete();
            Order::whereIn('id', $existingOrderIds)->delete();
        }

        $orderDefinitions = [
            ['customer' => 0, 'days_ago' => 0, 'product_indexes' => [0, 1], 'quantities' => [3, 2], 'payment_method' => 'cash'],
            ['customer' => 1, 'days_ago' => 1, 'product_indexes' => [2, 3], 'quantities' => [4, 1], 'payment_method' => 'transfer'],
            ['customer' => 2, 'days_ago' => 2, 'product_indexes' => [1, 4], 'quantities' => [2, 2], 'payment_method' => 'cash'],
            ['customer' => 3, 'days_ago' => 4, 'product_indexes' => [0, 5], 'quantities' => [1, 3], 'payment_method' => 'card'],
            ['customer' => 4, 'days_ago' => 6, 'product_indexes' => [3, 4], 'quantities' => [2, 2], 'payment_method' => 'cash'],
            ['customer' => null, 'days_ago' => 8, 'product_indexes' => [2], 'quantities' => [5], 'payment_method' => 'cash'],
        ];

        foreach ($orderDefinitions as $index => $definition) {
            $orderNumber = $orderNumbers[$index];

            $order = Order::updateOrCreate(
                ['order_number' => $orderNumber],
                [
                    'business_id' => $businessId,
                    'branch_id' => $branchId,
                    'customer_id' => $definition['customer'] !== null ? optional($customers->get($definition['customer']))->id : null,
                    'created_by' => $userId,
                    'order_type' => 'sale',
                    'status' => 'completed',
                    'subtotal' => 0,
                    'discount' => 0,
                    'tax' => 0,
                    'total' => 0,
                    'paid' => 0,
                    'change' => 0,
                    'payment_method' => $definition['payment_method'],
                    'notes' => 'Deployment demo transaction',
                ]
            );

            $order->items()->delete();

            $subtotal = 0;
            foreach ($definition['product_indexes'] as $lineIndex => $productIndex) {
                $product = $products->get($productIndex);
                if (! $product) {
                    continue;
                }

                $quantity = $definition['quantities'][$lineIndex] ?? 1;
                $lineTotal = round((float) $product->selling_price * $quantity, 2);

                DB::table('order_items')->insert([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $product->selling_price,
                    'discount' => 0,
                    'total' => $lineTotal,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $subtotal += $lineTotal;
            }

            $moment = now()->subDays($definition['days_ago'])->setTime(10 + $index, 15);

            $order->forceFill([
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'paid' => $subtotal,
                'change' => 0,
                'created_at' => $moment,
                'updated_at' => $moment,
            ])->saveQuietly();
        }
    }

    private function createExpenses(int $businessId, int $branchId, int $userId, string $alias): void
    {
        $definitions = [
            ['slug' => 'power', 'name' => 'Power & Utilities', 'amount' => 18500, 'days_ago' => 0],
            ['slug' => 'transport', 'name' => 'Transport', 'amount' => 9600, 'days_ago' => 1],
            ['slug' => 'staff-meals', 'name' => 'Staff Welfare', 'amount' => 7200, 'days_ago' => 3],
            ['slug' => 'minor-repairs', 'name' => 'Minor Repairs', 'amount' => 13400, 'days_ago' => 5],
        ];

        foreach ($definitions as $index => $definition) {
            DB::table('expense_categories')->updateOrInsert(
                ['business_id' => $businessId, 'slug' => $definition['slug']],
                [
                    'name' => $definition['name'],
                    'description' => 'Demo expense category',
                    'is_active' => true,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $categoryId = DB::table('expense_categories')
                ->where('business_id', $businessId)
                ->where('slug', $definition['slug'])
                ->value('id');

            Expense::updateOrCreate(
                ['business_id' => $businessId, 'reference' => strtoupper($alias) . '-EXP-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT)],
                [
                    'branch_id' => $branchId,
                    'expense_category_id' => $categoryId,
                    'created_by' => $userId,
                    'description' => $definition['name'] . ' demo cost',
                    'amount' => $definition['amount'],
                    'payment_method' => 'cash',
                    'expense_date' => now()->subDays($definition['days_ago'])->toDateString(),
                    'is_approved' => true,
                ]
            );
        }
    }

    private function createTrustAccounts(int $businessId, Collection $customers): void
    {
        $customers->take(2)->values()->each(function (Customer $customer, int $index) use ($businessId) {
            TrustAccount::updateOrCreate(
                ['business_id' => $businessId, 'customer_id' => $customer->id, 'account_type' => 'credit'],
                [
                    'limit' => 100000 - ($index * 20000),
                    'balance' => 65000 - ($index * 12000),
                    'total_repaid' => 15000 + ($index * 4000),
                    'last_payment_date' => now()->subDays(18 + ($index * 10))->toDateString(),
                    'status' => 'active',
                ]
            );
        });

        if ($customers->isEmpty()) {
            return;
        }

        $member = $customers->first();

        $contributionAccount = TrustAccount::updateOrCreate(
            ['business_id' => $businessId, 'customer_id' => $member->id, 'account_type' => 'contribution'],
            [
                'cycle_name' => 'Weekly Trader Circle',
                'limit' => 40000,
                'installment_amount' => 5000,
                'contribution_frequency_days' => 7,
                'balance' => 28000,
                'total_repaid' => 12000,
                'last_payment_date' => now()->subDays(6)->toDateString(),
                'next_due_date' => now()->subDay()->toDateString(),
                'status' => 'active',
            ]
        );

        TrustTransaction::where('trust_account_id', $contributionAccount->id)->delete();

        $transactions = [
            [
                'type' => 'draw',
                'amount' => 15000,
                'balance_before' => 0,
                'balance_after' => 15000,
                'reference' => 'Cycle opening collection',
                'transaction_date' => now()->subDays(14)->toDateString(),
            ],
            [
                'type' => 'draw',
                'amount' => 25000,
                'balance_before' => 15000,
                'balance_after' => 40000,
                'reference' => 'Mid-cycle contribution',
                'transaction_date' => now()->subDays(6)->toDateString(),
            ],
            [
                'type' => 'repayment',
                'amount' => -12000,
                'balance_before' => 40000,
                'balance_after' => 28000,
                'reference' => 'Member payout recorded',
                'transaction_date' => now()->subDays(2)->toDateString(),
            ],
        ];

        foreach ($transactions as $transaction) {
            TrustTransaction::create([
                'business_id' => $businessId,
                'trust_account_id' => $contributionAccount->id,
                'customer_id' => $member->id,
                'created_by' => null,
                ...$transaction,
            ]);
        }
    }

    private function createCooperativeOpsData(
        int $businessId,
        string $type,
        string $businessName,
        Collection $customers,
        Collection $products
    ): void {
        if ($customers->count() < 4) {
            return;
        }

        $cooperativeService = app(CooperativeService::class);
        $subscriptionPlanId = SubscriptionPlan::query()
            ->whereIn('slug', ['premium', 'standard', 'basic', 'free'])
            ->orderByRaw("CASE slug WHEN 'premium' THEN 1 WHEN 'standard' THEN 2 WHEN 'basic' THEN 3 WHEN 'free' THEN 4 ELSE 5 END")
            ->value('id');

        $cooperative = $cooperativeService->ensureCooperative($businessId, [
            'subscription_plan_id' => $subscriptionPlanId,
            'name' => "Taska {$businessName} Cooperative",
            'slug' => 'coop-' . $businessId,
            'description' => 'Member-owned halal finance, disciplined treasury management, and cooperative profit sharing.',
            'share_price' => 1000,
            'minimum_member_shares' => 2,
            'contribution_rule' => 'Monthly share purchases and disciplined treasury ring-fencing across financing, investment, reserve, and charity wallets.',
            'profit_cycle' => 'monthly',
            'status' => 'active',
            'sharia_notes' => 'No riba. Qard Hasan late penalties move to charity. Profit is recognized only from halal trade and approved partnerships.',
            'loan_settings' => [
                'required_guarantors' => 2,
                'min_shares_per_guarantor' => 2,
                'min_combined_guarantor_shares' => 6,
                'borrower_min_shares' => 3,
                'loan_limit_mode' => 'multiplier',
                'loan_limit_value' => 2,
                'lock_borrower_shares' => true,
                'lock_guarantor_shares' => true,
                'liability_mode' => 'proportional',
                'allow_admin_override' => true,
                'custom_liability_notes' => 'Treasurer can rebalance guarantees after documented member resolution.',
            ],
            'branding' => [
                'branding_tier' => in_array($type, ['retail', 'supermarket', 'general', 'mixed'], true) ? 'premium' : 'standard',
                'primary_color' => '#6D28D9',
                'secondary_color' => '#0F172A',
                'custom_tagline' => 'Shared ownership, halal growth, disciplined treasury.',
                'remove_powered_by_taska' => false,
            ],
        ]);

        CooperativeProfitDistribution::whereIn(
            'profit_cycle_id',
            CooperativeProfitCycle::where('cooperative_id', $cooperative->id)->pluck('id')
        )->delete();
        CooperativeProfitCycle::where('cooperative_id', $cooperative->id)->delete();
        CooperativeFinancingReport::whereIn(
            'financing_id',
            CooperativeFinancing::where('cooperative_id', $cooperative->id)->pluck('id')
        )->delete();
        CooperativeGuarantor::whereIn(
            'financing_id',
            CooperativeFinancing::where('cooperative_id', $cooperative->id)->pluck('id')
        )->delete();
        CooperativeFinancing::where('cooperative_id', $cooperative->id)->delete();
        CooperativeInvestment::where('cooperative_id', $cooperative->id)->delete();
        CooperativeWithdrawal::where('cooperative_id', $cooperative->id)->delete();
        CooperativeGovernanceRecord::where('cooperative_id', $cooperative->id)->delete();
        CooperativeShare::where('cooperative_id', $cooperative->id)->delete();
        CooperativeMember::where('cooperative_id', $cooperative->id)->delete();

        $members = collect([
            ['customer' => $customers[0], 'role' => 'admin', 'notes' => 'Lead member and chairperson.'],
            ['customer' => $customers[1], 'role' => 'treasurer', 'notes' => 'Treasury and settlement oversight.'],
            ['customer' => $customers[2], 'role' => 'auditor', 'notes' => 'Independent control reviewer.'],
            ['customer' => $customers[3], 'role' => 'member', 'notes' => 'Active borrowing and trading member.'],
        ])->map(function (array $definition) use ($cooperativeService, $cooperative) {
            return $cooperativeService->addMember($cooperative, [
                'customer_id' => $definition['customer']->id,
                'role' => $definition['role'],
                'joined_at' => now()->subMonths(4)->toDateString(),
                'notes' => $definition['notes'],
            ]);
        })->values();

        $sharePurchases = [
            ['member' => 0, 'units' => 12, 'issued_at' => now()->subMonths(4)->toDateString(), 'notes' => 'Founding contribution block'],
            ['member' => 1, 'units' => 9, 'issued_at' => now()->subMonths(3)->toDateString(), 'notes' => 'Treasury seed shares'],
            ['member' => 2, 'units' => 7, 'issued_at' => now()->subMonths(3)->toDateString(), 'notes' => 'Audit committee entry shares'],
            ['member' => 3, 'units' => 5, 'issued_at' => now()->subMonths(2)->toDateString(), 'notes' => 'Member admission shares'],
            ['member' => 0, 'units' => 2, 'transaction_type' => 'bonus', 'issued_at' => now()->subMonth()->toDateString(), 'notes' => 'Performance bonus allocation'],
        ];

        foreach ($sharePurchases as $purchase) {
            $cooperativeService->purchaseShares($cooperative, [
                'member_id' => $members[$purchase['member']]->id,
                'units' => $purchase['units'],
                'transaction_type' => $purchase['transaction_type'] ?? 'purchase',
                'issued_at' => $purchase['issued_at'],
                'notes' => $purchase['notes'],
            ]);
        }

        $qardHasan = $cooperativeService->createFinancing($cooperative, [
            'member_id' => $members[3]->id,
            'financing_type' => 'qard_hasan',
            'amount_requested' => 9000,
            'duration_months' => 3,
            'repayment_due_date' => now()->addMonths(3)->toDateString(),
            'business_description' => 'Short-term working capital for approved member trade restock.',
            'guarantor_member_ids' => [$members[0]->id, $members[1]->id],
            'sharia_notes' => 'Interest-free support facility. Any late penalty goes to charity.',
        ], 1);

        $cooperativeService->approveGuarantor($qardHasan, $members[0]->id);
        $cooperativeService->approveGuarantor($qardHasan, $members[1]->id);
        $cooperativeService->updateFinancingStatus($qardHasan, ['status' => 'approved'], 1);
        $cooperativeService->updateFinancingStatus($qardHasan, ['status' => 'disbursed', 'amount_disbursed' => 9000], 1);
        $cooperativeService->updateFinancingStatus($qardHasan, ['status' => 'active_repayment'], 1);

        $mudarabah = $cooperativeService->createFinancing($cooperative, [
            'member_id' => $members[1]->id,
            'financing_type' => 'mudarabah',
            'capital_amount' => 25000,
            'profit_share_cooperative' => 55,
            'profit_share_member' => 45,
            'business_description' => 'Halal commodity trading line managed by the treasurer-member.',
            'duration_months' => 6,
            'sharia_notes' => 'Returns depend on real trade profit only.',
        ], 1);
        $cooperativeService->updateFinancingStatus($mudarabah, ['status' => 'approved'], 1);

        $musharakah = $cooperativeService->createFinancing($cooperative, [
            'member_id' => $members[2]->id,
            'financing_type' => 'musharakah',
            'cooperative_capital' => 18000,
            'member_capital' => 12000,
            'profit_share_ratio' => '60:40',
            'business_description' => 'Shared inventory distribution partnership with matched working capital.',
            'duration_months' => 5,
            'sharia_notes' => 'Loss follows capital ratio and profit follows the agreed share.',
        ], 1);
        $cooperativeService->updateFinancingStatus($musharakah, ['status' => 'approved'], 1);

        $cooperativeService->storeFinancingReport($mudarabah, [
            'reporting_period_start' => now()->subMonth()->startOfMonth()->toDateString(),
            'reporting_period_end' => now()->subMonth()->endOfMonth()->toDateString(),
            'revenue' => 42000,
            'direct_cost' => 25000,
            'net_profit' => 17000,
            'cooperative_share_amount' => 9350,
            'member_share_amount' => 7650,
            'status' => 'reviewed',
            'report_notes' => 'Trade line closed with healthy turnover and clean cash collection.',
        ]);

        $cooperativeService->storeFinancingReport($musharakah, [
            'reporting_period_start' => now()->subDays(20)->toDateString(),
            'reporting_period_end' => now()->subDays(5)->toDateString(),
            'revenue' => 36000,
            'direct_cost' => 23500,
            'net_profit' => 12500,
            'cooperative_share_amount' => 7500,
            'member_share_amount' => 5000,
            'status' => 'submitted',
            'report_notes' => 'Joint partnership remains profitable with one receivable still open.',
        ]);

        $cooperativeService->createInvestment($cooperative, [
            'product_id' => $products->first()?->id,
            'name' => 'Halal trade basket',
            'category' => 'inventory_backed',
            'amount' => 30000,
            'expected_return_rate' => 18,
            'current_value' => 34800,
            'start_date' => now()->subMonths(2)->toDateString(),
            'end_date' => now()->addMonths(4)->toDateString(),
            'linked_inventory' => true,
            'notes' => 'Inventory-backed investment ring-fenced for profitable rotation stock.',
        ]);

        $profitCycle = $cooperativeService->createProfitCycle($cooperative, [
            'label' => 'Ramadan cycle distribution',
            'cycle_start' => now()->subMonth()->startOfMonth()->toDateString(),
            'cycle_end' => now()->subMonth()->endOfMonth()->toDateString(),
            'total_profit' => 52000,
            'reserve_allocation' => 8000,
            'charity_allocation' => 2500,
            'notes' => 'Distribution after reserve top-up and charity allocation.',
        ]);
        $cooperativeService->distributeProfit($profitCycle);

        $cooperativeService->requestWithdrawal($cooperative, [
            'member_id' => $members[0]->id,
            'withdrawal_type' => 'profit_withdrawal',
            'status' => 'approved',
            'amount' => 12000,
            'reason' => 'Approved member profit draw after cycle close.',
            'notes' => 'Treasury confirmed sufficient liquidity before approval.',
        ]);

        $cooperativeService->createGovernanceRecord($cooperative, [
            'record_type' => 'meeting',
            'title' => 'Monthly treasury and compliance review',
            'record_date' => now()->subDays(7)->toDateString(),
            'status' => 'completed',
            'summary' => 'Members approved the financing pipeline, reserve transfer, and next reporting schedule.',
            'decisions_json' => [
                'approved_profit_cycle' => true,
                'raised_financing_watchlist' => true,
            ],
        ]);

        $walletTargets = [
            'main' => 98000,
            'financing_fund' => 64000,
            'investment_fund' => 42000,
            'reserve_fund' => 18000,
            'charity_fund' => 4500,
        ];

        foreach ($walletTargets as $walletType => $balance) {
            CooperativeWallet::where('cooperative_id', $cooperative->id)
                ->where('wallet_type', $walletType)
                ->update(['balance' => $balance]);
        }
    }

    private function createVerticalOpsData(
        string $type,
        int $businessId,
        int $branchId,
        int $userId,
        Collection $customers,
        Collection $products
    ): void {
        if ($type === 'pharmacy') {
            $this->createPharmacyOpsData($businessId, $branchId, $userId, $customers, $products);
        }

        if (in_array($type, ['clinic', 'laboratory'], true)) {
            $this->createHealthOpsData($businessId, $branchId, $userId, $type);
        }

        if ($type === 'hotel') {
            $this->createHotelOpsData($businessId, $branchId, $userId);
        }

        if ($type === 'delivery_company') {
            $this->createDeliveryOpsData($businessId, $branchId, $userId);
        }

        if ($type === 'logistics') {
            $this->createLogisticsOpsData($businessId, $branchId, $userId, $customers);
        }

        if ($type === 'pure_water_factory') {
            $this->createProductionOpsData($businessId, $branchId, $userId, $products);
        }

        if ($type === 'restaurant') {
            $this->createRestaurantOpsData($businessId, $branchId, $userId, $customers, $products);
        }
    }

    private function createPharmacyOpsData(
        int $businessId,
        int $branchId,
        int $userId,
        Collection $customers,
        Collection $products
    ): void {
        if ($products->count() < 5) {
            return;
        }

        $batchDefinitions = [
            [
                'product' => 0,
                'batch_number' => 'PHA-BATCH-001',
                'manufacture_date' => now()->copy()->subMonths(8)->toDateString(),
                'expiry_date' => now()->copy()->addDays(18)->toDateString(),
                'quantity' => 24,
                'remaining_quantity' => 16,
                'cost_per_unit' => 820,
                'near_expiry_discount_percent' => 10,
                'discounted_price' => 1080,
                'supplier' => 'Prime Supply Hub',
                'notes' => 'Near-expiry analgesic batch for discount workflow',
            ],
            [
                'product' => 1,
                'batch_number' => 'PHA-BATCH-002',
                'manufacture_date' => now()->copy()->subMonths(5)->toDateString(),
                'expiry_date' => now()->copy()->addMonths(9)->toDateString(),
                'quantity' => 20,
                'remaining_quantity' => 14,
                'cost_per_unit' => 2250,
                'near_expiry_discount_percent' => 0,
                'discounted_price' => 0,
                'supplier' => 'Northern Trade Depot',
                'notes' => 'Prescription antibiotic stock',
            ],
            [
                'product' => 2,
                'batch_number' => 'PHA-BATCH-003',
                'manufacture_date' => now()->copy()->subMonths(3)->toDateString(),
                'expiry_date' => now()->copy()->addMonths(6)->toDateString(),
                'quantity' => 18,
                'remaining_quantity' => 12,
                'cost_per_unit' => 1480,
                'near_expiry_discount_percent' => 0,
                'discounted_price' => 0,
                'supplier' => 'Blue Ocean Distribution',
                'notes' => 'Paediatric syrup batch',
            ],
            [
                'product' => 3,
                'batch_number' => 'PHA-BATCH-004',
                'manufacture_date' => now()->copy()->subMonths(7)->toDateString(),
                'expiry_date' => now()->copy()->subDays(6)->toDateString(),
                'quantity' => 12,
                'remaining_quantity' => 4,
                'cost_per_unit' => 3250,
                'near_expiry_discount_percent' => 25,
                'discounted_price' => 3400,
                'supplier' => 'Metro Wholesale Partners',
                'notes' => 'Expired antimalarial stock awaiting write-off',
            ],
            [
                'product' => 4,
                'batch_number' => 'PHA-BATCH-005',
                'manufacture_date' => now()->copy()->subMonths(10)->toDateString(),
                'expiry_date' => now()->copy()->addMonths(14)->toDateString(),
                'quantity' => 30,
                'remaining_quantity' => 19,
                'cost_per_unit' => 4100,
                'near_expiry_discount_percent' => 0,
                'discounted_price' => 0,
                'supplier' => 'Prime Supply Hub',
                'notes' => 'Controlled pain management stock',
            ],
        ];

        $batches = collect($batchDefinitions)->map(function (array $definition) use ($businessId, $products) {
            $product = $products->get($definition['product']);
            if (! $product) {
                return null;
            }

            return ProductBatch::updateOrCreate(
                ['business_id' => $businessId, 'batch_number' => $definition['batch_number']],
                [
                    'product_id' => $product->id,
                    'manufacture_date' => $definition['manufacture_date'],
                    'expiry_date' => $definition['expiry_date'],
                    'quantity' => $definition['quantity'],
                    'remaining_quantity' => $definition['remaining_quantity'],
                    'cost_per_unit' => $definition['cost_per_unit'],
                    'near_expiry_discount_percent' => $definition['near_expiry_discount_percent'],
                    'discounted_price' => $definition['discounted_price'],
                    'supplier' => $definition['supplier'],
                    'notes' => $definition['notes'],
                ]
            );
        })->filter();

        $primaryCustomer = $customers->get(0);
        $secondaryCustomer = $customers->get(1);
        $analgesicBatch = $batches->firstWhere('batch_number', 'PHA-BATCH-001');
        $antibioticBatch = $batches->firstWhere('batch_number', 'PHA-BATCH-002');
        $controlledBatch = $batches->firstWhere('batch_number', 'PHA-BATCH-005');

        $genericPainRelief = $products->get(0);
        $brandPainRelief = $products->get(1);
        $coughRelief = $products->get(5);
        $controlledDrug = $products->get(4);

        if ($genericPainRelief && $brandPainRelief) {
            MedicineSubstitutionRule::updateOrCreate(
                [
                    'business_id' => $businessId,
                    'product_id' => $brandPainRelief->id,
                    'substitute_product_id' => $genericPainRelief->id,
                ],
                [
                    'reason' => 'Approved generic alternative for cost-sensitive patients.',
                    'is_active' => true,
                ]
            );
        }

        $dispenseOne = null;
        if ($primaryCustomer && $genericPainRelief && $analgesicBatch) {
            $dispenseOne = PharmacyDispense::updateOrCreate(
                ['business_id' => $businessId, 'prescription_reference' => 'RX-DEMO-001'],
                [
                    'customer_id' => $primaryCustomer->id,
                    'product_id' => $genericPainRelief->id,
                    'product_batch_id' => $analgesicBatch->id,
                    'substituted_from_product_id' => $brandPainRelief?->id,
                    'quantity' => 2,
                    'unit_price' => 1100,
                    'total_amount' => 2200,
                    'refill_due' => true,
                    'dispensed_at' => now()->copy()->subDays(22),
                ]
            );

            BatchMovement::updateOrCreate(
                [
                    'business_id' => $businessId,
                    'product_batch_id' => $analgesicBatch->id,
                    'reference_type' => PharmacyDispense::class,
                    'reference_id' => $dispenseOne->id,
                ],
                [
                    'warehouse_id' => null,
                    'movement_type' => 'dispensed',
                    'quantity' => 2,
                    'notes' => 'Demo analgesic dispense',
                    'created_by' => $userId,
                ]
            );

            RefillReminder::updateOrCreate(
                [
                    'business_id' => $businessId,
                    'pharmacy_dispense_id' => $dispenseOne->id,
                ],
                [
                    'customer_id' => $primaryCustomer->id,
                    'product_id' => $genericPainRelief->id,
                    'due_on' => now()->copy()->addDays(8)->toDateString(),
                    'status' => 'pending',
                    'notes' => 'Follow up on recurring pain medication refill.',
                ]
            );
        }

        if ($secondaryCustomer && $controlledDrug && $controlledBatch) {
            $dispenseTwo = PharmacyDispense::updateOrCreate(
                ['business_id' => $businessId, 'prescription_reference' => 'RX-DEMO-002'],
                [
                    'customer_id' => $secondaryCustomer->id,
                    'product_id' => $controlledDrug->id,
                    'product_batch_id' => $controlledBatch->id,
                    'substituted_from_product_id' => null,
                    'quantity' => 1,
                    'unit_price' => 6200,
                    'total_amount' => 6200,
                    'refill_due' => false,
                    'dispensed_at' => now()->copy()->subDays(3),
                ]
            );

            BatchMovement::updateOrCreate(
                [
                    'business_id' => $businessId,
                    'product_batch_id' => $controlledBatch->id,
                    'reference_type' => PharmacyDispense::class,
                    'reference_id' => $dispenseTwo->id,
                ],
                [
                    'warehouse_id' => null,
                    'movement_type' => 'dispensed',
                    'quantity' => 1,
                    'notes' => 'Controlled medication demo dispense',
                    'created_by' => $userId,
                ]
            );

            ControlledDrugLog::updateOrCreate(
                [
                    'business_id' => $businessId,
                    'product_batch_id' => $controlledBatch->id,
                    'prescription_reference' => 'RX-DEMO-002',
                ],
                [
                    'product_id' => $controlledDrug->id,
                    'customer_id' => $secondaryCustomer->id,
                    'movement_type' => 'dispensed',
                    'quantity' => 1,
                    'notes' => 'Customer identity and prescription manually verified.',
                    'created_by' => $userId,
                ]
            );
        }

        if ($secondaryCustomer && $brandPainRelief && $antibioticBatch) {
            $dispenseThree = PharmacyDispense::updateOrCreate(
                ['business_id' => $businessId, 'prescription_reference' => 'RX-DEMO-003'],
                [
                    'customer_id' => $secondaryCustomer->id,
                    'product_id' => $brandPainRelief->id,
                    'product_batch_id' => $antibioticBatch->id,
                    'substituted_from_product_id' => null,
                    'quantity' => 1,
                    'unit_price' => 3100,
                    'total_amount' => 3100,
                    'refill_due' => false,
                    'dispensed_at' => now()->copy()->subDays(1),
                ]
            );

            BatchMovement::updateOrCreate(
                [
                    'business_id' => $businessId,
                    'product_batch_id' => $antibioticBatch->id,
                    'reference_type' => PharmacyDispense::class,
                    'reference_id' => $dispenseThree->id,
                ],
                [
                    'warehouse_id' => null,
                    'movement_type' => 'dispensed',
                    'quantity' => 1,
                    'notes' => 'Prescription antibiotic demo dispense',
                    'created_by' => $userId,
                ]
            );
        }

        if ($primaryCustomer && $coughRelief) {
            RefillReminder::updateOrCreate(
                [
                    'business_id' => $businessId,
                    'customer_id' => $primaryCustomer->id,
                    'product_id' => $coughRelief->id,
                ],
                [
                    'pharmacy_dispense_id' => $dispenseOne?->id,
                    'due_on' => now()->copy()->subDays(2)->toDateString(),
                    'status' => 'overdue',
                    'notes' => 'Cough medication follow-up call missed.',
                ]
            );
        }
    }

    private function createHealthOpsData(
        int $businessId,
        int $branchId,
        int $userId,
        string $type
    ): void {
        $patients = collect([
            [
                'patient_code' => strtoupper(substr($type, 0, 3)) . '-PAT-001',
                'full_name' => 'Amina Bello',
                'phone' => '+2348112000001',
                'email' => strtolower($type) . '.patient1@taska.local',
                'date_of_birth' => '1991-04-15',
                'gender' => 'female',
                'blood_group' => 'O+',
                'medical_history' => 'Recurring migraines and seasonal allergies.',
                'hmo_provider' => 'Hygeia',
                'insurance_number' => 'HMO-001-A',
                'guardian_name' => null,
                'guardian_phone' => null,
            ],
            [
                'patient_code' => strtoupper(substr($type, 0, 3)) . '-PAT-002',
                'full_name' => 'Ibrahim Musa',
                'phone' => '+2348112000002',
                'email' => strtolower($type) . '.patient2@taska.local',
                'date_of_birth' => '1984-09-02',
                'gender' => 'male',
                'blood_group' => 'A+',
                'medical_history' => 'Hypertension follow-up case.',
                'hmo_provider' => 'AXA Mansard',
                'insurance_number' => 'HMO-002-B',
                'guardian_name' => null,
                'guardian_phone' => null,
            ],
            [
                'patient_code' => strtoupper(substr($type, 0, 3)) . '-PAT-003',
                'full_name' => 'Grace Daniel',
                'phone' => '+2348112000003',
                'email' => strtolower($type) . '.patient3@taska.local',
                'date_of_birth' => '2016-11-20',
                'gender' => 'female',
                'blood_group' => 'B+',
                'medical_history' => 'Paediatric fever monitoring.',
                'hmo_provider' => null,
                'insurance_number' => null,
                'guardian_name' => 'Daniel Daniel',
                'guardian_phone' => '+2348011111111',
            ],
        ])->map(function (array $payload) use ($businessId, $branchId) {
            return PatientRecord::updateOrCreate(
                ['business_id' => $businessId, 'patient_code' => $payload['patient_code']],
                array_merge($payload, ['branch_id' => $branchId])
            );
        })->values();

        $apptToday = ClinicAppointment::updateOrCreate(
            ['business_id' => $businessId, 'appointment_code' => strtoupper(substr($type, 0, 3)) . '-APT-001'],
            [
                'branch_id' => $branchId,
                'patient_id' => $patients[0]->id,
                'doctor_id' => $userId,
                'scheduled_for' => now()->copy()->setTime(10, 30),
                'status' => 'scheduled',
                'reason' => 'Recurring headache review and medication check.',
                'referral_source' => 'Walk-in',
            ]
        );

        $apptFollowUp = ClinicAppointment::updateOrCreate(
            ['business_id' => $businessId, 'appointment_code' => strtoupper(substr($type, 0, 3)) . '-APT-002'],
            [
                'branch_id' => $branchId,
                'patient_id' => $patients[1]->id,
                'doctor_id' => $userId,
                'scheduled_for' => now()->copy()->addDay()->setTime(9, 0),
                'status' => 'scheduled',
                'reason' => 'Blood pressure monitoring follow-up.',
                'referral_source' => 'Returning patient',
            ]
        );

        $apptCompleted = ClinicAppointment::updateOrCreate(
            ['business_id' => $businessId, 'appointment_code' => strtoupper(substr($type, 0, 3)) . '-APT-003'],
            [
                'branch_id' => $branchId,
                'patient_id' => $patients[2]->id,
                'doctor_id' => $userId,
                'scheduled_for' => now()->copy()->subHours(5),
                'status' => 'completed',
                'reason' => 'Fever assessment and paediatric review.',
                'referral_source' => 'Parent referral',
            ]
        );

        $consultationOne = ClinicConsultation::updateOrCreate(
            ['business_id' => $businessId, 'receipt_number' => strtoupper(substr($type, 0, 3)) . '-RCT-001'],
            [
                'appointment_id' => $apptCompleted->id,
                'patient_id' => $patients[2]->id,
                'doctor_id' => $userId,
                'triage_vitals' => [
                    'temperature_c' => 38.2,
                    'pulse_bpm' => 96,
                    'weight_kg' => 22,
                ],
                'doctor_notes' => 'Child presented with mild fever and low appetite.',
                'diagnosis' => 'Uncomplicated malaria suspicion',
                'treatment_plan' => 'Start antimalarial course and hydration support.',
                'follow_up_date' => now()->copy()->addDays(3),
                'billing_amount' => 18500,
                'amount_paid' => 12000,
                'created_at' => now()->copy()->subHours(4),
                'updated_at' => now()->copy()->subHours(4),
            ]
        );

        $consultationTwo = ClinicConsultation::updateOrCreate(
            ['business_id' => $businessId, 'receipt_number' => strtoupper(substr($type, 0, 3)) . '-RCT-002'],
            [
                'appointment_id' => null,
                'patient_id' => $patients[1]->id,
                'doctor_id' => $userId,
                'triage_vitals' => [
                    'bp' => '150/95',
                    'pulse_bpm' => 88,
                    'weight_kg' => 78,
                ],
                'doctor_notes' => 'Patient reviewed after elevated home BP readings.',
                'diagnosis' => 'Hypertension follow-up',
                'treatment_plan' => 'Adjust medication and monitor over next two weeks.',
                'follow_up_date' => now()->copy()->addDays(14),
                'billing_amount' => 22000,
                'amount_paid' => 22000,
                'created_at' => now()->copy()->subDay(),
                'updated_at' => now()->copy()->subDay(),
            ]
        );

        $tests = collect([
            ['name' => 'Malaria Parasite Test', 'sample_type' => 'Blood', 'reference_range' => 'Negative', 'price' => 4500, 'turnaround_hours' => 2],
            ['name' => 'Full Blood Count', 'sample_type' => 'Blood', 'reference_range' => 'Within reference range', 'price' => 8500, 'turnaround_hours' => 6],
            ['name' => 'Urinalysis', 'sample_type' => 'Urine', 'reference_range' => 'Normal', 'price' => 3800, 'turnaround_hours' => 3],
        ])->map(function (array $test) use ($businessId) {
            return LabTestCatalog::updateOrCreate(
                ['business_id' => $businessId, 'name' => $test['name']],
                $test
            );
        })->values();

        $approvedLab = LabRequest::updateOrCreate(
            ['business_id' => $businessId, 'sample_barcode' => strtoupper(substr($type, 0, 3)) . '-LAB-001'],
            [
                'patient_id' => $patients[2]->id,
                'consultation_id' => $consultationOne->id,
                'test_id' => $tests[0]->id,
                'requested_by' => $userId,
                'technician_id' => $userId,
                'status' => 'approved',
                'result_value' => 'Positive',
                'is_abnormal' => true,
                'rejection_reason' => null,
                'sample_collected_at' => now()->copy()->subHours(3),
                'approved_at' => now()->copy()->subHours(1),
            ]
        );

        $pendingLab = LabRequest::updateOrCreate(
            ['business_id' => $businessId, 'sample_barcode' => strtoupper(substr($type, 0, 3)) . '-LAB-002'],
            [
                'patient_id' => $patients[1]->id,
                'consultation_id' => $consultationTwo->id,
                'test_id' => $tests[1]->id,
                'requested_by' => $userId,
                'technician_id' => $userId,
                'status' => 'review_pending',
                'result_value' => 'PCV 29%',
                'is_abnormal' => true,
                'rejection_reason' => null,
                'sample_collected_at' => now()->copy()->subHours(2),
                'approved_at' => null,
            ]
        );

        LabRequest::updateOrCreate(
            ['business_id' => $businessId, 'sample_barcode' => strtoupper(substr($type, 0, 3)) . '-LAB-003'],
            [
                'patient_id' => $patients[0]->id,
                'consultation_id' => null,
                'test_id' => $tests[2]->id,
                'requested_by' => $userId,
                'technician_id' => $userId,
                'status' => 'rejected',
                'result_value' => null,
                'is_abnormal' => false,
                'rejection_reason' => 'Insufficient sample volume collected.',
                'sample_collected_at' => now()->copy()->subHours(6),
                'approved_at' => null,
            ]
        );
    }

    private function createHotelOpsData(
        int $businessId,
        int $branchId,
        int $userId
    ): void {
        $roomIds = HotelRoom::where('business_id', $businessId)->pluck('id');

        if ($roomIds->isNotEmpty()) {
            HotelHousekeepingLog::whereIn('room_id', $roomIds)->delete();
            HotelMaintenanceRequest::whereIn('room_id', $roomIds)->delete();
            HotelRoomInspectionLog::whereIn('room_id', $roomIds)->delete();
            HotelBooking::whereIn('room_id', $roomIds)->delete();
            HotelRoom::whereIn('id', $roomIds)->delete();
        }

        HotelStaffShiftLog::where('business_id', $businessId)->delete();

        $rooms = collect([
            ['room_number' => '101', 'category' => 'Standard', 'floor' => '1', 'status' => 'occupied', 'cleaning_status' => 'clean', 'base_rate' => 28000, 'extra_guest_charge' => 5000, 'late_checkout_charge' => 7000, 'early_checkin_charge' => 4500, 'blocked_reason' => null],
            ['room_number' => '102', 'category' => 'Deluxe', 'floor' => '1', 'status' => 'available', 'cleaning_status' => 'inspected', 'base_rate' => 42000, 'extra_guest_charge' => 7000, 'late_checkout_charge' => 10000, 'early_checkin_charge' => 6000, 'blocked_reason' => null],
            ['room_number' => '201', 'category' => 'Executive', 'floor' => '2', 'status' => 'blocked', 'cleaning_status' => 'dirty', 'base_rate' => 55000, 'extra_guest_charge' => 9000, 'late_checkout_charge' => 12000, 'early_checkin_charge' => 8000, 'blocked_reason' => 'Bathroom plumbing repair in progress'],
            ['room_number' => '202', 'category' => 'Standard', 'floor' => '2', 'status' => 'cleaning', 'cleaning_status' => 'in_progress', 'base_rate' => 30000, 'extra_guest_charge' => 5000, 'late_checkout_charge' => 7000, 'early_checkin_charge' => 4500, 'blocked_reason' => null],
        ])->map(function (array $room) use ($businessId, $branchId) {
            return HotelRoom::create(array_merge($room, [
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'is_active' => true,
            ]));
        })->values();

        HotelBooking::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'room_id' => $rooms[0]->id,
            'reservation_code' => 'HTL-' . $businessId . '-001',
            'guest_name' => 'Aisha Bello',
            'guest_phone' => '+2348130001001',
            'guest_email' => 'aisha.bello@taska.local',
            'status' => 'checked_in',
            'check_in_date' => today(),
            'check_out_date' => today()->copy()->addDays(2),
            'actual_check_in_at' => now()->copy()->subHours(4),
            'actual_check_out_at' => null,
            'adults' => 2,
            'extra_guests' => 0,
            'is_repeat_guest' => true,
            'payment_method' => 'transfer',
            'room_rate' => 28000,
            'extra_guest_charge_total' => 0,
            'late_checkout_charge_total' => 0,
            'early_checkin_charge_total' => 4500,
            'total_amount' => 60500,
            'amount_paid' => 40500,
            'notes' => 'Repeat corporate guest with airport pickup request.',
        ]);

        HotelBooking::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'room_id' => $rooms[1]->id,
            'reservation_code' => 'HTL-' . $businessId . '-002',
            'guest_name' => 'Chinedu Okafor',
            'guest_phone' => '+2348130001002',
            'guest_email' => 'chinedu.okafor@taska.local',
            'status' => 'reserved',
            'check_in_date' => today()->copy()->addDay(),
            'check_out_date' => today()->copy()->addDays(3),
            'actual_check_in_at' => null,
            'actual_check_out_at' => null,
            'adults' => 1,
            'extra_guests' => 1,
            'is_repeat_guest' => false,
            'payment_method' => 'card',
            'room_rate' => 42000,
            'extra_guest_charge_total' => 7000,
            'late_checkout_charge_total' => 0,
            'early_checkin_charge_total' => 0,
            'total_amount' => 91000,
            'amount_paid' => 30000,
            'notes' => 'Guest requested deluxe room with quiet corridor preference.',
        ]);

        HotelBooking::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'room_id' => $rooms[3]->id,
            'reservation_code' => 'HTL-' . $businessId . '-003',
            'guest_name' => 'Grace Yusuf',
            'guest_phone' => '+2348130001003',
            'guest_email' => 'grace.yusuf@taska.local',
            'status' => 'checked_out',
            'check_in_date' => today()->copy()->subDay(),
            'check_out_date' => today(),
            'actual_check_in_at' => now()->copy()->subDay()->setTime(15, 20),
            'actual_check_out_at' => now()->copy()->subHours(2),
            'adults' => 2,
            'extra_guests' => 0,
            'is_repeat_guest' => false,
            'payment_method' => 'cash',
            'room_rate' => 30000,
            'extra_guest_charge_total' => 0,
            'late_checkout_charge_total' => 0,
            'early_checkin_charge_total' => 0,
            'total_amount' => 30000,
            'amount_paid' => 30000,
            'notes' => 'Late morning checkout completed.',
        ]);

        HotelHousekeepingLog::create([
            'business_id' => $businessId,
            'room_id' => $rooms[3]->id,
            'assigned_to' => $userId,
            'status' => 'in_progress',
            'notes' => 'Checkout room turnover underway.',
            'logged_at' => now()->copy()->subHour(),
        ]);

        HotelHousekeepingLog::create([
            'business_id' => $businessId,
            'room_id' => $rooms[1]->id,
            'assigned_to' => $userId,
            'status' => 'inspected',
            'notes' => 'Room passed inspection for next arrival.',
            'logged_at' => now()->copy()->subHours(3),
        ]);

        HotelMaintenanceRequest::create([
            'business_id' => $businessId,
            'room_id' => $rooms[2]->id,
            'reported_by' => $userId,
            'title' => 'Bathroom plumbing leak',
            'details' => 'Guest shower line dripping into service duct.',
            'priority' => 'high',
            'status' => 'open',
            'resolved_at' => null,
        ]);

        HotelRoomInspectionLog::create([
            'business_id' => $businessId,
            'room_id' => $rooms[1]->id,
            'inspected_by' => $userId,
            'status' => 'pass',
            'notes' => 'Mini-bar and linen stock verified.',
            'inspected_at' => now()->copy()->subHours(2),
        ]);

        HotelStaffShiftLog::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'staff_id' => $userId,
            'staff_name' => 'Front Desk Lead',
            'shift_role' => 'front_desk',
            'started_at' => now()->copy()->subHours(6),
            'ended_at' => null,
            'notes' => 'Day shift covering check-ins and guest support.',
        ]);

        HotelStaffShiftLog::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'staff_id' => $userId,
            'staff_name' => 'Housekeeping Supervisor',
            'shift_role' => 'housekeeping',
            'started_at' => now()->copy()->subDay()->setTime(8, 0),
            'ended_at' => now()->copy()->subDay()->setTime(16, 0),
            'notes' => 'Previous shift closed after room turnover audit.',
        ]);
    }

    private function createDeliveryOpsData(
        int $businessId,
        int $branchId,
        int $userId
    ): void {
        $orderIds = DeliveryOrder::where('business_id', $businessId)->pluck('id');
        $manifestIds = DeliveryManifest::where('business_id', $businessId)->pluck('id');
        $vehicleIds = DeliveryVehicle::where('business_id', $businessId)->pluck('id');

        if ($orderIds->isNotEmpty()) {
            DB::table('delivery_manifest_items')->whereIn('delivery_order_id', $orderIds)->delete();
            DeliveryStatusEvent::whereIn('delivery_order_id', $orderIds)->delete();
            DeliverySettlement::whereIn('delivery_order_id', $orderIds)->delete();
            DeliveryWalletTransaction::whereIn('delivery_order_id', $orderIds)->delete();
            DeliveryComplaint::whereIn('delivery_order_id', $orderIds)->delete();
            DeliveryDispute::whereIn('delivery_order_id', $orderIds)->delete();
            DeliveryOrder::whereIn('id', $orderIds)->delete();
        }

        if ($manifestIds->isNotEmpty()) {
            DB::table('delivery_manifest_items')->whereIn('manifest_id', $manifestIds)->delete();
            DeliveryManifest::whereIn('id', $manifestIds)->delete();
        }

        if ($vehicleIds->isNotEmpty()) {
            DeliveryVehicle::whereIn('id', $vehicleIds)->delete();
        }

        DeliveryContact::where('business_id', $businessId)->delete();

        $bike = DeliveryVehicle::updateOrCreate(
            ['business_id' => $businessId, 'plate_number' => 'DLV-901-KSF'],
            [
                'branch_id' => $branchId,
                'assigned_user_id' => $userId,
                'vehicle_type' => 'motorbike',
                'ownership_model' => 'rider_owned',
                'owner_name' => 'Taska Rider Desk',
                'owner_details' => ['phone' => '+2348093001001'],
                'purchase_value' => 0,
                'fuel_responsibility' => 'rider',
                'maintenance_responsibility' => 'rider',
                'is_active' => true,
            ]
        );

        $tricycle = DeliveryVehicle::updateOrCreate(
            ['business_id' => $businessId, 'plate_number' => 'DLV-330-APP'],
            [
                'branch_id' => $branchId,
                'assigned_user_id' => $userId,
                'vehicle_type' => 'tricycle',
                'ownership_model' => 'investor_owned',
                'owner_name' => 'Kareem Logistics Investor',
                'owner_details' => ['phone' => '+2348093001002'],
                'purchase_value' => 4200000,
                'fuel_responsibility' => 'company',
                'maintenance_responsibility' => 'company',
                'is_active' => true,
            ]
        );

        $senderOne = DeliveryContact::create([
            'business_id' => $businessId,
            'name' => 'Amina Stores',
            'phone' => '+2348120000101',
            'email' => 'amina.stores@taska.local',
            'address' => '12 Allen Avenue, Ikeja',
            'landmark' => 'Opposite GTBank',
        ]);
        $recipientOne = DeliveryContact::create([
            'business_id' => $businessId,
            'name' => 'Tayo Ade',
            'phone' => '+2348120000201',
            'email' => 'tayo.ade@taska.local',
            'address' => '22 Admiralty Way, Lekki',
            'landmark' => 'Beside Circle Mall',
        ]);
        $senderTwo = DeliveryContact::create([
            'business_id' => $businessId,
            'name' => 'Metro Gadgets',
            'phone' => '+2348120000102',
            'email' => 'metro.gadgets@taska.local',
            'address' => '4 Awolowo Road, Ikoyi',
            'landmark' => 'Near Zenith Bank',
        ]);
        $recipientTwo = DeliveryContact::create([
            'business_id' => $businessId,
            'name' => 'Chioma N',
            'phone' => '+2348120000202',
            'email' => 'chioma.n@taska.local',
            'address' => '8 Bode Thomas, Surulere',
            'landmark' => 'By Stadium Bus Stop',
        ]);
        $senderThree = DeliveryContact::create([
            'business_id' => $businessId,
            'name' => 'RS Fashion Hub',
            'phone' => '+2348120000103',
            'email' => 'fashion.hub@taska.local',
            'address' => '19 Adeniran Ogunsanya, Surulere',
            'landmark' => 'Opposite Shoprite',
        ]);
        $recipientThree = DeliveryContact::create([
            'business_id' => $businessId,
            'name' => 'Ibrahim Musa',
            'phone' => '+2348120000203',
            'email' => 'ibrahim.musa@taska.local',
            'address' => '14 Yaba College Road, Yaba',
            'landmark' => 'Next to First Bank',
        ]);

        $orderOne = DeliveryOrder::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'pickup_branch_id' => $branchId,
            'dropoff_branch_id' => $branchId,
            'sender_contact_id' => $senderOne->id,
            'recipient_contact_id' => $recipientOne->id,
            'assigned_rider_id' => $userId,
            'vehicle_id' => $bike->id,
            'tracking_code' => 'DLV-' . $businessId . '-001',
            'delivery_otp_code' => '401221',
            'status' => 'delivered',
            'parcel_category' => 'Documents',
            'parcel_description' => 'Signed contract envelope',
            'pricing_model' => 'flat',
            'distance_km' => 18,
            'base_fee' => 4500,
            'distance_fee' => 1200,
            'urgent_fee' => 0,
            'total_fee' => 5700,
            'cod_amount' => 0,
            'amount_remitted' => 0,
            'is_urgent' => false,
            'pickup_address' => $senderOne->address,
            'dropoff_address' => $recipientOne->address,
            'picked_up_at' => now()->copy()->subHours(7),
            'delivered_at' => now()->copy()->subHours(5),
            'delivery_otp_verified_at' => now()->copy()->subHours(5),
            'created_offline' => false,
            'device_id' => null,
            'local_timestamp' => now()->copy()->subHours(8),
            'synced_at' => now()->copy()->subHours(8),
        ]);

        $orderTwo = DeliveryOrder::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'pickup_branch_id' => $branchId,
            'dropoff_branch_id' => $branchId,
            'sender_contact_id' => $senderTwo->id,
            'recipient_contact_id' => $recipientTwo->id,
            'assigned_rider_id' => $userId,
            'vehicle_id' => $tricycle->id,
            'tracking_code' => 'DLV-' . $businessId . '-002',
            'delivery_otp_code' => '552188',
            'status' => 'in_transit',
            'parcel_category' => 'Electronics',
            'parcel_description' => 'Two boxed smart watches',
            'pricing_model' => 'distance',
            'distance_km' => 26,
            'base_fee' => 5200,
            'distance_fee' => 1800,
            'urgent_fee' => 900,
            'total_fee' => 7900,
            'cod_amount' => 30000,
            'amount_remitted' => 10000,
            'is_urgent' => true,
            'pickup_address' => $senderTwo->address,
            'dropoff_address' => $recipientTwo->address,
            'picked_up_at' => now()->copy()->subHours(3),
            'created_offline' => false,
            'device_id' => null,
            'local_timestamp' => now()->copy()->subHours(4),
            'synced_at' => now()->copy()->subHours(4),
        ]);

        $orderThree = DeliveryOrder::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'pickup_branch_id' => $branchId,
            'dropoff_branch_id' => $branchId,
            'sender_contact_id' => $senderThree->id,
            'recipient_contact_id' => $recipientThree->id,
            'assigned_rider_id' => $userId,
            'vehicle_id' => $bike->id,
            'tracking_code' => 'DLV-' . $businessId . '-003',
            'delivery_otp_code' => '998144',
            'status' => 'rescheduled',
            'parcel_category' => 'Fashion',
            'parcel_description' => 'Customer return package',
            'pricing_model' => 'flat',
            'distance_km' => 11,
            'base_fee' => 3800,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 3800,
            'cod_amount' => 15000,
            'amount_remitted' => 0,
            'is_urgent' => false,
            'pickup_address' => $senderThree->address,
            'dropoff_address' => $recipientThree->address,
            'failed_delivery_reason' => 'Recipient requested next-day redelivery.',
            'rescheduled_for' => now()->copy()->addDay()->setTime(11, 0),
            'created_offline' => true,
            'device_id' => 'taska-rider-device-01',
            'local_timestamp' => now()->copy()->subDay(),
            'synced_at' => now()->copy()->subDay(),
        ]);

        $events = [
            [$orderOne, 'pending_pickup', now()->copy()->subHours(8), 'Delivery registered.'],
            [$orderOne, 'picked_up', now()->copy()->subHours(7), 'Parcel picked up from sender.'],
            [$orderOne, 'delivered', now()->copy()->subHours(5), 'Parcel delivered successfully.'],
            [$orderOne, 'otp_confirmed', now()->copy()->subHours(5), 'Delivery OTP verified successfully.'],
            [$orderOne, 'settlement_created', now()->copy()->subHours(4), 'Settlement prepared for delivery order.'],
            [$orderOne, 'settlement_paid', now()->copy()->subHours(3), 'Settlement marked as paid.'],
            [$orderTwo, 'pending_pickup', now()->copy()->subHours(4), 'Delivery registered.'],
            [$orderTwo, 'picked_up', now()->copy()->subHours(3), 'Parcel picked up from sender.'],
            [$orderTwo, 'remittance_recorded', now()->copy()->subHours(1), 'COD remittance updated. Outstanding balance: 20000.'],
            [$orderThree, 'pending_pickup', now()->copy()->subDay(), 'Delivery registered offline.'],
            [$orderThree, 'rescheduled', now()->copy()->subHours(10), 'Recipient requested next-day redelivery.'],
        ];

        foreach ($events as [$order, $status, $when, $notes]) {
            DeliveryStatusEvent::create([
                'business_id' => $businessId,
                'delivery_order_id' => $order->id,
                'created_by' => $userId,
                'status' => $status,
                'notes' => $notes,
                'proof_url' => null,
                'latitude' => null,
                'longitude' => null,
                'recorded_offline' => $order->created_offline,
                'device_id' => $order->device_id,
                'local_timestamp' => $when,
                'synced_at' => $when,
                'created_at' => $when,
                'updated_at' => $when,
            ]);
        }

        $manifest = DeliveryManifest::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'vehicle_id' => $tricycle->id,
            'rider_id' => $userId,
            'created_by' => $userId,
            'manifest_code' => 'MNF-' . $businessId . '-001',
            'title' => 'Lekki Afternoon Dispatch',
            'status' => 'dispatched',
            'dispatched_at' => now()->copy()->subHours(3),
            'notes' => 'Afternoon urgent and COD route bundle.',
        ]);
        $manifest->orders()->sync([$orderTwo->id, $orderThree->id]);

        DeliverySettlement::create([
            'business_id' => $businessId,
            'delivery_order_id' => $orderOne->id,
            'vehicle_id' => $bike->id,
            'rider_id' => $userId,
            'total_delivery_fee' => 5700,
            'rider_share' => 3420,
            'owner_share' => 0,
            'company_share' => 2280,
            'fuel_deduction' => 0,
            'maintenance_deduction' => 0,
            'net_rider_payout' => 3420,
            'net_owner_payout' => 0,
            'company_retained_earnings' => 2280,
            'status' => 'paid',
            'settled_at' => now()->copy()->subHours(3),
        ]);

        DeliverySettlement::create([
            'business_id' => $businessId,
            'delivery_order_id' => $orderTwo->id,
            'vehicle_id' => $tricycle->id,
            'rider_id' => $userId,
            'total_delivery_fee' => 7900,
            'rider_share' => 2765,
            'owner_share' => 1975,
            'company_share' => 3160,
            'fuel_deduction' => 395,
            'maintenance_deduction' => 237,
            'net_rider_payout' => 2133,
            'net_owner_payout' => 1975,
            'company_retained_earnings' => 3792,
            'status' => 'approved',
            'settled_at' => now()->copy()->subMinutes(45),
        ]);

        DeliveryWalletTransaction::create([
            'business_id' => $businessId,
            'delivery_order_id' => $orderOne->id,
            'rider_id' => $userId,
            'direction' => 'credit',
            'reference' => 'WALLET-DMO-001',
            'reason' => 'Delivery settlement payout',
            'amount' => 3420,
            'meta' => ['tracking_code' => $orderOne->tracking_code],
        ]);

        DeliveryComplaint::create([
            'business_id' => $businessId,
            'delivery_order_id' => $orderThree->id,
            'created_by' => $userId,
            'source' => 'customer',
            'category' => 'delay',
            'status' => 'open',
            'summary' => 'Recipient unhappy about delayed redelivery window.',
            'resolution_notes' => null,
            'resolved_at' => null,
        ]);

        DeliveryDispute::create([
            'business_id' => $businessId,
            'delivery_order_id' => $orderTwo->id,
            'created_by' => $userId,
            'category' => 'cod_shortfall',
            'status' => 'reviewing',
            'summary' => 'COD remittance incomplete compared with parcel invoice.',
            'resolution_notes' => null,
            'resolved_at' => null,
        ]);
    }

    private function createLogisticsOpsData(
        int $businessId,
        int $branchId,
        int $userId,
        Collection $customers
    ): void {
        $tripIds = LogisticsTripSheet::where('business_id', $businessId)->pluck('id');
        $assetIds = LogisticsFleetAsset::where('business_id', $businessId)->pluck('id');

        if ($tripIds->isNotEmpty()) {
            LogisticsTripStop::whereIn('trip_sheet_id', $tripIds)->delete();
            LogisticsFuelLog::whereIn('trip_sheet_id', $tripIds)->delete();
            LogisticsMaintenanceLog::whereIn('trip_sheet_id', $tripIds)->delete();
            LogisticsDriverSettlement::whereIn('trip_sheet_id', $tripIds)->delete();
            LogisticsTripSheet::whereIn('id', $tripIds)->delete();
        }

        if ($assetIds->isNotEmpty()) {
            LogisticsFuelLog::whereIn('fleet_asset_id', $assetIds)->delete();
            LogisticsMaintenanceLog::whereIn('fleet_asset_id', $assetIds)->delete();
            LogisticsFleetAsset::whereIn('id', $assetIds)->delete();
        }

        $truck = LogisticsFleetAsset::updateOrCreate(
            ['business_id' => $businessId, 'plate_number' => 'LGT-204-KJA'],
            [
                'branch_id' => $branchId,
                'assigned_driver_id' => $userId,
                'asset_type' => 'truck',
                'name' => 'Mercedes 814 Distribution Truck',
                'ownership_model' => 'company_owned',
                'capacity_unit' => 'tons',
                'capacity_value' => 8,
                'purchase_value' => 28500000,
                'target_km_per_litre' => 4.2,
                'status' => 'active',
                'fuel_responsibility' => 'company',
                'maintenance_responsibility' => 'company',
                'notes' => 'Primary intercity haulage asset for major customer runs.',
            ]
        );

        $van = LogisticsFleetAsset::updateOrCreate(
            ['business_id' => $businessId, 'plate_number' => 'LGT-118-APP'],
            [
                'branch_id' => $branchId,
                'assigned_driver_id' => $userId,
                'asset_type' => 'van',
                'name' => 'Toyota Hiace Dispatch Van',
                'ownership_model' => 'leased',
                'capacity_unit' => 'cartons',
                'capacity_value' => 220,
                'purchase_value' => 0,
                'target_km_per_litre' => 7.5,
                'status' => 'maintenance',
                'fuel_responsibility' => 'shared',
                'maintenance_responsibility' => 'company',
                'notes' => 'Secondary city-route van awaiting suspension service.',
            ]
        );

        $tripToday = LogisticsTripSheet::updateOrCreate(
            ['business_id' => $businessId, 'trip_code' => 'TRP-' . $businessId . '-DEMO1'],
            [
                'branch_id' => $branchId,
                'fleet_asset_id' => $truck->id,
                'driver_id' => $userId,
                'job_type' => 'haulage',
                'customer_name' => 'Prime Supply Hub',
                'route_name' => 'Lagos to Ibadan Distribution Run',
                'origin' => 'Lagos Warehouse',
                'destination' => 'Ibadan Trade Depot',
                'trip_date' => today()->toDateString(),
                'status' => 'in_transit',
                'expected_revenue' => 165000,
                'actual_revenue' => 165000,
                'distance_km' => 142,
                'expected_fuel_cost' => 38000,
                'actual_fuel_cost' => 35500,
                'loading_cost' => 8000,
                'driver_allowance' => 12000,
                'maintenance_cost' => 0,
                'other_cost' => 4500,
                'profit_estimate' => 105000,
                'payment_status' => 'partial',
                'notes' => 'Morning distribution run with one delayed customer stop.',
                'departed_at' => now()->copy()->subHours(5),
                'arrived_at' => null,
            ]
        );

        $tripYesterday = LogisticsTripSheet::updateOrCreate(
            ['business_id' => $businessId, 'trip_code' => 'TRP-' . $businessId . '-DEMO2'],
            [
                'branch_id' => $branchId,
                'fleet_asset_id' => $truck->id,
                'driver_id' => $userId,
                'job_type' => 'wholesale_delivery',
                'customer_name' => 'Metro Wholesale Partners',
                'route_name' => 'Lagos Island Multi-stop Route',
                'origin' => 'Lagos Warehouse',
                'destination' => 'Island Distribution Corridor',
                'trip_date' => now()->copy()->subDay()->toDateString(),
                'status' => 'completed',
                'expected_revenue' => 118000,
                'actual_revenue' => 121000,
                'distance_km' => 64,
                'expected_fuel_cost' => 18000,
                'actual_fuel_cost' => 17200,
                'loading_cost' => 6000,
                'driver_allowance' => 9000,
                'maintenance_cost' => 5500,
                'other_cost' => 2500,
                'profit_estimate' => 80800,
                'payment_status' => 'paid',
                'notes' => 'Completed city route with one maintenance intervention.',
                'departed_at' => now()->copy()->subDay()->setTime(8, 10),
                'arrived_at' => now()->copy()->subDay()->setTime(16, 35),
            ]
        );

        $stopDefinitions = [
            [
                'trip' => $tripToday,
                'customer' => optional($customers->get(0))->id,
                'stop_order' => 1,
                'stop_name' => 'Ibadan Main Market Drop',
                'location' => 'Dugbe, Ibadan',
                'status' => 'completed',
                'expected_revenue' => 85000,
                'actual_revenue' => 85000,
                'notes' => 'Delivered on time to anchor customer.',
                'arrived_at' => now()->copy()->subHours(3),
                'completed_at' => now()->copy()->subHours(2)->subMinutes(20),
            ],
            [
                'trip' => $tripToday,
                'customer' => optional($customers->get(1))->id,
                'stop_order' => 2,
                'stop_name' => 'Ring Road Stock Transfer',
                'location' => 'Ring Road, Ibadan',
                'status' => 'delayed',
                'expected_revenue' => 80000,
                'actual_revenue' => 80000,
                'notes' => 'Customer unloading bay opened late.',
                'arrived_at' => now()->copy()->subHour(),
                'completed_at' => null,
            ],
            [
                'trip' => $tripYesterday,
                'customer' => optional($customers->get(2))->id,
                'stop_order' => 1,
                'stop_name' => 'Marina Trade Stop',
                'location' => 'Marina, Lagos',
                'status' => 'completed',
                'expected_revenue' => 56000,
                'actual_revenue' => 58000,
                'notes' => 'Customer added extra cartons at stop.',
                'arrived_at' => now()->copy()->subDay()->setTime(10, 0),
                'completed_at' => now()->copy()->subDay()->setTime(10, 40),
            ],
            [
                'trip' => $tripYesterday,
                'customer' => optional($customers->get(3))->id,
                'stop_order' => 2,
                'stop_name' => 'Lekki Retail Corridor',
                'location' => 'Lekki Phase 1, Lagos',
                'status' => 'completed',
                'expected_revenue' => 62000,
                'actual_revenue' => 63000,
                'notes' => 'Final route stop completed without incident.',
                'arrived_at' => now()->copy()->subDay()->setTime(13, 15),
                'completed_at' => now()->copy()->subDay()->setTime(14, 5),
            ],
        ];

        foreach ($stopDefinitions as $stop) {
            LogisticsTripStop::updateOrCreate(
                [
                    'trip_sheet_id' => $stop['trip']->id,
                    'stop_order' => $stop['stop_order'],
                ],
                [
                    'customer_id' => $stop['customer'],
                    'stop_name' => $stop['stop_name'],
                    'location' => $stop['location'],
                    'status' => $stop['status'],
                    'expected_revenue' => $stop['expected_revenue'],
                    'actual_revenue' => $stop['actual_revenue'],
                    'notes' => $stop['notes'],
                    'arrived_at' => $stop['arrived_at'],
                    'completed_at' => $stop['completed_at'],
                ]
            );
        }

        LogisticsFuelLog::updateOrCreate(
            [
                'business_id' => $businessId,
                'trip_sheet_id' => $tripToday->id,
                'log_date' => today()->toDateString(),
            ],
            [
                'fleet_asset_id' => $truck->id,
                'recorded_by' => $userId,
                'litres' => 38,
                'unit_cost' => 934.21,
                'amount' => 35500,
                'odometer_km' => 124580,
                'source' => 'transfer',
                'notes' => 'Refuelled before Ibadan route departure.',
            ]
        );

        LogisticsFuelLog::updateOrCreate(
            [
                'business_id' => $businessId,
                'trip_sheet_id' => $tripYesterday->id,
                'log_date' => now()->copy()->subDay()->toDateString(),
            ],
            [
                'fleet_asset_id' => $truck->id,
                'recorded_by' => $userId,
                'litres' => 20,
                'unit_cost' => 860,
                'amount' => 17200,
                'odometer_km' => 124410,
                'source' => 'cash',
                'notes' => 'Top-up fuel for city route.',
            ]
        );

        LogisticsMaintenanceLog::updateOrCreate(
            [
                'business_id' => $businessId,
                'fleet_asset_id' => $van->id,
                'logged_on' => today()->toDateString(),
            ],
            [
                'trip_sheet_id' => null,
                'category' => 'suspension_service',
                'status' => 'open',
                'cost' => 14500,
                'summary' => 'Front suspension inspection and parts sourcing.',
                'notes' => 'Vehicle flagged during pre-dispatch check.',
            ]
        );

        LogisticsMaintenanceLog::updateOrCreate(
            [
                'business_id' => $businessId,
                'trip_sheet_id' => $tripYesterday->id,
                'logged_on' => now()->copy()->subDay()->toDateString(),
            ],
            [
                'fleet_asset_id' => $truck->id,
                'category' => 'tire_replacement',
                'status' => 'resolved',
                'cost' => 5500,
                'summary' => 'Emergency rear tire replacement after delivery run.',
                'notes' => 'Resolved same day before depot close.',
            ]
        );

        LogisticsDriverSettlement::updateOrCreate(
            ['trip_sheet_id' => $tripToday->id],
            [
                'business_id' => $businessId,
                'driver_id' => $userId,
                'gross_revenue' => 165000,
                'trip_cost' => 60000,
                'driver_payout' => 33000,
                'company_retained' => 72000,
                'fuel_deduction' => 0,
                'maintenance_deduction' => 0,
                'status' => 'approved',
                'settled_at' => now()->copy()->subMinutes(30),
            ]
        );

        LogisticsDriverSettlement::updateOrCreate(
            ['trip_sheet_id' => $tripYesterday->id],
            [
                'business_id' => $businessId,
                'driver_id' => $userId,
                'gross_revenue' => 121000,
                'trip_cost' => 40200,
                'driver_payout' => 24200,
                'company_retained' => 56600,
                'fuel_deduction' => 0,
                'maintenance_deduction' => 1500,
                'status' => 'paid',
                'settled_at' => now()->copy()->subDay()->setTime(18, 10),
            ]
        );
    }

    private function createProductionOpsData(
        int $businessId,
        int $branchId,
        int $userId,
        Collection $products
    ): void {
        if ($products->count() < 2) {
            return;
        }

        $materials = collect([
            [
                'name' => 'Filter Membrane',
                'sku' => 'RM-FILTER-001',
                'unit' => 'roll',
                'material_category' => 'treatment',
                'quantity' => 4,
                'cost_per_unit' => 12500,
                'reorder_level' => 3,
                'description' => 'Water treatment line filter membrane',
                'supplier_name' => 'Aqua Process Hub',
                'supplier_phone' => '+2348091002001',
                'supplier_balance' => 18000,
                'last_purchase_cost' => 12500,
                'low_stock_threshold' => 2,
            ],
            [
                'name' => 'Sachet Nylon Roll',
                'sku' => 'RM-SACHET-001',
                'unit' => 'roll',
                'material_category' => 'packaging',
                'quantity' => 9,
                'cost_per_unit' => 6800,
                'reorder_level' => 10,
                'description' => 'Primary sachet packaging material',
                'supplier_name' => 'PackRight Industries',
                'supplier_phone' => '+2348091002002',
                'supplier_balance' => 9500,
                'last_purchase_cost' => 6800,
                'low_stock_threshold' => 8,
            ],
            [
                'name' => 'Bottle Cap Carton',
                'sku' => 'RM-CAPS-001',
                'unit' => 'carton',
                'material_category' => 'packaging',
                'quantity' => 6,
                'cost_per_unit' => 9300,
                'reorder_level' => 6,
                'description' => 'Bottle cap consumables for 50cl line',
                'supplier_name' => 'PackRight Industries',
                'supplier_phone' => '+2348091002002',
                'supplier_balance' => 9500,
                'last_purchase_cost' => 9300,
                'low_stock_threshold' => 5,
            ],
            [
                'name' => 'Treatment Chemical',
                'sku' => 'RM-CHEM-001',
                'unit' => 'kg',
                'material_category' => 'treatment',
                'quantity' => 18,
                'cost_per_unit' => 2400,
                'reorder_level' => 10,
                'description' => 'Core treatment chemical input',
                'supplier_name' => 'Aqua Process Hub',
                'supplier_phone' => '+2348091002001',
                'supplier_balance' => 18000,
                'last_purchase_cost' => 2400,
                'low_stock_threshold' => 8,
            ],
        ])->map(function (array $material) use ($businessId) {
            return RawMaterial::updateOrCreate(
                ['business_id' => $businessId, 'sku' => $material['sku']],
                $material
            );
        });

        $purchaseDefinitions = [
            ['sku' => 'RM-SACHET-001', 'quantity' => 12, 'unit_cost' => 6700, 'amount_paid' => 60000, 'days_ago' => 2, 'notes' => 'Rush packaging restock before weekend deliveries'],
            ['sku' => 'RM-CHEM-001', 'quantity' => 20, 'unit_cost' => 2350, 'amount_paid' => 30000, 'days_ago' => 5, 'notes' => 'Treatment chemical refill for current cycle'],
            ['sku' => 'RM-CAPS-001', 'quantity' => 8, 'unit_cost' => 9200, 'amount_paid' => 50000, 'days_ago' => 9, 'notes' => 'Bottle cap stock for bottled line'],
        ];

        foreach ($purchaseDefinitions as $definition) {
            $material = $materials->firstWhere('sku', $definition['sku']);
            if (! $material) {
                continue;
            }

            $totalCost = $definition['quantity'] * $definition['unit_cost'];

            ProductionInputPurchase::updateOrCreate(
                [
                    'business_id' => $businessId,
                    'raw_material_id' => $material->id,
                    'purchased_at' => now()->copy()->subDays($definition['days_ago']),
                ],
                [
                    'branch_id' => $branchId,
                    'supplier_name' => $material->supplier_name,
                    'quantity' => $definition['quantity'],
                    'unit_cost' => $definition['unit_cost'],
                    'total_cost' => $totalCost,
                    'amount_paid' => $definition['amount_paid'],
                    'balance_due' => $totalCost - $definition['amount_paid'],
                    'notes' => $definition['notes'],
                ]
            );
        }

        $batchDefinitions = [
            [
                'batch_number' => 'PWF-BATCH-001',
                'production_date' => today()->toDateString(),
                'status' => 'completed',
                'total_input_quantity' => 44,
                'total_output_quantity' => 390,
                'damaged_quantity' => 8,
                'wastage_quantity' => 5,
                'notes' => 'Morning sachet run with minor sealing losses',
                'machine_runtime_hours' => 6.5,
                'downtime_minutes' => 40,
                'public_power_hours' => 3,
                'electricity_cost' => 10500,
                'generator_runtime_hours' => 2.5,
                'generator_fuel_cost' => 8400,
                'solar_backup_cost' => 0,
                'labour_cost' => 9500,
                'loading_cost' => 2800,
                'maintenance_allocation' => 1800,
                'packaging_cost_total' => 18400,
                'total_batch_cost' => 54200,
                'estimated_revenue' => 70200,
                'gross_margin' => 16000,
                'net_margin' => 11500,
                'cost_per_bag' => 139.0,
                'cost_per_sachet' => 13.9,
                'leakage_losses' => 3,
                'torn_sacks' => 2,
                'damaged_nylon' => 1,
            ],
            [
                'batch_number' => 'PWF-BATCH-002',
                'production_date' => now()->copy()->subDay()->toDateString(),
                'status' => 'completed',
                'total_input_quantity' => 38,
                'total_output_quantity' => 320,
                'damaged_quantity' => 4,
                'wastage_quantity' => 3,
                'notes' => 'Bottled water support run for distributor fulfillment',
                'machine_runtime_hours' => 5,
                'downtime_minutes' => 15,
                'public_power_hours' => 4,
                'electricity_cost' => 9200,
                'generator_runtime_hours' => 1,
                'generator_fuel_cost' => 3200,
                'solar_backup_cost' => 0,
                'labour_cost' => 7600,
                'loading_cost' => 2300,
                'maintenance_allocation' => 1500,
                'packaging_cost_total' => 14100,
                'total_batch_cost' => 43300,
                'estimated_revenue' => 60800,
                'gross_margin' => 17500,
                'net_margin' => 13200,
                'cost_per_bag' => 135.3,
                'cost_per_sachet' => 13.53,
                'leakage_losses' => 1,
                'torn_sacks' => 1,
                'damaged_nylon' => 1,
            ],
        ];

        foreach ($batchDefinitions as $definition) {
            $batch = ProductionBatch::updateOrCreate(
                ['business_id' => $businessId, 'batch_number' => $definition['batch_number']],
                array_merge($definition, [
                    'power_source_mix' => ['grid' => 60, 'generator' => 40],
                    'treatment_chemical_cost' => 4200,
                    'created_by' => $userId,
                ])
            );

            $nylon = $materials->firstWhere('sku', 'RM-SACHET-001');
            $chemical = $materials->firstWhere('sku', 'RM-CHEM-001');
            $caps = $materials->firstWhere('sku', 'RM-CAPS-001');

            foreach ([
                [$nylon, 6, 40800],
                [$chemical, 8, 19200],
                [$caps, 2, 18600],
            ] as [$material, $quantityUsed, $cost]) {
                if (! $material) {
                    continue;
                }

                ProductionMaterial::updateOrCreate(
                    ['production_batch_id' => $batch->id, 'raw_material_id' => $material->id],
                    ['quantity_used' => $quantityUsed, 'cost' => $cost]
                );
            }

            ProductionOutput::updateOrCreate(
                ['production_batch_id' => $batch->id, 'product_id' => $products[1]->id],
                [
                    'quantity_produced' => $definition['total_output_quantity'],
                    'damaged_quantity' => $definition['damaged_quantity'],
                    'selling_price' => $products[1]->selling_price,
                ]
            );

            ProductionEnergyLog::updateOrCreate(
                ['business_id' => $businessId, 'production_batch_id' => $batch->id, 'energy_source' => 'generator'],
                [
                    'branch_id' => $branchId,
                    'runtime_hours' => $definition['generator_runtime_hours'],
                    'cost' => $definition['generator_fuel_cost'],
                    'fuel_litres' => 14,
                    'outage_minutes' => $definition['downtime_minutes'],
                    'notes' => 'Backup generator support during unstable grid window',
                    'logged_at' => now()->copy()->setTime(14, 0),
                ]
            );

            ProductionEnergyLog::updateOrCreate(
                ['business_id' => $businessId, 'production_batch_id' => $batch->id, 'energy_source' => 'grid'],
                [
                    'branch_id' => $branchId,
                    'runtime_hours' => $definition['public_power_hours'],
                    'cost' => $definition['electricity_cost'],
                    'fuel_litres' => 0,
                    'outage_minutes' => 0,
                    'notes' => 'Public power usage during production run',
                    'logged_at' => now()->copy()->setTime(11, 0),
                ]
            );

            if ($chemical) {
                ProductionWastageLog::updateOrCreate(
                    ['business_id' => $businessId, 'production_batch_id' => $batch->id, 'raw_material_id' => $chemical->id],
                    [
                        'loss_type' => 'leakage',
                        'quantity' => $definition['leakage_losses'],
                        'estimated_cost' => 1200,
                        'notes' => 'Measured treatment and sealing loss during batch run',
                        'logged_at' => now()->copy()->subHours(2),
                    ]
                );
            }
        }
    }

    private function createRestaurantOpsData(
        int $businessId,
        int $branchId,
        int $userId,
        Collection $customers,
        Collection $products
    ): void {
        if ($products->count() < 3) {
            return;
        }

        $tableIds = RestaurantTable::where('business_id', $businessId)->pluck('id');
        $shiftIds = RestaurantWaiterShift::where('business_id', $businessId)->pluck('id');
        $ticketIds = RestaurantTicket::where('business_id', $businessId)->pluck('id');
        $recipeIds = RecipeCard::where('business_id', $businessId)->pluck('id');

        if ($ticketIds->isNotEmpty()) {
            RestaurantTicketItem::whereIn('restaurant_ticket_id', $ticketIds)->delete();
            KitchenTicket::whereIn('restaurant_ticket_id', $ticketIds)->delete();
            RestaurantTicket::whereIn('id', $ticketIds)->delete();
        }

        if ($recipeIds->isNotEmpty()) {
            RecipeIngredient::whereIn('recipe_card_id', $recipeIds)->delete();
            RecipeCard::whereIn('id', $recipeIds)->delete();
        }

        if ($tableIds->isNotEmpty()) {
            TableReservation::whereIn('table_id', $tableIds)->delete();
            FoodWasteLog::whereIn('product_id', $products->pluck('id'))->where('business_id', $businessId)->delete();
            RestaurantTable::whereIn('id', $tableIds)->delete();
        }

        if ($shiftIds->isNotEmpty()) {
            RestaurantWaiterShift::whereIn('id', $shiftIds)->delete();
        }

        $tables = collect([
            ['name' => 'Table 1', 'zone' => 'Main Hall', 'seats' => 4, 'status' => 'occupied', 'notes' => 'Lunch service hotspot'],
            ['name' => 'Table 2', 'zone' => 'Main Hall', 'seats' => 2, 'status' => 'available', 'notes' => 'Quick turnover seating'],
            ['name' => 'Table 3', 'zone' => 'Patio', 'seats' => 6, 'status' => 'reserved', 'notes' => 'Family reservation zone'],
            ['name' => 'Table 4', 'zone' => 'VIP Corner', 'seats' => 4, 'status' => 'available', 'notes' => 'Premium guests'],
        ])->map(function (array $table) use ($businessId, $branchId) {
            return RestaurantTable::updateOrCreate(
                ['business_id' => $businessId, 'name' => $table['name']],
                array_merge($table, ['branch_id' => $branchId])
            );
        });

        $openShift = RestaurantWaiterShift::updateOrCreate(
            ['business_id' => $businessId, 'shift_code' => 'REST-SHIFT-OPEN'],
            [
                'branch_id' => $branchId,
                'staff_id' => $userId,
                'staff_name' => 'Main Floor Captain',
                'status' => 'open',
                'orders_handled' => 6,
                'cash_variance' => 0,
                'started_at' => now()->copy()->subHours(4),
                'ended_at' => null,
                'notes' => 'Demo lunch shift in progress',
            ]
        );

        RestaurantWaiterShift::updateOrCreate(
            ['business_id' => $businessId, 'shift_code' => 'REST-SHIFT-CLOSED'],
            [
                'branch_id' => $branchId,
                'staff_id' => $userId,
                'staff_name' => 'Evening Supervisor',
                'status' => 'closed',
                'orders_handled' => 11,
                'cash_variance' => 500,
                'started_at' => now()->copy()->subDay()->setTime(16, 0),
                'ended_at' => now()->copy()->subDay()->setTime(22, 30),
                'notes' => 'Previous dinner shift closed',
            ]
        );

        TableReservation::updateOrCreate(
            ['business_id' => $businessId, 'guest_name' => 'Aisha Musa', 'reservation_for' => now()->copy()->addHours(2)],
            [
                'branch_id' => $branchId,
                'table_id' => optional($tables->firstWhere('name', 'Table 3'))->id,
                'guest_phone' => '+2348012345678',
                'party_size' => 5,
                'status' => 'reserved',
                'occasion' => 'Birthday dinner',
                'notes' => 'Guest requested patio seating',
            ]
        );

        $recipe = RecipeCard::updateOrCreate(
            ['business_id' => $businessId, 'product_id' => $products[0]->id],
            [
                'yield_quantity' => 1,
                'prep_station' => 'Hot Kitchen',
                'estimated_cost' => 1200,
                'is_active' => true,
                'notes' => 'Demo recipe costing card',
            ]
        );

        RecipeIngredient::updateOrCreate(
            ['business_id' => $businessId, 'recipe_card_id' => $recipe->id, 'ingredient_product_id' => $products[2]->id],
            ['quantity' => 1, 'unit_cost' => 180, 'notes' => 'Beverage side add-on']
        );

        RecipeIngredient::updateOrCreate(
            ['business_id' => $businessId, 'recipe_card_id' => $recipe->id, 'ingredient_product_id' => $products[5]->id],
            ['quantity' => 1, 'unit_cost' => 120, 'notes' => 'Packaging component']
        );

        $openTicket = RestaurantTicket::updateOrCreate(
            ['business_id' => $businessId, 'ticket_number' => 'REST-TKT-001'],
            [
                'branch_id' => $branchId,
                'table_id' => optional($tables->firstWhere('name', 'Table 1'))->id,
                'customer_id' => optional($customers->get(0))->id,
                'waiter_shift_id' => $openShift->id,
                'order_channel' => 'dine_in',
                'service_status' => 'preparing',
                'payment_status' => 'pending',
                'guest_name' => 'Walk-in Lunch Guest',
                'split_count' => 1,
                'subtotal' => 4100,
                'service_charge' => 200,
                'delivery_fee' => 0,
                'total' => 4300,
                'amount_paid' => 0,
                'recipe_cost_total' => 1680,
                'gross_margin' => 2420,
                'waste_cost_total' => 0,
                'opened_at' => now()->copy()->subMinutes(35),
                'closed_at' => null,
                'notes' => 'Deployment demo restaurant ticket',
            ]
        );

        $closedTicket = RestaurantTicket::updateOrCreate(
            ['business_id' => $businessId, 'ticket_number' => 'REST-TKT-002'],
            [
                'branch_id' => $branchId,
                'table_id' => optional($tables->firstWhere('name', 'Table 3'))->id,
                'customer_id' => optional($customers->get(1))->id,
                'waiter_shift_id' => $openShift->id,
                'order_channel' => 'takeaway',
                'service_status' => 'served',
                'payment_status' => 'paid',
                'guest_name' => 'Evening Pickup Guest',
                'split_count' => 1,
                'subtotal' => 5900,
                'service_charge' => 300,
                'delivery_fee' => 0,
                'total' => 6200,
                'amount_paid' => 6200,
                'recipe_cost_total' => 2480,
                'gross_margin' => 3720,
                'waste_cost_total' => 250,
                'opened_at' => now()->copy()->subHours(5),
                'closed_at' => now()->copy()->subHours(4),
                'notes' => 'Deployment demo restaurant ticket',
            ]
        );

        RestaurantTicketItem::updateOrCreate(
            ['business_id' => $businessId, 'restaurant_ticket_id' => $openTicket->id, 'product_id' => $products[0]->id],
            ['course_name' => 'Main', 'quantity' => 1, 'unit_price' => 2500, 'recipe_cost' => 1200, 'service_status' => 'preparing', 'notes' => 'Priority lunch plate']
        );
        RestaurantTicketItem::updateOrCreate(
            ['business_id' => $businessId, 'restaurant_ticket_id' => $openTicket->id, 'product_id' => $products[3]->id],
            ['course_name' => 'Drink', 'quantity' => 1, 'unit_price' => 1600, 'recipe_cost' => 480, 'service_status' => 'queued', 'notes' => 'Fresh juice pairing']
        );
        RestaurantTicketItem::updateOrCreate(
            ['business_id' => $businessId, 'restaurant_ticket_id' => $closedTicket->id, 'product_id' => $products[4]->id],
            ['course_name' => 'Main', 'quantity' => 1, 'unit_price' => 5500, 'recipe_cost' => 2200, 'service_status' => 'served', 'notes' => 'High-margin dinner combo']
        );
        RestaurantTicketItem::updateOrCreate(
            ['business_id' => $businessId, 'restaurant_ticket_id' => $closedTicket->id, 'product_id' => $products[2]->id],
            ['course_name' => 'Drink', 'quantity' => 1, 'unit_price' => 400, 'recipe_cost' => 180, 'service_status' => 'served', 'notes' => 'Bottle water add-on']
        );

        KitchenTicket::updateOrCreate(
            ['business_id' => $businessId, 'restaurant_ticket_id' => $openTicket->id],
            [
                'status' => 'preparing',
                'priority' => 'urgent',
                'station' => 'Hot Kitchen',
                'fired_at' => now()->copy()->subMinutes(30),
                'ready_at' => null,
                'served_at' => null,
                'notes' => 'Rush lunch order',
            ]
        );

        FoodWasteLog::updateOrCreate(
            ['business_id' => $businessId, 'product_id' => $products[5]->id, 'logged_at' => now()->copy()->subHours(1)],
            [
                'branch_id' => $branchId,
                'recipe_card_id' => $recipe->id,
                'quantity' => 2,
                'cost_impact' => 250,
                'waste_type' => 'kitchen_loss',
                'notes' => 'Two takeaway packs damaged during prep',
            ]
        );
    }

    private function createDemoInsights(int $businessId, string $type, string $businessName): void
    {
        $insights = [
            [
                'type' => "demo_cash_{$type}",
                'severity' => 'warning',
                'title' => 'Collections need owner attention',
                'description' => "A few receivables are ageing and could slow cash velocity in {$businessName}.",
                'recommendation' => 'Call the top two debtors today and lock in repayment dates before issuing fresh credit.',
                'is_read' => false,
            ],
            [
                'type' => "demo_stock_{$type}",
                'severity' => 'critical',
                'title' => 'Fast-moving stock cover is getting thin',
                'description' => "Your demo stock mix shows at least one fast mover close to reorder level for {$businessName}.",
                'recommendation' => 'Raise replenishment for the top seller and rebalance shelf stock before the next sales rush.',
                'is_read' => false,
            ],
            [
                'type' => "demo_operations_{$type}",
                'severity' => 'info',
                'title' => 'Operations can be tightened this week',
                'description' => "There is room to improve execution rhythm across the main branch for {$businessName}.",
                'recommendation' => 'Review staff handoff quality, daily close routines, and one operational bottleneck before noon.',
                'is_read' => true,
            ],
            [
                'type' => "demo_risk_{$type}",
                'severity' => 'warning',
                'title' => 'Owner control checks should be refreshed',
                'description' => "A light risk review will make the {$businessName} demo feel more realistic and explainable.",
                'recommendation' => 'Check one loss-prone area today and confirm the control owner, evidence trail, and next action.',
                'is_read' => false,
            ],
        ];

        foreach ($insights as $index => $payload) {
            $moment = now()->subHours(6 - $index);

            AiInsight::updateOrCreate(
                ['business_id' => $businessId, 'type' => $payload['type']],
                [
                    'severity' => $payload['severity'],
                    'title' => $payload['title'],
                    'description' => $payload['description'],
                    'recommendation' => $payload['recommendation'],
                    'data' => [
                        'demo' => true,
                        'business_type' => $type,
                    ],
                    'is_read' => $payload['is_read'],
                    'is_dismissed' => false,
                    'created_at' => $moment,
                    'updated_at' => $moment,
                ]
            );
        }
    }

    private function productBlueprints(string $type): array
    {
        return match ($type) {
            'pharmacy' => [
                ['name' => 'Paracetamol 500mg Generic', 'description' => 'Fast-moving pain relief pack', 'cost_price' => 800, 'selling_price' => 1200, 'low_stock_alert' => 12, 'quantity' => 9, 'reserved_quantity' => 1, 'track_expiry' => true, 'medicine_type' => 'tablet', 'allow_substitution' => true, 'refill_cycle_days' => 30, 'pharmacy_category' => 'analgesic', 'default_expiry_months' => 24],
                ['name' => 'Paracetamol 500mg Brand', 'description' => 'Premium analgesic brand line', 'cost_price' => 2200, 'selling_price' => 3100, 'low_stock_alert' => 10, 'quantity' => 7, 'reserved_quantity' => 0, 'track_expiry' => true, 'medicine_type' => 'tablet', 'allow_substitution' => true, 'pharmacy_category' => 'analgesic', 'default_expiry_months' => 24],
                ['name' => 'Vitamin C Syrup', 'description' => 'Child wellness syrup', 'cost_price' => 1450, 'selling_price' => 2100, 'low_stock_alert' => 8, 'quantity' => 14, 'reserved_quantity' => 1, 'track_expiry' => true, 'medicine_type' => 'syrup', 'refill_cycle_days' => 21, 'pharmacy_category' => 'supplement', 'default_expiry_months' => 18],
                ['name' => 'Amoxicillin Capsules', 'description' => 'Prescription antibiotic line', 'cost_price' => 3200, 'selling_price' => 4500, 'low_stock_alert' => 6, 'quantity' => 5, 'reserved_quantity' => 0, 'track_expiry' => true, 'is_prescription_required' => true, 'medicine_type' => 'capsule', 'pharmacy_category' => 'antibiotic', 'default_expiry_months' => 24],
                ['name' => 'Tramadol 50mg', 'description' => 'Controlled pain management stock', 'cost_price' => 4100, 'selling_price' => 6200, 'low_stock_alert' => 5, 'quantity' => 6, 'reserved_quantity' => 1, 'track_expiry' => true, 'is_prescription_required' => true, 'medicine_type' => 'capsule', 'is_controlled_drug' => true, 'pharmacy_category' => 'controlled', 'default_expiry_months' => 24],
                ['name' => 'Cough Mixture', 'description' => 'General cough relief', 'cost_price' => 900, 'selling_price' => 1500, 'low_stock_alert' => 10, 'quantity' => 18, 'reserved_quantity' => 2, 'track_expiry' => true, 'medicine_type' => 'syrup', 'refill_cycle_days' => 14, 'pharmacy_category' => 'respiratory', 'default_expiry_months' => 18],
            ],
            'hotel' => [
                ['name' => 'Room Service Tray', 'description' => 'Hospitality room supply item', 'cost_price' => 4500, 'selling_price' => 7000, 'low_stock_alert' => 4, 'quantity' => 6, 'reserved_quantity' => 0],
                ['name' => 'Guest Toiletries Pack', 'description' => 'Daily guest amenity set', 'cost_price' => 1200, 'selling_price' => 2500, 'low_stock_alert' => 12, 'quantity' => 11, 'reserved_quantity' => 2],
                ['name' => 'Laundry Service Tag', 'description' => 'Operational consumable', 'cost_price' => 300, 'selling_price' => 800, 'low_stock_alert' => 20, 'quantity' => 25, 'reserved_quantity' => 0],
                ['name' => 'Mini Bar Combo', 'description' => 'In-room refreshment bundle', 'cost_price' => 3500, 'selling_price' => 6500, 'low_stock_alert' => 8, 'quantity' => 10, 'reserved_quantity' => 1],
                ['name' => 'Bedding Refresh Kit', 'description' => 'Housekeeping replacement stock', 'cost_price' => 5200, 'selling_price' => 9000, 'low_stock_alert' => 5, 'quantity' => 4, 'reserved_quantity' => 0],
                ['name' => 'Conference Water Pack', 'description' => 'Meeting room hospitality bundle', 'cost_price' => 1800, 'selling_price' => 3200, 'low_stock_alert' => 10, 'quantity' => 15, 'reserved_quantity' => 1],
            ],
            'restaurant' => [
                ['name' => 'Jollof Rice Plate', 'description' => 'Best-selling lunch item', 'cost_price' => 1200, 'selling_price' => 2500, 'low_stock_alert' => 8, 'quantity' => 7, 'reserved_quantity' => 1],
                ['name' => 'Chicken Pepper Soup', 'description' => 'Evening menu line', 'cost_price' => 1600, 'selling_price' => 3200, 'low_stock_alert' => 6, 'quantity' => 9, 'reserved_quantity' => 1],
                ['name' => 'Bottle Water', 'description' => 'Quick add-on beverage', 'cost_price' => 180, 'selling_price' => 400, 'low_stock_alert' => 24, 'quantity' => 30, 'reserved_quantity' => 0],
                ['name' => 'Fresh Juice', 'description' => 'Premium beverage option', 'cost_price' => 600, 'selling_price' => 1600, 'low_stock_alert' => 10, 'quantity' => 12, 'reserved_quantity' => 0],
                ['name' => 'Grilled Fish Combo', 'description' => 'High-margin dinner meal', 'cost_price' => 2800, 'selling_price' => 5500, 'low_stock_alert' => 4, 'quantity' => 5, 'reserved_quantity' => 0],
                ['name' => 'Takeaway Pack', 'description' => 'Packaging consumable', 'cost_price' => 120, 'selling_price' => 350, 'low_stock_alert' => 40, 'quantity' => 38, 'reserved_quantity' => 4],
            ],
            'pure_water_factory', 'pure_water_retail' => [
                ['name' => '50cl Bottled Water', 'description' => 'Core bottled SKU', 'cost_price' => 120, 'selling_price' => 250, 'low_stock_alert' => 40, 'quantity' => 35, 'reserved_quantity' => 3],
                ['name' => 'Sachet Water Bag', 'description' => 'Fast-moving sachet stock', 'cost_price' => 90, 'selling_price' => 180, 'low_stock_alert' => 50, 'quantity' => 48, 'reserved_quantity' => 5],
                ['name' => 'Bottle Crate', 'description' => 'Reusable crate movement unit', 'cost_price' => 2800, 'selling_price' => 3800, 'low_stock_alert' => 10, 'quantity' => 9, 'reserved_quantity' => 1],
                ['name' => 'Shrink Wrap Pack', 'description' => 'Packaging support stock', 'cost_price' => 550, 'selling_price' => 900, 'low_stock_alert' => 20, 'quantity' => 22, 'reserved_quantity' => 0],
                ['name' => 'Factory Label Roll', 'description' => 'Branding consumable', 'cost_price' => 950, 'selling_price' => 1500, 'low_stock_alert' => 12, 'quantity' => 8, 'reserved_quantity' => 0],
                ['name' => 'Dispenser Water Jar', 'description' => 'Higher-ticket water package', 'cost_price' => 700, 'selling_price' => 1400, 'low_stock_alert' => 18, 'quantity' => 24, 'reserved_quantity' => 2],
            ],
            default => [
                ['name' => 'Core Product A', 'description' => 'Reliable fast-moving stock line', 'cost_price' => 1500, 'selling_price' => 2600, 'low_stock_alert' => 10, 'quantity' => 8, 'reserved_quantity' => 1],
                ['name' => 'Core Product B', 'description' => 'Second fastest item in the demo mix', 'cost_price' => 2200, 'selling_price' => 3600, 'low_stock_alert' => 8, 'quantity' => 14, 'reserved_quantity' => 1],
                ['name' => 'Core Product C', 'description' => 'Stable seller with healthy margin', 'cost_price' => 900, 'selling_price' => 1700, 'low_stock_alert' => 15, 'quantity' => 20, 'reserved_quantity' => 0],
                ['name' => 'Core Product D', 'description' => 'Upsell or add-on line', 'cost_price' => 650, 'selling_price' => 1200, 'low_stock_alert' => 18, 'quantity' => 16, 'reserved_quantity' => 2],
                ['name' => 'Core Product E', 'description' => 'Owner decision support product', 'cost_price' => 3000, 'selling_price' => 4700, 'low_stock_alert' => 6, 'quantity' => 5, 'reserved_quantity' => 0],
                ['name' => 'Core Product F', 'description' => 'Consistent conversion item', 'cost_price' => 1100, 'selling_price' => 2100, 'low_stock_alert' => 10, 'quantity' => 13, 'reserved_quantity' => 1],
            ],
        };
    }

    private function createAdmin(): void
    {
        $account = config('business_types.demo_accounts.admin', []);

        User::updateOrCreate(
            ['email' => $account['email'] ?? 'admin@taska.local'],
            [
                'name' => $account['name'] ?? 'Taska Admin',
                'password' => Hash::make('password123'),
                'phone' => '+2348000000000',
                'role' => 'admin',
                'is_active' => true,
            ]
        );
    }

    private function syncRolePermissions(Role $role): void
    {
        $permissionIds = match ($role->slug) {
            'admin', 'support_admin' => Permission::pluck('id')->all(),
            'manager' => Permission::whereIn('module', ['dashboard', 'branches', 'warehouses', 'products', 'inventory', 'sales', 'purchases', 'crm', 'suppliers', 'reports', 'settings'])->pluck('id')->all(),
            'cashier' => Permission::whereIn('module', ['dashboard', 'sales', 'crm'])->pluck('id')->all(),
            'accountant' => Permission::whereIn('module', ['dashboard', 'sales', 'expenses', 'reports', 'settings'])->pluck('id')->all(),
            'inventory_officer' => Permission::whereIn('module', ['dashboard', 'products', 'inventory', 'purchases', 'suppliers'])->pluck('id')->all(),
            'receptionist' => Permission::whereIn('module', ['dashboard', 'crm'])->pluck('id')->all(),
            default => Permission::whereIn('module', ['dashboard'])->pluck('id')->all(),
        };

        $role->permissions()->syncWithoutDetaching($permissionIds);
    }
}
