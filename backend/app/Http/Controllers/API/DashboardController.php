<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\AiService;
use App\Models\Customer;
use App\Models\DeliveryComplaint;
use App\Models\DeliveryOrder;
use App\Models\DeliveryWalletTransaction;
use App\Models\HotelBooking;
use App\Models\HotelMaintenanceRequest;
use App\Models\HotelRoom;
use App\Models\LogisticsDriverSettlement;
use App\Models\LogisticsFleetAsset;
use App\Models\LogisticsFuelLog;
use App\Models\LogisticsMaintenanceLog;
use App\Models\LogisticsTripSheet;
use App\Models\LogisticsTripStop;
use App\Models\ClinicAppointment;
use App\Models\ClinicConsultation;
use App\Models\AgroAdvisoryRecord;
use App\Models\AgroFarmerCreditRecovery;
use App\Models\AgroSeasonalForecast;
use App\Models\AgroSubsidySale;
use App\Models\ConstructionCreditAccount;
use App\Models\ConstructionDelivery;
use App\Models\ConstructionQuotation;
use App\Models\Cooperative;
use App\Models\CooperativeFinancing;
use App\Models\CooperativeMember;
use App\Models\CooperativeProfitCycle;
use App\Models\CooperativeWallet;
use App\Models\Expense;
use App\Models\BeautyAppointment;
use App\Models\BeautyService as BeautyServiceModel;
use App\Models\BeautyStaffProfile;
use App\Models\CommodityLot;
use App\Models\CommodityPriceBoard;
use App\Models\CommoditySettlement;
use App\Models\CommodityTradeTicket;
use App\Models\SMECashEntry;
use App\Models\SMEDailyTarget;
use App\Models\SMEFollowUp;
use App\Models\ServiceBooking;
use App\Models\ServiceJob;
use App\Models\ServiceOffering;
use App\Models\ServiceStaffProfile;
use App\Models\TrustAccount;
use App\Models\TrustTransaction;
use App\Models\InventoryBatch;
use App\Models\LabRequest;
use App\Models\NGODistribution;
use App\Models\NGODonorSource;
use App\Models\NGOPartnerRequest;
use App\Models\PatientRecord;
use App\Models\PharmacyDispense;
use App\Models\ProductBatch;
use App\Models\RefillReminder;
use App\Models\PureWaterRetailCrateLedger;
use App\Models\PureWaterRetailPackageMovement;
use App\Models\PureWaterRetailPriceTier;
use App\Models\MobileAgentFloatRequest;
use App\Models\MobileAgentFraudAlert;
use App\Models\MobileAgentShortageLog;
use App\Models\MobileAgentTransaction;
use App\Models\TextileColorVariant;
use App\Models\TextileConsignmentStock;
use App\Models\TextileCustomerMeasurement;
use App\Models\TextileStyleOrder;
use App\Models\RestaurantTable;
use App\Models\RestaurantTicket;
use App\Models\RestaurantWaiterShift;
use App\Models\RetailCashierShift;
use App\Models\RetailLoyaltyProfile;
use App\Models\RetailPettyCashEntry;
use App\Models\RetailRefund;
use App\Models\WholesaleRouteRun;
use App\Models\WholesaleRouteStop;
use App\Models\WholesaleSalesRep;
use App\Models\WholesaleStockTransfer;
use App\Models\KitchenTicket;
use App\Models\TableReservation;
use App\Models\FoodWasteLog;
use App\Models\FuelNozzleReading;
use App\Models\FuelShiftLog;
use App\Models\FuelTank;
use App\Models\FuelVarianceAlert;
use App\Models\LivestockAnimalGroup;
use App\Models\LivestockBreedingRecord;
use App\Models\LivestockDiseaseLog;
use App\Models\LivestockMedicationRecord;
use App\Models\LivestockMilkLog;
use App\Models\LivestockPen;
use App\Models\LivestockSale;
use App\Models\FarmHarvestLog;
use App\Models\FarmInputLog;
use App\Models\FarmPlantingCycle;
use App\Models\FarmPlot;
use App\Models\SchoolFeePayment;
use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use App\Models\StudentRecord;
use App\Models\Order;
use App\Models\ProductionBatch;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $business = $request->user()->currentBusiness;
        $businessId = $request->user()->current_business_id;
        $businessType = $business?->business_type === 'ngo_warehouse' ? 'warehouse' : $business?->business_type;
        $today = today()->toDateString();

        $sales = Order::query()
            ->where('business_id', $businessId)
            ->whereDate('created_at', today())
            ->where('order_type', 'sale')
            ->selectRaw('COUNT(*) as order_count, COALESCE(SUM(total), 0) as total_sales')
            ->first();

        $lowStockCount = DB::table('inventory_items')
            ->join('products', 'products.id', '=', 'inventory_items.product_id')
            ->where('inventory_items.business_id', $businessId)
            ->whereColumn('inventory_items.quantity', '<=', 'products.low_stock_alert')
            ->count();

        $deliverySummary = DeliveryOrder::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'pending_pickup' THEN 1 ELSE 0 END), 0) as pickups_pending,
                COALESCE(SUM(CASE WHEN status IN ('picked_up', 'in_transit') THEN 1 ELSE 0 END), 0) as in_transit,
                COALESCE(SUM(CASE WHEN status = 'delivered' AND date(delivered_at) = date('now') THEN 1 ELSE 0 END), 0) as completed_today,
                COALESCE(SUM(CASE WHEN status != 'delivered' AND created_at <= datetime('now', '-1 day') THEN 1 ELSE 0 END), 0) as ageing_parcels
            ")
            ->first();

        $logisticsFuelSummary = LogisticsFuelLog::query()
            ->where('business_id', $businessId)
            ->whereDate('log_date', $today)
            ->selectRaw("
                COALESCE(SUM(amount), 0) as fuel_cost_today,
                COALESCE(SUM(litres), 0) as litres_today
            ")
            ->first();

        $industryFocus = config("industry_realism.types.{$businessType}", []);
        $aiSummary = app(AiService::class)->getInsightSummary($businessId);

        $hotelSummary = HotelRoom::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0) as occupied_rooms,
                COUNT(*) as total_rooms,
                COALESCE(SUM(CASE WHEN status IN ('blocked', 'out_of_service') THEN 1 ELSE 0 END), 0) as blocked_rooms,
                COALESCE(SUM(CASE WHEN cleaning_status IN ('dirty', 'in_progress') THEN 1 ELSE 0 END), 0) as cleaning_attention
            ")
            ->first();

        $hotelBookingSummary = HotelBooking::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(actual_check_in_at) = date('now') THEN 1 ELSE 0 END), 0) as checkins_today,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN total_amount ELSE 0 END), 0) as revenue_today
            ")
            ->first();

        $healthSummary = PatientRecord::query()
            ->where('business_id', $businessId)
            ->selectRaw('COUNT(*) as patients_count')
            ->first();

        $healthAppointments = ClinicAppointment::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(scheduled_for) = date('now') THEN 1 ELSE 0 END), 0) as appointments_today
            ")
            ->first();

        $healthConsultations = ClinicConsultation::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END), 0) as consultations_today,
                COALESCE(SUM(billing_amount - amount_paid), 0) as unpaid_bills
            ")
            ->first();

        $healthLab = LabRequest::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'review_pending' THEN 1 ELSE 0 END), 0) as pending_approvals,
                COALESCE(SUM(CASE WHEN is_abnormal = 1 THEN 1 ELSE 0 END), 0) as abnormal_results
            ")
            ->first();

        $productionSummary = ProductionBatch::query()
            ->where('business_id', $businessId)
            ->whereDate('production_date', $today)
            ->selectRaw("
                COALESCE(SUM(total_output_quantity), 0) as units_produced_today,
                COALESCE(SUM(electricity_cost), 0) as electricity_cost_today,
                COALESCE(SUM(packaging_cost_total), 0) as packaging_cost_today,
                COALESCE(SUM(generator_fuel_cost), 0) as generator_fuel_today,
                COALESCE(SUM(net_margin), 0) as profit_estimate_today,
                COALESCE(SUM(downtime_minutes), 0) as downtime_today
            ")
            ->first();

        $pureWaterRetailSales = Order::where('business_id', $businessId)
            ->whereDate('created_at', $today)
            ->where('notes', 'like', '%pure_water_retail:%')
            ->selectRaw("
                COALESCE(SUM(total), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN notes like '%:wholesale:%' THEN total ELSE 0 END), 0) as wholesale_revenue_today,
                COALESCE(SUM(CASE WHEN notes like '%:retail:%' THEN total ELSE 0 END), 0) as retail_revenue_today
            ")
            ->first();

        $pureWaterRetailPackages = PureWaterRetailPackageMovement::where('business_id', $businessId)
            ->whereDate('recorded_at', $today)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN movement_type = 'sale' THEN quantity ELSE 0 END), 0) as packages_sold_today,
                COALESCE(SUM(CASE WHEN movement_type = 'transfer_out' THEN quantity ELSE 0 END), 0) as transfers_out_today
            ")
            ->first();

        $pureWaterRetailCrates = PureWaterRetailCrateLedger::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN movement_type = 'issue' THEN crate_count ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN movement_type = 'return' THEN crate_count ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN movement_type = 'adjustment_out' THEN crate_count ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN movement_type = 'adjustment_in' THEN crate_count ELSE 0 END), 0) as crates_outstanding
            ")
            ->first();

        $schoolStudents = StudentRecord::where('business_id', $businessId)->count();
        $schoolFeesCollected = SchoolFeePayment::where('business_id', $businessId)->whereDate('paid_at', $today)->sum('amount_paid');
        $schoolPromoted = StudentEnrollment::where('business_id', $businessId)->where('promotion_decision', 'promoted')->count();
        $schoolAttendance = StudentAttendance::where('business_id', $businessId)
            ->whereDate('attendance_date', $today)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0) as present_count,
                COUNT(*) as total_count
            ")
            ->first();

        $pharmacySummary = ProductBatch::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN expiry_date <= date('now', '+30 day') AND expiry_date >= date('now') THEN 1 ELSE 0 END), 0) as near_expiry_batches,
                COALESCE(SUM(CASE WHEN discounted_price > 0 AND remaining_quantity > 0 THEN 1 ELSE 0 END), 0) as discounted_batches,
                COALESCE(SUM(CASE WHEN expiry_date < date('now') AND remaining_quantity > 0 THEN remaining_quantity ELSE 0 END), 0) as expired_units
            ")
            ->first();

        $retailPettyCashNet = RetailPettyCashEntry::where('business_id', $businessId)
            ->whereDate('recorded_at', $today)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN entry_type = 'funding' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN entry_type = 'spend' THEN amount ELSE 0 END), 0) as balance
            ")
            ->value('balance');

        $retailSummary = [
            'cash_balance' => (float) RetailCashierShift::where('business_id', $businessId)->where('status', 'open')->sum('opening_float') + (float) $retailPettyCashNet,
            'debtors' => (float) Customer::where('business_id', $businessId)->sum('balance'),
            'loyalty_customers' => RetailLoyaltyProfile::where('business_id', $businessId)->count(),
            'petty_cash_today' => (float) RetailPettyCashEntry::where('business_id', $businessId)->whereDate('recorded_at', $today)->sum('amount'),
            'refunds_today' => (float) RetailRefund::where('business_id', $businessId)->whereDate('refunded_at', $today)->sum('refund_amount'),
            'open_shifts' => RetailCashierShift::where('business_id', $businessId)->where('status', 'open')->count(),
        ];

        $wholesaleSummary = [
            'route_runs_today' => WholesaleRouteRun::where('business_id', $businessId)->whereDate('route_date', $today)->count(),
            'active_reps' => WholesaleSalesRep::where('business_id', $businessId)->where('status', 'active')->count(),
            'bulk_orders_today' => Order::where('business_id', $businessId)->whereDate('created_at', $today)->where('notes', 'like', '%wholesale%')->count(),
            'route_collections_today' => (float) WholesaleRouteStop::query()
                ->join('wholesale_route_runs', 'wholesale_route_runs.id', '=', 'wholesale_route_stops.route_run_id')
                ->where('wholesale_route_runs.business_id', $businessId)
                ->whereDate('wholesale_route_runs.route_date', $today)
                ->sum('wholesale_route_stops.collected_amount'),
            'stock_transfers_today' => WholesaleStockTransfer::where('business_id', $businessId)->whereDate('created_at', $today)->count(),
            'customer_debt' => (float) Customer::where('business_id', $businessId)->sum('balance'),
        ];

        $commodityTradeSummary = CommodityTradeTicket::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN ticket_type = 'buy' AND date(trade_date) = date('now') THEN weight_kg ELSE 0 END), 0) as buy_volume_today,
                COALESCE(SUM(CASE WHEN ticket_type = 'sell' AND date(trade_date) = date('now') THEN weight_kg ELSE 0 END), 0) as sell_volume_today,
                COALESCE(SUM(CASE WHEN ticket_type = 'sell' AND date(trade_date) = date('now') THEN total_amount ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN ticket_type = 'buy' THEN total_amount - paid_amount ELSE 0 END), 0) as supplier_payables,
                COALESCE(SUM(CASE WHEN ticket_type = 'sell' THEN total_amount - paid_amount ELSE 0 END), 0) as customer_receivables,
                COALESCE(SUM(CASE WHEN date(trade_date) = date('now') THEN shrinkage_loss_kg ELSE 0 END), 0) as shrinkage_today_kg
            ")
            ->first();

        $commoditySummary = [
            'lots_open' => CommodityLot::where('business_id', $businessId)->where('status', 'open')->count(),
            'stock_weight_kg' => (float) CommodityLot::where('business_id', $businessId)->where('status', 'open')->sum('weight_kg'),
            'buy_volume_today' => (float) ($commodityTradeSummary?->buy_volume_today ?? 0),
            'sell_volume_today' => (float) ($commodityTradeSummary?->sell_volume_today ?? 0),
            'revenue_today' => (float) ($commodityTradeSummary?->revenue_today ?? 0),
            'supplier_payables' => (float) ($commodityTradeSummary?->supplier_payables ?? 0),
            'customer_receivables' => (float) ($commodityTradeSummary?->customer_receivables ?? 0),
            'shrinkage_today_kg' => (float) ($commodityTradeSummary?->shrinkage_today_kg ?? 0),
            'price_updates_today' => CommodityPriceBoard::where('business_id', $businessId)->whereDate('effective_date', $today)->count(),
            'high_moisture_lots' => CommodityLot::where('business_id', $businessId)->where('moisture_percent', '>', 12)->count(),
            'settlements_today' => (float) CommoditySettlement::where('business_id', $businessId)->whereDate('settled_on', $today)->sum('amount'),
        ];

        $restaurantSummary = RestaurantTicket::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN total ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN gross_margin ELSE 0 END), 0) as gross_margin_today,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') AND order_channel = 'takeaway' THEN 1 ELSE 0 END), 0) as takeaway_today,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') AND order_channel = 'delivery' THEN 1 ELSE 0 END), 0) as delivery_today,
                COALESCE(SUM(CASE WHEN service_status IN ('open', 'preparing', 'ready', 'served') THEN 1 ELSE 0 END), 0) as open_tickets
            ")
            ->first();

        $mobileAgentSummary = MobileAgentTransaction::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(processed_at) = date('now') THEN transaction_amount ELSE 0 END), 0) as volume_today,
                COALESCE(SUM(CASE WHEN date(processed_at) = date('now') THEN commission_amount ELSE 0 END), 0) as commissions_today,
                COALESCE(SUM(CASE WHEN status = 'reversal_pending' THEN 1 ELSE 0 END), 0) as reversals_pending
            ")
            ->first();

        $textileSummary = TextileStyleOrder::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status NOT IN ('ready', 'delivered') THEN 1 ELSE 0 END), 0) as active_jobs,
                COALESCE(SUM(CASE WHEN due_date < date('now') AND status NOT IN ('ready', 'delivered') THEN 1 ELSE 0 END), 0) as overdue_jobs,
                COALESCE(SUM(total_amount - amount_paid), 0) as debtor_exposure
            ")
            ->first();

        $fuelSalesSummary = FuelNozzleReading::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(reading_date) = date('now') THEN expected_sales_amount ELSE 0 END), 0) as sales_today,
                COALESCE(SUM(CASE WHEN date(reading_date) = date('now') THEN litres_sold ELSE 0 END), 0) as litres_today,
                COALESCE(SUM(CASE WHEN date(reading_date) = date('now') THEN variance_amount ELSE 0 END), 0) as variance_today
            ")
            ->first();

        $fuelTankSummary = FuelTank::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(current_stock_litres), 0) as current_stock_litres,
                COALESCE(SUM(CASE WHEN current_stock_litres <= reorder_level_litres THEN 1 ELSE 0 END), 0) as low_stock_tanks
            ")
            ->first();

        $fuelShiftSummary = FuelShiftLog::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) as open_shifts,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN shortage_amount ELSE 0 END), 0) as shortage_today,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN recovery_amount ELSE 0 END), 0) as recovery_today
            ")
            ->first();

        $agroForecastSummary = AgroSeasonalForecast::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(forecast_quantity), 0) as forecast_quantity,
                COALESCE(SUM(reserved_quantity), 0) as reserved_quantity,
                COALESCE(AVG(confidence_score), 0) as avg_confidence
            ")
            ->first();

        $agroSubsidySummary = AgroSubsidySale::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(amount_due), 0) as programme_sales_total,
                COALESCE(SUM(amount_due - amount_received), 0) as subsidy_receivable,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_programmes
            ")
            ->first();

        $agroRecoverySummary = AgroFarmerCreditRecovery::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(outstanding_amount), 0) as outstanding_credit,
                COALESCE(SUM(CASE WHEN status != 'recovered' THEN 1 ELSE 0 END), 0) as open_recoveries
            ")
            ->first();

        $livestockSummary = LivestockAnimalGroup::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(animal_count), 0) as total_animals,
                COALESCE(AVG(average_weight_kg), 0) as average_weight_kg
            ")
            ->first();

        $farmSummary = [
            'active_plots' => FarmPlot::where('business_id', $businessId)->where('status', 'active')->count(),
            'hectares_under_cultivation' => (float) FarmPlantingCycle::where('business_id', $businessId)
                ->whereIn('status', ['planned', 'planted', 'growing'])
                ->sum('planted_area_hectares'),
            'input_cost_today' => (float) FarmInputLog::where('business_id', $businessId)->whereDate('applied_on', $today)->sum('cost'),
            'harvest_today' => (float) FarmHarvestLog::where('business_id', $businessId)->whereDate('harvested_on', $today)->sum('quantity_harvested'),
            'harvest_revenue_today' => (float) FarmHarvestLog::where('business_id', $businessId)->whereDate('harvested_on', $today)->sum('estimated_revenue'),
            'losses_today' => (float) FarmHarvestLog::where('business_id', $businessId)->whereDate('harvested_on', $today)->sum('loss_quantity'),
        ];

        $beautySummary = BeautyAppointment::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(appointment_at) = date('now') THEN 1 ELSE 0 END), 0) as appointments_today,
                COALESCE(SUM(CASE WHEN date(completed_at) = date('now') THEN 1 ELSE 0 END), 0) as completed_today,
                COALESCE(SUM(CASE WHEN date(completed_at) = date('now') THEN service_price ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN status IN ('scheduled', 'in_service') THEN 1 ELSE 0 END), 0) as pending_queue,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN commission_amount ELSE 0 END), 0) as commissions_due,
                COALESCE(SUM(CASE WHEN date(completed_at) = date('now') THEN product_cost ELSE 0 END), 0) as product_cost_today
            ")
            ->first();

        $serviceSummary = ServiceJob::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END), 0) as jobs_created_today,
                COALESCE(SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END), 0) as open_jobs,
                COALESCE(SUM(CASE WHEN date(completed_at) = date('now') THEN invoice_amount ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN invoice_amount > amount_paid THEN invoice_amount - amount_paid ELSE 0 END), 0) as invoices_outstanding,
                COALESCE(SUM(CASE WHEN due_date < date('now') AND invoice_amount > amount_paid THEN 1 ELSE 0 END), 0) as overdue_invoices
            ")
            ->first();

        $smeCashSummary = SMECashEntry::where('business_id', $businessId)
            ->whereDate('entry_date', $today)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN entry_type = 'cash_in' THEN amount ELSE 0 END), 0) as cash_in_today,
                COALESCE(SUM(CASE WHEN entry_type = 'cash_out' THEN amount ELSE 0 END), 0) as cash_out_today
            ")
            ->first();

        $smeTarget = SMEDailyTarget::where('business_id', $businessId)
            ->whereDate('target_date', $today)
            ->latest()
            ->first();

        $ngoSummary = [
            'donor_sources' => NGODonorSource::where('business_id', $businessId)->count(),
            'partner_requests_pending' => NGOPartnerRequest::where('business_id', $businessId)->where('status', 'pending')->count(),
            'distributions_today' => NGODistribution::where('business_id', $businessId)->whereDate('distributed_on', $today)->count(),
            'expiry_alerts' => InventoryBatch::where('business_id', $businessId)->whereDate('expiry_date', '<=', now()->addDays(30))->count(),
        ];

        $constructionSalesSummary = Order::where('business_id', $businessId)
            ->whereDate('created_at', $today)
            ->selectRaw("
                COALESCE(SUM(total), 0) as sales_today
            ")
            ->first();

        $constructionSummary = ConstructionCreditAccount::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(outstanding_amount), 0) as outstanding_debts
            ")
            ->first();

        $logisticsTripsBase = LogisticsTripSheet::query()->where('business_id', $businessId);
        $logisticsTodayTrips = (clone $logisticsTripsBase)->whereDate('trip_date', $today);
        $adasheSummary = TrustAccount::query()
            ->where('business_id', $businessId)
            ->where('account_type', 'contribution')
            ->selectRaw("
                COUNT(*) as member_accounts,
                COALESCE(SUM(\"limit\"), 0) as total_target,
                COALESCE(SUM(balance), 0) as total_collected,
                COALESCE(SUM(total_repaid), 0) as total_paid_out,
                COALESCE(SUM(CASE WHEN next_due_date <= date('now') AND balance < \"limit\" THEN 1 ELSE 0 END), 0) as due_now,
                COALESCE(SUM(CASE WHEN next_due_date BETWEEN date('now') AND date('now', '+2 day') AND balance < \"limit\" THEN 1 ELSE 0 END), 0) as due_soon,
                COALESCE(AVG(contribution_frequency_days), 0) as average_frequency_days
            ")
            ->first();

        $adasheLead = TrustAccount::query()
            ->where('business_id', $businessId)
            ->where('account_type', 'contribution')
            ->whereNotNull('next_due_date')
            ->whereColumn('balance', '<', 'limit')
            ->orderBy('next_due_date')
            ->with('customer')
            ->first();

        $trustFundSummary = TrustAccount::query()
            ->where('business_id', $businessId)
            ->where('account_type', 'credit')
            ->selectRaw("
                COUNT(*) as account_count,
                COALESCE(SUM(\"limit\"), 0) as total_extended,
                COALESCE(SUM(balance), 0) as total_outstanding,
                COALESCE(SUM(total_repaid), 0) as total_collected,
                COALESCE(SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END), 0) as active_balance_accounts,
                COALESCE(SUM(CASE WHEN balance > 0 AND last_payment_date < date('now', '-30 day') THEN 1 ELSE 0 END), 0) as overdue_accounts,
                COALESCE(SUM(CASE WHEN \"limit\" > 0 AND ((balance * 100.0) / \"limit\") >= 80 THEN 1 ELSE 0 END), 0) as high_utilization_accounts
            ")
            ->first();

        $trustFundLead = TrustAccount::query()
            ->where('business_id', $businessId)
            ->where('account_type', 'credit')
            ->where('balance', '>', 0)
            ->with('customer')
            ->orderByRaw("
                CASE
                    WHEN last_payment_date < date('now', '-30 day') THEN 0
                    ELSE 1
                END
            ")
            ->orderByDesc('balance')
            ->first();

        $cooperative = Cooperative::query()
            ->where('business_id', $businessId)
            ->first();

        $cooperativeSummary = $cooperative
            ? [
                'members' => CooperativeMember::where('cooperative_id', $cooperative->id)->count(),
                'active_financing' => CooperativeFinancing::where('cooperative_id', $cooperative->id)
                    ->whereNotIn('status', ['closed', 'repaid'])
                    ->count(),
                'pending_approvals' => CooperativeFinancing::where('cooperative_id', $cooperative->id)
                    ->whereIn('status', ['pending_guarantor_approval', 'pending_admin_approval'])
                    ->count(),
                'main_wallet_balance' => (float) CooperativeWallet::where('cooperative_id', $cooperative->id)
                    ->where('wallet_type', 'main')
                    ->value('balance'),
                'reserve_wallet_balance' => (float) CooperativeWallet::where('cooperative_id', $cooperative->id)
                    ->where('wallet_type', 'reserve_fund')
                    ->value('balance'),
                'charity_wallet_balance' => (float) CooperativeWallet::where('cooperative_id', $cooperative->id)
                    ->where('wallet_type', 'charity_fund')
                    ->value('balance'),
                'distributed_cycles' => CooperativeProfitCycle::where('cooperative_id', $cooperative->id)
                    ->where('status', 'distributed')
                    ->count(),
                'pending_profit_cycles' => CooperativeProfitCycle::where('cooperative_id', $cooperative->id)
                    ->whereIn('status', ['approved', 'draft'])
                    ->count(),
                'last_distribution_label' => CooperativeProfitCycle::where('cooperative_id', $cooperative->id)
                    ->where('status', 'distributed')
                    ->latest('cycle_end')
                    ->value('label'),
                'last_distribution_date' => optional(
                    CooperativeProfitCycle::where('cooperative_id', $cooperative->id)
                        ->where('status', 'distributed')
                        ->latest('cycle_end')
                        ->first()
                )->distributed_at?->toDateString(),
                'next_distribution_label' => CooperativeProfitCycle::where('cooperative_id', $cooperative->id)
                    ->whereIn('status', ['approved', 'draft'])
                    ->latest('cycle_end')
                    ->value('label'),
                'next_distribution_amount' => (float) CooperativeProfitCycle::where('cooperative_id', $cooperative->id)
                    ->whereIn('status', ['approved', 'draft'])
                    ->latest('cycle_end')
                    ->value('distributable_profit'),
            ]
            : null;

        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.business_id', $businessId)
            ->where('orders.order_type', 'sale')
            ->selectRaw("
                products.id,
                products.name,
                COALESCE(SUM(order_items.quantity), 0) as units_sold,
                COALESCE(SUM(order_items.total), 0) as revenue,
                COUNT(DISTINCT orders.id) as order_count
            ")
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => (int) $item->id,
                'name' => $item->name,
                'units_sold' => (float) $item->units_sold,
                'revenue' => (float) $item->revenue,
                'order_count' => (int) $item->order_count,
            ])
            ->values();

        $genericRecentActivity = collect()
            ->concat(
                Order::with('customer')
                    ->where('business_id', $businessId)
                    ->latest()
                    ->limit(6)
                    ->get()
                    ->map(fn (Order $order) => $this->formatOrderActivity($order))
            )
            ->concat(
                Expense::with('category')
                    ->where('business_id', $businessId)
                    ->latest()
                    ->limit(6)
                    ->get()
                    ->map(fn (Expense $expense) => $this->formatExpenseActivity($expense))
            )
            ->concat(
                TrustTransaction::with(['customer', 'trustAccount'])
                    ->where('business_id', $businessId)
                    ->latest()
                    ->limit(6)
                    ->get()
                    ->map(fn (TrustTransaction $transaction) => $this->formatTrustActivity($transaction))
            )
            ->sortByDesc('occurred_at')
            ->values();

        $businessRecentActivity = $this->getBusinessSpecificRecentActivity($businessType, $businessId)
            ->concat($cooperative ? $this->getCooperativeRecentActivity($cooperative) : collect())
            ->sortByDesc('occurred_at')
            ->values();

        $recentActivity = $businessRecentActivity
            ->take(2)
            ->concat(
                $genericRecentActivity
                    ->concat($businessRecentActivity->slice(2))
                    ->sortByDesc('occurred_at')
                    ->take(6)
            )
            ->sortByDesc('occurred_at')
            ->take(8)
            ->values();

        return response()->json([
            'business_type' => $businessType,
            'today_sales' => (float) ($sales?->total_sales ?? 0),
            'today_orders' => (int) ($sales?->order_count ?? 0),
            'customers_count' => Customer::where('business_id', $businessId)->count(),
            'low_stock_count' => $lowStockCount,
            'delivery' => [
                'pickups_pending' => (int) ($deliverySummary?->pickups_pending ?? 0),
                'in_transit' => (int) ($deliverySummary?->in_transit ?? 0),
                'completed_today' => (int) ($deliverySummary?->completed_today ?? 0),
                'ageing_parcels' => (int) ($deliverySummary?->ageing_parcels ?? 0),
                'open_complaints' => DeliveryComplaint::where('business_id', $businessId)->where('status', 'open')->count(),
                'wallet_outflow_today' => (float) DeliveryWalletTransaction::where('business_id', $businessId)
                    ->where('direction', 'credit')
                    ->whereDate('created_at', today())
                    ->sum('amount'),
            ],
            'logistics' => [
                'trips_today' => (clone $logisticsTodayTrips)->count(),
                'active_trips' => (clone $logisticsTripsBase)->whereIn('status', ['dispatched', 'in_transit'])->count(),
                'completed_today' => (clone $logisticsTodayTrips)->where('status', 'completed')->count(),
                'receivables_outstanding' => (float) (clone $logisticsTripsBase)->where('payment_status', '!=', 'paid')->sum('actual_revenue'),
                'revenue_today' => (float) (clone $logisticsTodayTrips)->sum('actual_revenue'),
                'profit_today' => (float) (clone $logisticsTodayTrips)->sum('profit_estimate'),
                'fuel_cost_today' => (float) ($logisticsFuelSummary?->fuel_cost_today ?? 0),
                'litres_today' => (float) ($logisticsFuelSummary?->litres_today ?? 0),
                'fleet_active' => LogisticsFleetAsset::where('business_id', $businessId)->where('status', 'active')->count(),
                'maintenance_open' => LogisticsMaintenanceLog::where('business_id', $businessId)->where('status', '!=', 'resolved')->count(),
                'delayed_stops' => LogisticsTripStop::query()
                    ->join('logistics_trip_sheets', 'logistics_trip_sheets.id', '=', 'logistics_trip_stops.trip_sheet_id')
                    ->where('logistics_trip_sheets.business_id', $businessId)
                    ->where('logistics_trip_stops.status', 'delayed')
                    ->count(),
                'payout_pending' => (float) LogisticsDriverSettlement::where('business_id', $businessId)->where('status', '!=', 'paid')->sum('driver_payout'),
            ],
            'hotel' => [
                'occupied_rooms' => (int) ($hotelSummary?->occupied_rooms ?? 0),
                'total_rooms' => (int) ($hotelSummary?->total_rooms ?? 0),
                'blocked_rooms' => (int) ($hotelSummary?->blocked_rooms ?? 0),
                'cleaning_attention' => (int) ($hotelSummary?->cleaning_attention ?? 0),
                'checkins_today' => (int) ($hotelBookingSummary?->checkins_today ?? 0),
                'revenue_today' => (float) ($hotelBookingSummary?->revenue_today ?? 0),
                'maintenance_open' => HotelMaintenanceRequest::where('business_id', $businessId)->where('status', '!=', 'resolved')->count(),
            ],
            'health' => [
                'patients_count' => (int) ($healthSummary?->patients_count ?? 0),
                'appointments_today' => (int) ($healthAppointments?->appointments_today ?? 0),
                'consultations_today' => (int) ($healthConsultations?->consultations_today ?? 0),
                'unpaid_bills' => (float) ($healthConsultations?->unpaid_bills ?? 0),
                'pending_approvals' => (int) ($healthLab?->pending_approvals ?? 0),
                'abnormal_results' => (int) ($healthLab?->abnormal_results ?? 0),
            ],
            'production' => [
                'units_produced_today' => (float) ($productionSummary?->units_produced_today ?? 0),
                'electricity_cost_today' => (float) ($productionSummary?->electricity_cost_today ?? 0),
                'packaging_cost_today' => (float) ($productionSummary?->packaging_cost_today ?? 0),
                'generator_fuel_today' => (float) ($productionSummary?->generator_fuel_today ?? 0),
                'profit_estimate_today' => (float) ($productionSummary?->profit_estimate_today ?? 0),
                'downtime_today' => (int) ($productionSummary?->downtime_today ?? 0),
            ],
            'school' => [
                'enrolled_students' => (int) $schoolStudents,
                'fees_collected' => (float) $schoolFeesCollected,
                'students_promoted' => (int) $schoolPromoted,
                'attendance_rate' => ($schoolAttendance?->total_count ?? 0) > 0
                    ? round(((int) $schoolAttendance->present_count / (int) $schoolAttendance->total_count) * 100, 1)
                    : 0,
            ],
            'pharmacy' => [
                'near_expiry_batches' => (int) ($pharmacySummary?->near_expiry_batches ?? 0),
                'discounted_batches' => (int) ($pharmacySummary?->discounted_batches ?? 0),
                'expired_units' => (float) ($pharmacySummary?->expired_units ?? 0),
            ],
            'retail' => $retailSummary,
            'wholesale' => $wholesaleSummary,
            'commodity' => $commoditySummary,
            'restaurant' => [
                'active_tables' => RestaurantTable::where('business_id', $businessId)->whereIn('status', ['occupied', 'reserved'])->count(),
                'open_tickets' => (int) ($restaurantSummary?->open_tickets ?? 0),
                'takeaway_today' => (int) ($restaurantSummary?->takeaway_today ?? 0),
                'delivery_today' => (int) ($restaurantSummary?->delivery_today ?? 0),
                'revenue_today' => (float) ($restaurantSummary?->revenue_today ?? 0),
                'gross_margin_today' => (float) ($restaurantSummary?->gross_margin_today ?? 0),
                'pending_kitchen_tickets' => KitchenTicket::where('business_id', $businessId)->whereIn('status', ['queued', 'preparing'])->count(),
                'upcoming_reservations' => TableReservation::where('business_id', $businessId)->where('reservation_for', '>=', now())->count(),
                'open_waiter_shifts' => RestaurantWaiterShift::where('business_id', $businessId)->where('status', 'open')->count(),
                'waste_cost_today' => (float) FoodWasteLog::where('business_id', $businessId)->whereDate('logged_at', $today)->sum('cost_impact'),
            ],
            'mobile_agent' => [
                'volume_today' => (float) ($mobileAgentSummary?->volume_today ?? 0),
                'commissions_today' => (float) ($mobileAgentSummary?->commissions_today ?? 0),
                'float_requests_pending' => MobileAgentFloatRequest::where('business_id', $businessId)->where('status', 'pending')->count(),
                'reversals_pending' => (int) ($mobileAgentSummary?->reversals_pending ?? 0),
                'shortages_open' => MobileAgentShortageLog::where('business_id', $businessId)->where('status', 'open')->count(),
                'fraud_alerts_open' => MobileAgentFraudAlert::where('business_id', $businessId)->where('is_resolved', false)->count(),
            ],
            'textile' => [
                'active_jobs' => (int) ($textileSummary?->active_jobs ?? 0),
                'overdue_jobs' => (int) ($textileSummary?->overdue_jobs ?? 0),
                'debtor_exposure' => (float) ($textileSummary?->debtor_exposure ?? 0),
                'consignment_open' => TextileConsignmentStock::where('business_id', $businessId)->where('status', 'open')->count(),
                'measurements_saved' => TextileCustomerMeasurement::where('business_id', $businessId)->count(),
                'color_variants' => TextileColorVariant::where('business_id', $businessId)->count(),
            ],
            'fuel' => [
                'sales_today' => (float) ($fuelSalesSummary?->sales_today ?? 0),
                'litres_today' => (float) ($fuelSalesSummary?->litres_today ?? 0),
                'variance_today' => (float) ($fuelSalesSummary?->variance_today ?? 0),
                'current_stock_litres' => (float) ($fuelTankSummary?->current_stock_litres ?? 0),
                'low_stock_tanks' => (int) ($fuelTankSummary?->low_stock_tanks ?? 0),
                'open_shifts' => (int) ($fuelShiftSummary?->open_shifts ?? 0),
                'shortage_today' => (float) ($fuelShiftSummary?->shortage_today ?? 0),
                'recovery_today' => (float) ($fuelShiftSummary?->recovery_today ?? 0),
                'alerts_open' => FuelVarianceAlert::where('business_id', $businessId)->where('is_resolved', false)->count(),
            ],
            'agro' => [
                'forecast_quantity' => (float) ($agroForecastSummary?->forecast_quantity ?? 0),
                'reserved_quantity' => (float) ($agroForecastSummary?->reserved_quantity ?? 0),
                'avg_confidence' => round((float) ($agroForecastSummary?->avg_confidence ?? 0), 1),
                'programme_sales_total' => (float) ($agroSubsidySummary?->programme_sales_total ?? 0),
                'subsidy_receivable' => (float) ($agroSubsidySummary?->subsidy_receivable ?? 0),
                'pending_programmes' => (int) ($agroSubsidySummary?->pending_programmes ?? 0),
                'outstanding_credit' => (float) ($agroRecoverySummary?->outstanding_credit ?? 0),
                'open_recoveries' => (int) ($agroRecoverySummary?->open_recoveries ?? 0),
                'advisories_pending' => AgroAdvisoryRecord::where('business_id', $businessId)->where('follow_up_status', '!=', 'completed')->count(),
            ],
            'livestock' => [
                'total_animals' => (int) ($livestockSummary?->total_animals ?? 0),
                'average_weight_kg' => round((float) ($livestockSummary?->average_weight_kg ?? 0), 2),
                'pens' => LivestockPen::where('business_id', $businessId)->count(),
                'milk_today_litres' => (float) LivestockMilkLog::where('business_id', $businessId)->whereDate('recorded_on', $today)->sum('litres'),
                'open_outbreaks' => LivestockDiseaseLog::where('business_id', $businessId)->where('status', 'open')->count(),
                'medication_cost_today' => (float) LivestockMedicationRecord::where('business_id', $businessId)->whereDate('administered_on', $today)->sum('cost'),
                'sales_today' => (float) LivestockSale::where('business_id', $businessId)->whereDate('sold_on', $today)->sum('revenue'),
                'breeding_cycles_open' => LivestockBreedingRecord::where('business_id', $businessId)->whereIn('status', ['planned', 'active'])->count(),
            ],
            'farm' => $farmSummary,
            'beauty' => [
                'appointments_today' => (int) ($beautySummary?->appointments_today ?? 0),
                'completed_today' => (int) ($beautySummary?->completed_today ?? 0),
                'revenue_today' => (float) ($beautySummary?->revenue_today ?? 0),
                'pending_queue' => (int) ($beautySummary?->pending_queue ?? 0),
                'commissions_due' => (float) ($beautySummary?->commissions_due ?? 0),
                'product_cost_today' => (float) ($beautySummary?->product_cost_today ?? 0),
                'active_services' => BeautyServiceModel::where('business_id', $businessId)->where('is_active', true)->count(),
                'active_staff' => BeautyStaffProfile::where('business_id', $businessId)->where('is_active', true)->count(),
            ],
            'service' => [
                'bookings_today' => ServiceBooking::where('business_id', $businessId)->whereDate('scheduled_for', $today)->count(),
                'jobs_created_today' => (int) ($serviceSummary?->jobs_created_today ?? 0),
                'open_jobs' => (int) ($serviceSummary?->open_jobs ?? 0),
                'revenue_today' => (float) ($serviceSummary?->revenue_today ?? 0),
                'invoices_outstanding' => (float) ($serviceSummary?->invoices_outstanding ?? 0),
                'overdue_invoices' => (int) ($serviceSummary?->overdue_invoices ?? 0),
                'active_offerings' => ServiceOffering::where('business_id', $businessId)->where('is_active', true)->count(),
                'assigned_staff' => ServiceStaffProfile::where('business_id', $businessId)->where('is_active', true)->count(),
            ],
            'general_sme' => [
                'sales_today' => (float) ($sales?->total_sales ?? 0),
                'expenses_today' => (float) Expense::where('business_id', $businessId)->whereDate('expense_date', $today)->sum('amount'),
                'cash_in_today' => (float) ($smeCashSummary?->cash_in_today ?? 0),
                'cash_out_today' => (float) ($smeCashSummary?->cash_out_today ?? 0),
                'net_cash_today' => (float) (($smeCashSummary?->cash_in_today ?? 0) - ($smeCashSummary?->cash_out_today ?? 0)),
                'debtor_exposure' => (float) Customer::where('business_id', $businessId)->sum('balance'),
                'followups_due' => SMEFollowUp::where('business_id', $businessId)->where('status', 'open')->whereDate('due_on', '<=', $today)->count(),
                'followups_open' => SMEFollowUp::where('business_id', $businessId)->where('status', 'open')->count(),
                'sales_target' => (float) ($smeTarget?->sales_target ?? 0),
                'collection_target' => (float) ($smeTarget?->collection_target ?? 0),
                'expense_limit' => (float) ($smeTarget?->expense_limit ?? 0),
                'target_attainment' => ($smeTarget && (float) $smeTarget->sales_target > 0)
                    ? round((((float) ($sales?->total_sales ?? 0)) / (float) $smeTarget->sales_target) * 100, 1)
                    : 0,
            ],
            'adashe' => [
                'member_accounts' => (int) ($adasheSummary?->member_accounts ?? 0),
                'total_target' => (float) ($adasheSummary?->total_target ?? 0),
                'total_collected' => (float) ($adasheSummary?->total_collected ?? 0),
                'total_paid_out' => (float) ($adasheSummary?->total_paid_out ?? 0),
                'due_now' => (int) ($adasheSummary?->due_now ?? 0),
                'due_soon' => (int) ($adasheSummary?->due_soon ?? 0),
                'average_frequency_days' => (int) round((float) ($adasheSummary?->average_frequency_days ?? 0)),
                'completion_rate' => (float) (($adasheSummary?->total_target ?? 0) > 0
                    ? round((((float) $adasheSummary->total_collected) / ((float) $adasheSummary->total_target)) * 100, 1)
                    : 0),
                'next_due_date' => $adasheLead?->next_due_date?->toDateString(),
                'next_due_member' => $adasheLead?->customer?->name,
                'lead_cycle_name' => $adasheLead?->cycle_name,
            ],
            'trust_fund' => [
                'account_count' => (int) ($trustFundSummary?->account_count ?? 0),
                'total_extended' => (float) ($trustFundSummary?->total_extended ?? 0),
                'total_outstanding' => (float) ($trustFundSummary?->total_outstanding ?? 0),
                'total_collected' => (float) ($trustFundSummary?->total_collected ?? 0),
                'active_balance_accounts' => (int) ($trustFundSummary?->active_balance_accounts ?? 0),
                'overdue_accounts' => (int) ($trustFundSummary?->overdue_accounts ?? 0),
                'high_utilization_accounts' => (int) ($trustFundSummary?->high_utilization_accounts ?? 0),
                'lead_customer_name' => $trustFundLead?->customer?->name,
                'lead_balance' => (float) ($trustFundLead?->balance ?? 0),
                'lead_last_payment_date' => $trustFundLead?->last_payment_date?->toDateString(),
                'lead_review_date' => $trustFundLead?->last_payment_date?->copy()->addDays(30)?->toDateString(),
            ],
            'cooperative' => $cooperativeSummary,
            'pure_water_retail' => [
                'revenue_today' => (float) ($pureWaterRetailSales?->revenue_today ?? 0),
                'wholesale_revenue_today' => (float) ($pureWaterRetailSales?->wholesale_revenue_today ?? 0),
                'retail_revenue_today' => (float) ($pureWaterRetailSales?->retail_revenue_today ?? 0),
                'packages_sold_today' => (float) ($pureWaterRetailPackages?->packages_sold_today ?? 0),
                'transfers_out_today' => (float) ($pureWaterRetailPackages?->transfers_out_today ?? 0),
                'crates_outstanding' => (float) ($pureWaterRetailCrates?->crates_outstanding ?? 0),
                'pricing_tiers' => PureWaterRetailPriceTier::where('business_id', $businessId)->count(),
                'retailer_debt' => (float) Customer::where('business_id', $businessId)->sum('balance'),
            ],
            'construction' => [
                'today_sales' => (float) ($constructionSalesSummary?->sales_today ?? 0),
                'outstanding_debts' => (float) ($constructionSummary?->outstanding_debts ?? 0),
                'pending_deliveries' => ConstructionDelivery::where('business_id', $businessId)->whereNotIn('status', ['delivered', 'cancelled'])->count(),
                'quotations_pending' => ConstructionQuotation::where('business_id', $businessId)->whereIn('status', ['draft', 'sent'])->count(),
                'top_contractor' => Order::query()
                    ->join('customers', 'customers.id', '=', 'orders.customer_id')
                    ->where('orders.business_id', $businessId)
                    ->groupBy('customers.name')
                    ->selectRaw('customers.name, SUM(orders.total) as revenue')
                    ->orderByDesc('revenue')
                    ->value('customers.name'),
                'monthly_profit_estimate' => (float) Order::with('items.product')
                    ->where('business_id', $businessId)
                    ->where('created_at', '>=', now()->startOfMonth())
                    ->get()
                    ->sum(fn ($order) => $order->items->sum(fn ($item) => (float) $item->total - ((float) ($item->product?->cost_price ?? 0) * (float) $item->quantity))),
            ],
            'warehouse' => $ngoSummary,
            'ngo_warehouse' => $ngoSummary,
            'ai' => $aiSummary,
            'top_products' => $topProducts,
            'recent_activity' => $recentActivity,
            'owner_focus' => [
                'profit_driver' => $industryFocus['profit_driver'] ?? null,
                'profit_killers' => $industryFocus['profit_killers'] ?? [],
                'fraud_losses' => $industryFocus['fraud_losses'] ?? [],
                'daily_decisions' => $industryFocus['daily_decisions'] ?? [],
                'monthly_reports' => $industryFocus['monthly_reports'] ?? [],
                'feature_highlights' => $industryFocus['feature_highlights'] ?? [],
            ],
        ]);
    }

    private function formatOrderActivity(Order $order): array
    {
        $statusLabel = $order->status ? ucfirst((string) $order->status) : 'Completed';

        return [
            'type' => 'order',
            'title' => $order->customer?->name
                ? "Sale for {$order->customer->name}"
                : 'Walk-in sale recorded',
            'description' => "{$statusLabel} order #{$order->id}",
            'amount' => (float) $order->total,
            'tone' => 'emerald',
            'occurred_at' => optional($order->created_at)->toIso8601String(),
            'action_path' => '/pos',
        ];
    }

    private function formatExpenseActivity(Expense $expense): array
    {
        return [
            'type' => 'expense',
            'title' => $expense->description ?: 'Expense recorded',
            'description' => $expense->category?->name
                ? "Expense in {$expense->category->name}"
                : 'Operational expense logged',
            'amount' => (float) $expense->amount,
            'tone' => 'amber',
            'occurred_at' => optional($expense->created_at)->toIso8601String(),
            'action_path' => '/expenses',
        ];
    }

    private function formatTrustActivity(TrustTransaction $transaction): array
    {
        $isContribution = $transaction->trustAccount?->account_type === 'contribution';
        $actionPath = $isContribution ? '/adashe' : '/trust-fund';

        $typeMap = [
            'contribution' => ['Contribution collected', 'sky'],
            'payout' => ['Payout recorded', 'violet'],
            'draw' => ['Trust draw released', 'violet'],
            'repayment' => ['Repayment received', 'emerald'],
        ];

        [$defaultTitle, $tone] = $typeMap[$transaction->type] ?? ['Trust transaction recorded', 'slate'];

        return [
            'type' => 'trust_transaction',
            'title' => $transaction->customer?->name
                ? "{$defaultTitle} for {$transaction->customer->name}"
                : $defaultTitle,
            'description' => $transaction->trustAccount?->cycle_name
                ?: $transaction->reference
                ?: ucfirst(str_replace('_', ' ', (string) $transaction->type)),
            'amount' => (float) $transaction->amount,
            'tone' => $tone,
            'occurred_at' => optional($transaction->created_at)->toIso8601String(),
            'action_path' => $actionPath,
        ];
    }

    private function getBusinessSpecificRecentActivity(?string $businessType, int $businessId): Collection
    {
        return match ($businessType) {
            'pharmacy' => PharmacyDispense::query()
                ->with(['customer', 'product', 'substitutedFrom'])
                ->where('business_id', $businessId)
                ->latest('dispensed_at')
                ->limit(3)
                ->get()
                ->map(fn (PharmacyDispense $dispense) => $this->formatPharmacyDispenseActivity($dispense))
                ->concat(
                    RefillReminder::query()
                        ->with(['customer', 'product', 'dispense'])
                        ->where('business_id', $businessId)
                        ->latest('due_on')
                        ->limit(2)
                        ->get()
                        ->map(fn (RefillReminder $reminder) => $this->formatPharmacyRefillActivity($reminder))
                )
                ->sortByDesc('occurred_at')
                ->take(4)
                ->values(),
            'delivery_company' => DeliveryOrder::query()
                ->latest()
                ->where('business_id', $businessId)
                ->limit(4)
                ->get()
                ->map(fn (DeliveryOrder $order) => $this->formatDeliveryActivity($order)),
            'logistics' => LogisticsTripSheet::query()
                ->latest()
                ->where('business_id', $businessId)
                ->limit(4)
                ->get()
                ->map(fn (LogisticsTripSheet $trip) => $this->formatLogisticsActivity($trip)),
            'pure_water_factory' => ProductionBatch::query()
                ->latest()
                ->where('business_id', $businessId)
                ->limit(4)
                ->get()
                ->map(fn (ProductionBatch $batch) => $this->formatProductionBatchActivity($batch)),
            'restaurant' => RestaurantTicket::query()
                ->latest()
                ->where('business_id', $businessId)
                ->limit(4)
                ->get()
                ->map(fn (RestaurantTicket $ticket) => $this->formatRestaurantActivity($ticket)),
            'warehouse', 'ngo_warehouse' => NGODistribution::query()
                ->latest()
                ->where('business_id', $businessId)
                ->limit(4)
                ->get()
                ->map(fn (NGODistribution $distribution) => $this->formatNgoDistributionActivity($distribution)),
            default => collect(),
        };
    }

    private function getCooperativeRecentActivity(Cooperative $cooperative): Collection
    {
        return CooperativeFinancing::query()
            ->with('member.customer')
            ->where('cooperative_id', $cooperative->id)
            ->latest()
            ->limit(2)
            ->get()
            ->map(fn (CooperativeFinancing $financing) => $this->formatCooperativeFinancingActivity($financing))
            ->concat(
                CooperativeProfitCycle::query()
                    ->where('cooperative_id', $cooperative->id)
                    ->latest()
                    ->limit(2)
                    ->get()
                    ->map(fn (CooperativeProfitCycle $cycle) => $this->formatCooperativeProfitCycleActivity($cycle))
            )
            ->sortByDesc('occurred_at')
            ->take(4)
            ->values();
    }

    private function formatDeliveryActivity(DeliveryOrder $order): array
    {
        $statusLabel = ucfirst(str_replace('_', ' ', (string) $order->status));

        return [
            'type' => 'delivery_order',
            'title' => $order->tracking_code
                ? "Delivery {$order->tracking_code}"
                : 'Delivery job recorded',
            'description' => "{$statusLabel} to {$order->dropoff_address}",
            'amount' => (float) $order->total_fee,
            'tone' => in_array($order->status, ['delivered', 'picked_up'], true) ? 'emerald' : 'sky',
            'occurred_at' => optional($order->created_at)->toIso8601String(),
            'action_path' => '/deliveries?section=dispatch',
        ];
    }

    private function formatLogisticsActivity(LogisticsTripSheet $trip): array
    {
        return [
            'type' => 'logistics_trip',
            'title' => $trip->trip_code
                ? "Trip {$trip->trip_code}"
                : ($trip->route_name ? "Trip {$trip->route_name}" : 'Logistics trip updated'),
            'description' => ucfirst((string) $trip->status) . ($trip->destination ? " to {$trip->destination}" : ''),
            'amount' => (float) ($trip->actual_revenue ?: $trip->expected_revenue ?: 0),
            'tone' => $trip->status === 'completed' ? 'emerald' : 'sky',
            'occurred_at' => optional($trip->departed_at ?: $trip->created_at)->toIso8601String(),
            'action_path' => '/logistics?section=trips',
        ];
    }

    private function formatProductionBatchActivity(ProductionBatch $batch): array
    {
        return [
            'type' => 'production_batch',
            'title' => $batch->batch_number
                ? "Production {$batch->batch_number}"
                : 'Production batch recorded',
            'description' => number_format((float) $batch->total_output_quantity, 0) . " units output • " . ucfirst((string) $batch->status),
            'amount' => (float) ($batch->net_margin ?: $batch->estimated_revenue ?: 0),
            'tone' => $batch->status === 'completed' ? 'emerald' : 'amber',
            'occurred_at' => optional($batch->created_at)->toIso8601String(),
            'action_path' => '/production?section=batches',
        ];
    }

    private function formatRestaurantActivity(RestaurantTicket $ticket): array
    {
        return [
            'type' => 'restaurant_ticket',
            'title' => $ticket->ticket_number
                ? "Ticket {$ticket->ticket_number}"
                : ($ticket->guest_name ? "Order for {$ticket->guest_name}" : 'Restaurant order updated'),
            'description' => ucfirst((string) $ticket->service_status) . " • " . ucfirst(str_replace('_', ' ', (string) $ticket->order_channel)),
            'amount' => (float) $ticket->total,
            'tone' => in_array($ticket->service_status, ['served', 'closed'], true) ? 'emerald' : 'amber',
            'occurred_at' => optional($ticket->opened_at ?: $ticket->created_at)->toIso8601String(),
            'action_path' => '/restaurant?section=tickets',
        ];
    }

    private function formatPharmacyDispenseActivity(PharmacyDispense $dispense): array
    {
        $productName = $dispense->product?->name ?: 'medicine';
        $customerName = $dispense->customer?->name;
        $descriptionParts = [
            number_format((float) $dispense->quantity, 0) . ' units dispensed',
        ];

        if ($dispense->substitutedFrom?->name) {
            $descriptionParts[] = "Substituted from {$dispense->substitutedFrom->name}";
        }

        if ($dispense->refill_due) {
            $descriptionParts[] = 'Refill follow-up due';
        }

        return [
            'type' => 'pharmacy_dispense',
            'title' => $customerName
                ? "Dispensed {$productName} for {$customerName}"
                : "Dispensed {$productName}",
            'description' => implode(' - ', $descriptionParts),
            'amount' => (float) $dispense->total_amount,
            'tone' => $dispense->refill_due ? 'amber' : 'emerald',
            'occurred_at' => optional($dispense->dispensed_at ?: $dispense->created_at)->toIso8601String(),
            'action_path' => '/pharmacy?section=dispense',
        ];
    }

    private function formatPharmacyRefillActivity(RefillReminder $reminder): array
    {
        $productName = $reminder->product?->name ?: 'medicine';
        $customerName = $reminder->customer?->name ?: 'customer';
        $statusLabel = ucfirst(str_replace('_', ' ', (string) $reminder->status));

        return [
            'type' => 'pharmacy_refill',
            'title' => "Refill reminder for {$customerName}",
            'description' => "{$productName} - {$statusLabel}",
            'amount' => $reminder->dispense?->total_amount !== null ? (float) $reminder->dispense->total_amount : null,
            'tone' => $reminder->status === 'pending' ? 'amber' : 'sky',
            'occurred_at' => optional($reminder->due_on)->toDateString(),
            'action_path' => '/pharmacy?section=refills',
        ];
    }

    private function formatCooperativeFinancingActivity(CooperativeFinancing $financing): array
    {
        $memberName = $financing->member?->customer?->name;
        $statusLabel = ucfirst(str_replace('_', ' ', (string) $financing->status));
        $typeLabel = strtoupper(str_replace('_', '-', (string) $financing->financing_type));

        return [
            'type' => 'cooperative_financing',
            'title' => $memberName
                ? "{$typeLabel} for {$memberName}"
                : "{$typeLabel} financing updated",
            'description' => $statusLabel,
            'amount' => (float) ($financing->amount_disbursed ?: $financing->amount_requested ?: 0),
            'tone' => in_array($financing->status, ['approved', 'disbursed', 'active_repayment'], true) ? 'violet' : 'amber',
            'occurred_at' => optional(
                $financing->disbursed_at
                ?: $financing->approved_at
                ?: $financing->submitted_at
                ?: $financing->created_at
            )->toIso8601String(),
            'action_path' => '/cooperative?section=financing',
        ];
    }

    private function formatCooperativeProfitCycleActivity(CooperativeProfitCycle $cycle): array
    {
        $statusLabel = ucfirst(str_replace('_', ' ', (string) $cycle->status));

        return [
            'type' => 'cooperative_profit_cycle',
            'title' => $cycle->label
                ? "Profit cycle {$cycle->label}"
                : 'Cooperative profit cycle updated',
            'description' => "{$statusLabel} - Distributable profit ready",
            'amount' => (float) $cycle->distributable_profit,
            'tone' => $cycle->status === 'distributed' ? 'emerald' : 'sky',
            'occurred_at' => optional($cycle->distributed_at ?: $cycle->created_at)->toIso8601String(),
            'action_path' => '/cooperative?section=profits',
        ];
    }

    private function formatNgoDistributionActivity(NGODistribution $distribution): array
    {
        return [
            'type' => 'warehouse_distribution',
            'title' => $distribution->distribution_reference
                ? "Distribution {$distribution->distribution_reference}"
                : 'Warehouse release recorded',
            'description' => ucfirst((string) $distribution->status) . ($distribution->destination_location ? " to {$distribution->destination_location}" : ''),
            'amount' => null,
            'tone' => $distribution->status === 'completed' ? 'emerald' : 'sky',
            'occurred_at' => optional($distribution->created_at)->toIso8601String(),
            'action_path' => '/warehouse',
        ];
    }
}
