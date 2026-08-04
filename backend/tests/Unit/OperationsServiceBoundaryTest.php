<?php

namespace Tests\Unit;

use App\Models\CommodityLot;
use App\Models\DeliveryContact;
use App\Models\DeliveryOrder;
use App\Models\DeliveryVehicle;
use App\Models\LogisticsFleetAsset;
use App\Models\LogisticsTripSheet;
use App\Models\Product;
use App\Services\ConstructionMaterialsService;
use App\Services\CommodityService;
use App\Services\DeliveryService;
use App\Services\LogisticsService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class OperationsServiceBoundaryTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_commodity_service_rejects_lots_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('commodity', 'commodity-service-local@example.com');
        $foreignTenant = $this->createTenantContext('commodity', 'commodity-service-foreign@example.com');

        $foreignLot = CommodityLot::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'warehouse_id' => $foreignTenant['warehouse']->id,
            'commodity_name' => 'Foreign Soybeans',
            'weight_kg' => 1000,
            'cost_per_kg' => 2000,
            'selling_price_per_kg' => 2400,
            'status' => 'open',
        ]);

        try {
            app(CommodityService::class)->storeTrade([
                'commodity_lot_id' => $foreignLot->id,
                'ticket_type' => 'sell',
                'commodity_name' => 'Foreign Soybeans',
                'weight_kg' => 100,
                'unit_price' => 2400,
                'trade_date' => now()->toDateString(),
            ], $tenant['business']->id, $tenant['branch']->id);

            $this->fail('Expected commodity service to reject a foreign lot.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('commodity_trade_tickets', 0);
        }
    }

    public function test_logistics_service_rejects_fuel_logs_for_foreign_trips(): void
    {
        $tenant = $this->createTenantContext('logistics', 'logistics-service-local@example.com');
        $foreignTenant = $this->createTenantContext('logistics', 'logistics-service-foreign@example.com');

        $foreignAsset = LogisticsFleetAsset::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'asset_type' => 'truck',
            'name' => 'Foreign Truck',
            'status' => 'active',
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
        ]);

        $foreignTrip = LogisticsTripSheet::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'fleet_asset_id' => $foreignAsset->id,
            'trip_code' => 'TRP-FOREIGN-UNIT',
            'route_name' => 'Foreign Route',
            'origin' => 'A',
            'destination' => 'B',
            'trip_date' => now()->toDateString(),
            'status' => 'planned',
            'payment_status' => 'pending',
        ]);

        try {
            app(LogisticsService::class)->createFuelLog([
                'trip_sheet_id' => $foreignTrip->id,
                'fleet_asset_id' => $foreignAsset->id,
                'log_date' => now()->toDateString(),
                'litres' => 120,
                'unit_cost' => 950,
            ], $tenant['business']->id, $tenant['user']->id);

            $this->fail('Expected logistics service to reject a foreign trip fuel log.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('logistics_fuel_logs', 0);
        }
    }

    public function test_logistics_service_rejects_maintenance_logs_for_foreign_trips(): void
    {
        $tenant = $this->createTenantContext('logistics', 'logistics-maint-local@example.com');
        $foreignTenant = $this->createTenantContext('logistics', 'logistics-maint-foreign@example.com');

        $foreignAsset = LogisticsFleetAsset::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'asset_type' => 'truck',
            'name' => 'Foreign Truck',
            'status' => 'active',
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
        ]);

        $foreignTrip = LogisticsTripSheet::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'fleet_asset_id' => $foreignAsset->id,
            'trip_code' => 'TRP-FOREIGN-MAINT',
            'route_name' => 'Foreign Route',
            'origin' => 'A',
            'destination' => 'B',
            'trip_date' => now()->toDateString(),
            'status' => 'planned',
            'payment_status' => 'pending',
        ]);

        try {
            app(LogisticsService::class)->createMaintenanceLog([
                'trip_sheet_id' => $foreignTrip->id,
                'fleet_asset_id' => $foreignAsset->id,
                'logged_on' => now()->toDateString(),
                'summary' => 'Foreign maintenance',
            ], $tenant['business']->id);

            $this->fail('Expected logistics service to reject a foreign trip maintenance log.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('logistics_maintenance_logs', 0);
        }
    }

    public function test_delivery_service_does_not_apply_foreign_vehicle_policies_to_settlements(): void
    {
        $tenant = $this->createTenantContext('delivery_company', 'delivery-service-local@example.com');
        $foreignTenant = $this->createTenantContext('delivery_company', 'delivery-service-foreign@example.com');

        $foreignVehicle = DeliveryVehicle::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'vehicle_type' => 'motorcycle',
            'ownership_model' => 'company_owned',
            'owner_name' => 'Foreign Fleet',
            'purchase_value' => 900000,
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ]);

        $sender = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Sender',
            'phone' => '08050000001',
        ]);

        $recipient = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Recipient',
            'phone' => '08050000002',
        ]);

        $order = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => $sender->id,
            'recipient_contact_id' => $recipient->id,
            'vehicle_id' => $foreignVehicle->id,
            'tracking_code' => 'TSK-UNIT-FOREIGN-VEHICLE',
            'status' => 'delivered',
            'parcel_category' => 'Parcel',
            'pricing_model' => 'flat',
            'base_fee' => 6000,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 6000,
            'cod_amount' => 0,
            'amount_remitted' => 0,
            'pickup_address' => 'Pickup',
            'dropoff_address' => 'Dropoff',
        ]);

        $settlement = app(DeliveryService::class)->createSettlement($order);

        $this->assertSame('0.00', $settlement->fuel_deduction);
        $this->assertSame('0.00', $settlement->maintenance_deduction);
    }

    public function test_construction_service_rejects_quotation_products_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('construction', 'construction-service-local@example.com');
        $foreignTenant = $this->createTenantContext('construction', 'construction-service-foreign@example.com');

        $foreignProduct = Product::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Cement',
            'selling_price' => 9000,
            'cost_price' => 8000,
            'track_inventory' => 'yes',
            'product_type' => 'good',
            'is_active' => true,
        ]);

        try {
            app(ConstructionMaterialsService::class)->createQuotation([
                'items' => [[
                    'product_id' => $foreignProduct->id,
                    'quantity' => 5,
                ]],
            ], $tenant['user']);

            $this->fail('Expected construction service to reject a foreign quotation product.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('construction_quotations', 0);
            $this->assertDatabaseCount('construction_quotation_items', 0);
        }
    }
}
