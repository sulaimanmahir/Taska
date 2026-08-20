<?php

namespace App\Services;

use App\Models\ConstructionCreditAccount;
use App\Models\ConstructionCreditPayment;
use App\Models\ConstructionCustomerProfile;
use App\Models\ConstructionDelivery;
use App\Models\ConstructionPriceChange;
use App\Models\ConstructionProductProfile;
use App\Models\ConstructionQuotation;
use App\Models\ConstructionQuotationItem;
use App\Models\ConstructionStockTransfer;
use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\UnitOfMeasure;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ConstructionMaterialsService
{
    public function __construct(
        private OrderService $orderService,
    ) {
    }

    public function ensureSetup(int $businessId, ?int $branchId = null): void
    {
        $categories = [
            'Cement & Binding Materials',
            'Steel / Metal Materials',
            'Fencing / Security Materials',
            'Roofing Materials',
            'Plumbing Materials',
            'Electrical Materials',
            'Paint / Finishing Materials',
            'Tiles / Flooring / Interior',
            'Blocks / Sand / Bulk Materials',
            'Timber / Wood / Carpentry',
            'Glass / Aluminium / Windows',
            'Doors / Security Doors',
            'Tools / Equipment',
            'Water Systems / Borehole',
            'Sanitary / Bathroom',
            'Fasteners / Accessories',
            'Generators / Solar / Power',
            'Welding / Fabrication',
            'Construction Chemicals',
            'Safety / PPE',
            'Site Consumables',
        ];

        foreach ($categories as $categoryName) {
            ProductCategory::firstOrCreate(
                ['business_id' => $businessId, 'slug' => Str::slug($categoryName)],
                ['name' => $categoryName]
            );
        }

        $hasDefaultWarehouse = Warehouse::where('business_id', $businessId)->where('is_default', true)->exists();

        $warehouseSeed = [
            ['name' => 'Main Warehouse', 'slug' => 'main-warehouse', 'is_default' => true],
            ['name' => 'Shop Floor', 'slug' => 'shop-floor', 'is_default' => false],
            ['name' => 'Open Yard', 'slug' => 'open-yard', 'is_default' => false],
        ];

        foreach ($warehouseSeed as $warehouseData) {
            Warehouse::firstOrCreate(
                ['business_id' => $businessId, 'slug' => $warehouseData['slug']],
                [
                    'branch_id' => $branchId,
                    'name' => $warehouseData['name'],
                    'description' => $warehouseData['name'] . ' for building materials operations',
                    // Only mark this seeded warehouse as the default when the business
                    // doesn't already have one (e.g. from onboarding) - otherwise two
                    // is_default=true rows make defaultWarehouseId() ambiguous.
                    'is_default' => $warehouseData['is_default'] && !$hasDefaultWarehouse,
                    'is_active' => true,
                ]
            );
        }

        $units = [
            ['name' => 'Bag', 'abbreviation' => 'bag', 'conversion_factor' => 1, 'is_base' => true],
            ['name' => 'Piece', 'abbreviation' => 'pc', 'conversion_factor' => 1, 'is_base' => true],
            ['name' => 'Bundle', 'abbreviation' => 'bdl', 'conversion_factor' => 1, 'is_base' => true],
            ['name' => 'Roll', 'abbreviation' => 'roll', 'conversion_factor' => 1, 'is_base' => true],
            ['name' => 'Carton', 'abbreviation' => 'ctn', 'conversion_factor' => 1, 'is_base' => true],
            ['name' => 'Kilogram', 'abbreviation' => 'kg', 'conversion_factor' => 1, 'is_base' => true],
            ['name' => 'Ton', 'abbreviation' => 'ton', 'conversion_factor' => 1000, 'is_base' => false],
            ['name' => 'Meter', 'abbreviation' => 'm', 'conversion_factor' => 1, 'is_base' => true],
            ['name' => 'Foot', 'abbreviation' => 'ft', 'conversion_factor' => 0.3048, 'is_base' => false],
            ['name' => 'Truck Load', 'abbreviation' => 'truck', 'conversion_factor' => 1, 'is_base' => true],
            ['name' => 'Tipper Load', 'abbreviation' => 'tipper', 'conversion_factor' => 1, 'is_base' => true],
        ];

        $baseUnits = [];
        foreach ($units as $unitData) {
            $unit = UnitOfMeasure::firstOrCreate(
                ['business_id' => $businessId, 'abbreviation' => $unitData['abbreviation']],
                [
                    'name' => $unitData['name'],
                    'conversion_factor' => $unitData['conversion_factor'],
                    'is_base' => $unitData['is_base'],
                ]
            );
            $baseUnits[$unit->abbreviation] = $unit;
        }

        $this->setBaseUnit($businessId, 'ton', $baseUnits['kg']->id ?? null);
        $this->setBaseUnit($businessId, 'ft', $baseUnits['m']->id ?? null);
    }

    public function overview(int $businessId, ?int $branchId = null): array
    {
        $this->ensureSetup($businessId, $branchId);

        $today = today()->toDateString();
        $startOfMonth = now()->startOfMonth();

        $summary = [
            'today_sales' => (float) Order::where('business_id', $businessId)->whereDate('created_at', $today)->sum('total'),
            'outstanding_debts' => (float) ConstructionCreditAccount::where('business_id', $businessId)->sum('outstanding_amount'),
            'pending_deliveries' => ConstructionDelivery::where('business_id', $businessId)->whereNotIn('status', ['delivered', 'cancelled'])->count(),
            'quotations_pending' => ConstructionQuotation::where('business_id', $businessId)->whereIn('status', ['draft', 'sent'])->count(),
            'monthly_profit_estimate' => $this->estimateMonthlyProfit($businessId, $startOfMonth),
        ];

        $summary['low_cement_stock'] = $this->lowStockByCategory($businessId, 'cement-binding-materials');
        $summary['low_rod_stock'] = Product::query()
            ->join('inventory_items', 'inventory_items.product_id', '=', 'products.id')
            ->where('products.business_id', $businessId)
            ->where('products.name', 'like', 'Iron Rod%')
            ->whereColumn('inventory_items.quantity', '<=', 'inventory_items.reorder_point')
            ->count();

        $topContractor = Order::query()
            ->select('customers.name')
            ->join('customers', 'customers.id', '=', 'orders.customer_id')
            ->where('orders.business_id', $businessId)
            ->groupBy('customers.name')
            ->selectRaw('SUM(orders.total) as revenue')
            ->orderByDesc('revenue')
            ->first();

        return [
            'summary' => array_merge($summary, [
                'top_contractor' => $topContractor?->name,
            ]),
            'categories' => ProductCategory::where('business_id', $businessId)->orderBy('name')->get(),
            'items' => $this->catalog($businessId),
            'contractors' => $this->customers($businessId),
            'quotations' => $this->quotations($businessId),
            'deliveries' => $this->deliveries($businessId),
            'credits' => $this->credits($businessId),
            'price_changes' => $this->priceChanges($businessId),
            'transfers' => $this->transfers($businessId),
            'warehouses' => Warehouse::where('business_id', $businessId)->orderBy('name')->get(),
            'units' => UnitOfMeasure::where('business_id', $businessId)->orderBy('name')->get(),
        ];
    }

    public function catalog(int $businessId): Collection
    {
        return Product::query()
            ->where('products.business_id', $businessId)
            ->leftJoin('construction_product_profiles as cpp', function ($join) use ($businessId) {
                $join->on('cpp.product_id', '=', 'products.id')
                    ->where('cpp.business_id', '=', $businessId);
            })
            ->leftJoin('inventory_items as ii', function ($join) use ($businessId) {
                $join->on('ii.product_id', '=', 'products.id')
                    ->where('ii.business_id', '=', $businessId);
            })
            ->leftJoin('product_categories as pc', 'pc.id', '=', 'products.category_id')
            ->selectRaw("
                products.*,
                pc.name as category_name,
                cpp.brand,
                cpp.subcategory,
                cpp.unit_type,
                cpp.wholesale_price,
                cpp.contractor_price,
                cpp.stock_location_type,
                COALESCE(SUM(ii.quantity), 0) as quantity_on_hand
            ")
            ->groupBy('products.id', 'pc.name', 'cpp.brand', 'cpp.subcategory', 'cpp.unit_type', 'cpp.wholesale_price', 'cpp.contractor_price', 'cpp.stock_location_type')
            ->orderBy('products.name')
            ->get();
    }

    public function createItem(array $payload, User $user): Product
    {
        $this->ensureSetup($user->current_business_id, $user->current_branch_id);

        return DB::transaction(function () use ($payload, $user) {
            $product = Product::create([
                'business_id' => $user->current_business_id,
                'category_id' => $payload['category_id'] ?? null,
                'name' => $payload['name'],
                'sku' => $payload['sku'] ?? null,
                'barcode' => $payload['barcode'] ?? null,
                'description' => $payload['description'] ?? null,
                'cost_price' => $payload['cost_price'] ?? 0,
                'selling_price' => $payload['selling_price'] ?? 0,
                'low_stock_alert' => $payload['reorder_level'] ?? 0,
                'track_inventory' => 'yes',
                'product_type' => 'good',
                'is_active' => true,
            ]);

            ConstructionProductProfile::create([
                'business_id' => $user->current_business_id,
                'product_id' => $product->id,
                'subcategory' => $payload['subcategory'] ?? null,
                'brand' => $payload['brand'] ?? null,
                'unit_type' => $payload['unit_type'] ?? 'piece',
                'wholesale_price' => $payload['wholesale_price'] ?? null,
                'contractor_price' => $payload['contractor_price'] ?? null,
                'supplier_id' => $payload['supplier_id'] ?? null,
                'stock_location_type' => $payload['stock_location_type'] ?? 'warehouse',
                'weight_kg' => $payload['weight_kg'] ?? null,
                'image_url' => $payload['image_url'] ?? null,
                'scarcity_pricing_allowed' => $payload['scarcity_pricing_allowed'] ?? false,
            ]);

            $warehouseId = $payload['warehouse_id'] ?? $this->defaultWarehouseId($user->current_business_id);
            if (($payload['quantity'] ?? 0) > 0) {
                InventoryItem::updateOrCreate(
                    [
                        'business_id' => $user->current_business_id,
                        'warehouse_id' => $warehouseId,
                        'product_id' => $product->id,
                        'variant_id' => null,
                    ],
                    [
                        'quantity' => $payload['quantity'],
                        'reorder_point' => $payload['reorder_level'] ?? 0,
                        'reorder_quantity' => $payload['reorder_level'] ?? 0,
                    ]
                );
            }

            return $product->fresh();
        });
    }

    public function customers(int $businessId): Collection
    {
        return Customer::query()
            ->where('customers.business_id', $businessId)
            ->leftJoin('construction_customer_profiles as ccp', function ($join) use ($businessId) {
                $join->on('ccp.customer_id', '=', 'customers.id')
                    ->where('ccp.business_id', '=', $businessId);
            })
            ->selectRaw('customers.*, ccp.customer_role, ccp.site_location, ccp.project_name, ccp.pricing_tier, ccp.guarantor_notes, ccp.is_blocked_defaulter')
            ->orderBy('customers.name')
            ->get();
    }

    public function createCustomerProfile(array $payload, User $user): Customer
    {
        return DB::transaction(function () use ($payload, $user) {
            $role = $payload['customer_role'] ?? 'walk_in_customer';
            $customer = Customer::create([
                'business_id' => $user->current_business_id,
                'branch_id' => $user->current_branch_id,
                'name' => $payload['name'],
                'phone' => $payload['phone'] ?? null,
                'email' => $payload['email'] ?? null,
                'address' => $payload['address'] ?? null,
                'city' => $payload['city'] ?? null,
                'state' => $payload['state'] ?? null,
                'credit_limit' => $payload['credit_limit'] ?? 0,
                'customer_type' => in_array($role, ['contractor', 'engineer', 'site_foreman', 'developer', 'government_buyer'], true) ? 'wholesaler' : 'individual',
            ]);

            ConstructionCustomerProfile::create([
                'business_id' => $user->current_business_id,
                'customer_id' => $customer->id,
                'customer_role' => $role,
                'site_location' => $payload['site_location'] ?? null,
                'project_name' => $payload['project_name'] ?? null,
                'pricing_tier' => $payload['pricing_tier'] ?? 'retail',
                'guarantor_notes' => $payload['guarantor_notes'] ?? null,
                'is_blocked_defaulter' => $payload['is_blocked_defaulter'] ?? false,
            ]);

            return $customer->fresh();
        });
    }

    public function quotations(int $businessId): Collection
    {
        return ConstructionQuotation::with(['customer', 'items.product'])
            ->where('business_id', $businessId)
            ->latest()
            ->get();
    }

    public function createQuotation(array $payload, User $user): ConstructionQuotation
    {
        $this->ensureSetup($user->current_business_id, $user->current_branch_id);

        return DB::transaction(function () use ($payload, $user) {
            $businessId = $user->current_business_id;

            $subtotal = collect($payload['items'])->sum(function (array $item) use ($payload, $businessId) {
                $price = $item['unit_price'] ?? $this->resolveItemPrice($businessId, $item['product_id'] ?? null, $payload['pricing_tier'] ?? 'retail');
                return ((float) $item['quantity'] * (float) $price) - (float) ($item['discount_amount'] ?? 0);
            });
            $deliveryFee = (float) ($payload['delivery_fee'] ?? 0);
            $discount = (float) ($payload['discount_amount'] ?? 0);

            $quotation = ConstructionQuotation::create([
                'business_id' => $user->current_business_id,
                'branch_id' => $user->current_branch_id,
                'customer_id' => $payload['customer_id'] ?? null,
                'quotation_number' => 'QTN-' . now()->format('Ymd') . '-' . Str::upper(Str::random(4)),
                'status' => $payload['status'] ?? 'sent',
                'valid_until' => $payload['valid_until'] ?? null,
                'delivery_fee' => $deliveryFee,
                'discount_amount' => $discount,
                'subtotal' => $subtotal,
                'total' => $subtotal + $deliveryFee - $discount,
                'notes' => $payload['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            foreach ($payload['items'] as $item) {
                $unitPrice = $item['unit_price'] ?? $this->resolveItemPrice($businessId, $item['product_id'] ?? null, $payload['pricing_tier'] ?? 'retail');
                $quantity = (float) $item['quantity'];
                $discountAmount = (float) ($item['discount_amount'] ?? 0);

                ConstructionQuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'product_id' => $item['product_id'] ?? null,
                    'item_name' => $item['item_name']
                        ?? (!empty($item['product_id'])
                            ? $this->resolveProduct($businessId, $item['product_id'])->name
                            : 'Material'),
                    'unit_type' => $item['unit_type'] ?? 'piece',
                    'quantity' => $quantity,
                    'converted_quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => $discountAmount,
                    'line_total' => ($quantity * (float) $unitPrice) - $discountAmount,
                ]);
            }

            return $quotation->load(['customer', 'items.product']);
        });
    }

    public function convertQuotation(ConstructionQuotation $quotation, array $payload, User $user): Order
    {
        return DB::transaction(function () use ($quotation, $payload, $user) {
            $quotation->loadMissing('items');

            $orderPayload = [
                'business_id' => $quotation->business_id,
                'branch_id' => $quotation->branch_id ?: $user->current_branch_id,
                'customer_id' => $quotation->customer_id,
                'items' => $quotation->items->map(fn (ConstructionQuotationItem $item) => [
                    'product_id' => $item->product_id,
                    'quantity' => (float) $item->converted_quantity,
                    'unit_price' => (float) $item->unit_price,
                    'discount' => (float) $item->discount_amount,
                    'total' => (float) $item->line_total,
                ])->values()->all(),
                'subtotal' => (float) $quotation->subtotal,
                'discount' => (float) $quotation->discount_amount,
                'tax' => 0,
                'total' => (float) $quotation->total,
                'paid' => (float) ($payload['paid'] ?? 0),
                'change' => 0,
                'payment_method' => $payload['payment_method'] ?? 'credit',
                'notes' => trim(($quotation->notes ?? '') . ' Converted from quotation ' . $quotation->quotation_number),
                'warehouse_id' => $payload['warehouse_id'] ?? $this->defaultWarehouseId($quotation->business_id),
            ];

            $order = $this->orderService->createOrder($orderPayload, $user->id);

            $quotation->update([
                'status' => 'converted',
                'converted_order_id' => $order->id,
            ]);

            $paidAmount = (float) ($payload['paid'] ?? 0);
            $outstandingAmount = max((float) $quotation->total - $paidAmount, 0);

            if ($quotation->customer_id && $outstandingAmount > 0) {
                ConstructionCreditAccount::create([
                    'business_id' => $quotation->business_id,
                    'branch_id' => $quotation->branch_id ?: $user->current_branch_id,
                    'customer_id' => $quotation->customer_id,
                    'order_id' => $order->id,
                    'due_date' => $payload['due_date'] ?? now()->addDays(14)->toDateString(),
                    'total_amount' => $quotation->total,
                    'paid_amount' => $paidAmount,
                    'outstanding_amount' => $outstandingAmount,
                    'installment_notes' => $payload['installment_notes'] ?? null,
                    'debt_age_bucket' => 'current',
                    'status' => $paidAmount > 0 ? 'partial' : 'open',
                ]);
            }

            return $order->fresh(['items', 'customer']);
        });
    }

    public function deliveries(int $businessId): Collection
    {
        return ConstructionDelivery::with(['customer', 'order', 'quotation'])
            ->where('business_id', $businessId)
            ->latest()
            ->get();
    }

    public function createDelivery(array $payload, User $user): ConstructionDelivery
    {
        return ConstructionDelivery::create([
            'business_id' => $user->current_business_id,
            'branch_id' => $user->current_branch_id,
            'order_id' => $payload['order_id'] ?? null,
            'quotation_id' => $payload['quotation_id'] ?? null,
            'customer_id' => $payload['customer_id'] ?? null,
            'delivery_mode' => $payload['delivery_mode'] ?? 'delivery_to_site',
            'destination_type' => $payload['destination_type'] ?? 'site',
            'driver_name' => $payload['driver_name'] ?? null,
            'loader_name' => $payload['loader_name'] ?? null,
            'vehicle_reference' => $payload['vehicle_reference'] ?? null,
            'status' => $payload['status'] ?? 'pending_dispatch',
            'failure_reason' => $payload['failure_reason'] ?? null,
            'delivery_address' => $payload['delivery_address'] ?? null,
            'confirmed_by' => $payload['confirmed_by'] ?? null,
            'created_by' => $user->id,
            'delivered_at' => ($payload['status'] ?? null) === 'delivered' ? now() : null,
        ]);
    }

    public function updateDelivery(ConstructionDelivery $delivery, array $payload): ConstructionDelivery
    {
        if (($payload['status'] ?? null) === 'delivered' && !$delivery->delivered_at) {
            $payload['delivered_at'] = now();
        }

        $delivery->update($payload);

        return $delivery->fresh(['customer', 'order', 'quotation']);
    }

    public function credits(int $businessId): Collection
    {
        return ConstructionCreditAccount::with(['customer', 'payments'])
            ->where('business_id', $businessId)
            ->latest()
            ->get();
    }

    public function recordCreditPayment(ConstructionCreditAccount $account, array $payload, User $user): ConstructionCreditPayment
    {
        return DB::transaction(function () use ($account, $payload, $user) {
            $outstandingBalance = (float) $account->outstanding_amount;
            $amount = (float) $payload['amount'];

            if ($amount > $outstandingBalance) {
                throw ValidationException::withMessages([
                    'amount' => ['Payment amount cannot exceed the outstanding credit balance.'],
                ]);
            }

            $payment = ConstructionCreditPayment::create([
                'credit_account_id' => $account->id,
                'business_id' => $account->business_id,
                'amount' => $payload['amount'],
                'payment_date' => $payload['payment_date'] ?? now()->toDateString(),
                'payment_method' => $payload['payment_method'] ?? 'cash',
                'notes' => $payload['notes'] ?? null,
                'recorded_by' => $user->id,
            ]);

            $account->paid_amount = (float) $account->paid_amount + (float) $payload['amount'];
            $account->outstanding_amount = max((float) $account->total_amount - (float) $account->paid_amount, 0);
            $account->status = $account->outstanding_amount <= 0 ? 'closed' : 'partial';
            $account->debt_age_bucket = $this->ageBucket($account->due_date);
            $account->save();

            $customer = $account->customer;
            if ($customer) {
                $customer->balance = max((float) $customer->balance - (float) $payload['amount'], 0);
                $customer->save();
            }

            return $payment->fresh(['account.customer']);
        });
    }

    public function priceChanges(int $businessId): Collection
    {
        return ConstructionPriceChange::with('product')
            ->where('business_id', $businessId)
            ->latest('effective_date')
            ->get();
    }

    public function storePriceChange(array $payload, User $user): ConstructionPriceChange
    {
        return DB::transaction(function () use ($payload, $user) {
            $product = Product::where('business_id', $user->current_business_id)->findOrFail($payload['product_id']);
            $profile = ConstructionProductProfile::where('business_id', $user->current_business_id)->where('product_id', $product->id)->first();
            $priceType = $payload['price_type'];
            $previousPrice = match ($priceType) {
                'contractor' => (float) ($profile?->contractor_price ?? $product->selling_price),
                'wholesale' => (float) ($profile?->wholesale_price ?? $product->selling_price),
                default => (float) $product->selling_price,
            };

            if ($priceType === 'selling') {
                $product->update(['selling_price' => $payload['new_price']]);
            } elseif ($profile) {
                $profile->update([
                    $priceType . '_price' => $payload['new_price'],
                ]);
            }

            return ConstructionPriceChange::create([
                'business_id' => $user->current_business_id,
                'product_id' => $product->id,
                'price_type' => $priceType,
                'previous_price' => $previousPrice,
                'new_price' => $payload['new_price'],
                'reason' => $payload['reason'] ?? null,
                'effective_date' => $payload['effective_date'] ?? now()->toDateString(),
                'created_by' => $user->id,
            ]);
        });
    }

    public function transfers(int $businessId): Collection
    {
        return ConstructionStockTransfer::with(['product', 'sourceWarehouse', 'destinationWarehouse', 'unit'])
            ->where('business_id', $businessId)
            ->latest()
            ->get();
    }

    public function storeTransfer(array $payload, User $user): ConstructionStockTransfer
    {
        return DB::transaction(function () use ($payload, $user) {
            $convertedQuantity = $this->convertedQuantity($user->current_business_id, $payload['unit_of_measure_id'] ?? null, (float) $payload['quantity']);
            $source = InventoryItem::firstOrCreate(
                [
                    'business_id' => $user->current_business_id,
                    'warehouse_id' => $payload['source_warehouse_id'],
                    'product_id' => $payload['product_id'],
                    'variant_id' => null,
                ],
                ['quantity' => 0, 'reserved_quantity' => 0, 'reorder_point' => 0, 'reorder_quantity' => 0]
            );

            $destination = InventoryItem::firstOrCreate(
                [
                    'business_id' => $user->current_business_id,
                    'warehouse_id' => $payload['destination_warehouse_id'],
                    'product_id' => $payload['product_id'],
                    'variant_id' => null,
                ],
                ['quantity' => 0, 'reserved_quantity' => 0, 'reorder_point' => 0, 'reorder_quantity' => 0]
            );

            $sourcePrevious = (float) $source->quantity;
            $destinationPrevious = (float) $destination->quantity;

            if ($sourcePrevious < $convertedQuantity) {
                throw ValidationException::withMessages([
                    'quantity' => ['The source warehouse does not have enough stock for this transfer.'],
                ]);
            }

            $source->quantity = $sourcePrevious - $convertedQuantity;
            $source->save();

            $destination->quantity = $destinationPrevious + $convertedQuantity;
            $destination->save();

            InventoryMovement::create([
                'business_id' => $user->current_business_id,
                'warehouse_id' => $source->warehouse_id,
                'product_id' => $source->product_id,
                'variant_id' => null,
                'branch_id' => $user->current_branch_id,
                'movement_type' => 'transfer_out',
                'quantity' => -$convertedQuantity,
                'previous_quantity' => $sourcePrevious,
                'new_quantity' => $source->quantity,
                'notes' => $payload['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            InventoryMovement::create([
                'business_id' => $user->current_business_id,
                'warehouse_id' => $destination->warehouse_id,
                'product_id' => $destination->product_id,
                'variant_id' => null,
                'branch_id' => $user->current_branch_id,
                'movement_type' => 'transfer_in',
                'quantity' => $convertedQuantity,
                'previous_quantity' => $destinationPrevious,
                'new_quantity' => $destination->quantity,
                'notes' => $payload['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            return ConstructionStockTransfer::create([
                'business_id' => $user->current_business_id,
                'branch_id' => $user->current_branch_id,
                'product_id' => $payload['product_id'],
                'source_warehouse_id' => $payload['source_warehouse_id'],
                'destination_warehouse_id' => $payload['destination_warehouse_id'],
                'unit_of_measure_id' => $payload['unit_of_measure_id'] ?? null,
                'quantity' => $payload['quantity'],
                'converted_quantity' => $convertedQuantity,
                'status' => 'completed',
                'notes' => $payload['notes'] ?? null,
                'created_by' => $user->id,
            ]);
        });
    }

    private function resolveItemPrice(int $businessId, ?int $productId, string $pricingTier): float
    {
        if (!$productId) {
            return 0;
        }

        $product = $this->resolveProduct($businessId, $productId);
        $profile = ConstructionProductProfile::where('business_id', $businessId)
            ->where('product_id', $productId)
            ->first();

        return match ($pricingTier) {
            'contractor' => (float) ($profile?->contractor_price ?? $product?->selling_price ?? 0),
            'wholesale' => (float) ($profile?->wholesale_price ?? $product?->selling_price ?? 0),
            default => (float) ($product?->selling_price ?? 0),
        };
    }

    private function estimateMonthlyProfit(int $businessId, $startOfMonth): float
    {
        $orders = Order::with('items.product')
            ->where('business_id', $businessId)
            ->where('created_at', '>=', $startOfMonth)
            ->get();

        return (float) $orders->sum(function (Order $order) {
            return $order->items->sum(function ($item) {
                $cost = (float) ($item->product?->cost_price ?? 0) * (float) $item->quantity;
                return (float) $item->total - $cost;
            });
        });
    }

    private function lowStockByCategory(int $businessId, string $categorySlug): int
    {
        $categoryId = ProductCategory::where('business_id', $businessId)->where('slug', $categorySlug)->value('id');

        if (!$categoryId) {
            return 0;
        }

        return Product::query()
            ->join('inventory_items', 'inventory_items.product_id', '=', 'products.id')
            ->where('products.business_id', $businessId)
            ->where('products.category_id', $categoryId)
            ->whereColumn('inventory_items.quantity', '<=', 'inventory_items.reorder_point')
            ->count();
    }

    private function convertedQuantity(int $businessId, ?int $unitId, float $quantity): float
    {
        if (!$unitId) {
            return $quantity;
        }

        $unit = UnitOfMeasure::where('business_id', $businessId)->find($unitId);

        return round($quantity * (float) ($unit?->conversion_factor ?? 1), 3);
    }

    private function defaultWarehouseId(int $businessId): int
    {
        return Warehouse::where('business_id', $businessId)->where('is_default', true)->value('id')
            ?? Warehouse::where('business_id', $businessId)->value('id')
            ?? 1;
    }

    private function resolveProduct(int $businessId, int $productId): Product
    {
        return Product::where('business_id', $businessId)->findOrFail($productId);
    }

    private function ageBucket($dueDate): string
    {
        if (!$dueDate) {
            return 'current';
        }

        if (now()->lte($dueDate)) {
            return 'current';
        }

        $days = now()->diffInDays($dueDate);

        return match (true) {
            $days <= 30 => '1-30',
            $days <= 60 => '31-60',
            default => '61+',
        };
    }

    private function setBaseUnit(int $businessId, string $abbreviation, ?int $baseUnitId): void
    {
        if (!$baseUnitId) {
            return;
        }

        UnitOfMeasure::where('business_id', $businessId)
            ->where('abbreviation', $abbreviation)
            ->update(['base_unit_id' => $baseUnitId]);
    }
}
