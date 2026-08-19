<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\AIInsightController;
use App\Http\Controllers\API\CustomerController;
use App\Http\Controllers\API\CustomerGroupController;
use App\Http\Controllers\API\SupplierController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\ExpenseController;
use App\Http\Controllers\API\ExpenseCategoryController;
use App\Http\Controllers\API\TrustFundController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\ProductCategoryController;
use App\Http\Controllers\API\StaffController;
use App\Http\Controllers\API\LegacyReferralController;
use App\Http\Controllers\API\DeliveryController;
use App\Http\Controllers\API\DeliveryOperationsController;
use App\Http\Controllers\API\DeliveryVehicleController;
use App\Http\Controllers\API\LogisticsController;
use App\Http\Controllers\API\HotelController;
use App\Http\Controllers\API\HealthController;
use App\Http\Controllers\API\SchoolController;
use App\Http\Controllers\API\RestaurantController;
use App\Http\Controllers\API\MobileAgentController;
use App\Http\Controllers\API\TextileController;
use App\Http\Controllers\API\FuelController;
use App\Http\Controllers\API\AgroDealerController;
use App\Http\Controllers\API\CommodityController;
use App\Http\Controllers\API\LivestockController;
use App\Http\Controllers\API\FarmController;
use App\Http\Controllers\API\BeautyController;
use App\Http\Controllers\API\GeneralSMEController;
use App\Http\Controllers\API\ServiceBusinessController;
use App\Http\Controllers\API\ConstructionMaterialsController;
use App\Http\Controllers\API\NGOWarehouseController;
use App\Http\Controllers\API\PureWaterRetailController;
use App\Http\Controllers\API\RetailController;
use App\Http\Controllers\API\WholesaleController;
use App\Http\Controllers\API\CooperativeController;
use App\Http\Controllers\API\BillingController;
use App\Http\Controllers\API\PartnerReferralController;
use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\BusinessTeamController;
use App\Http\Controllers\API\PurchaseController;

Route::get('/', fn () => response()->json(['status' => 'Taska API', 'version' => '1.0']));

Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/team-invites/accept', [\App\Http\Controllers\API\TeamInviteController::class, 'accept']);
});

// Public lookup for the accept-invite page (display only - the token itself
// is the secret, no auth needed to view who invited you).
Route::get('/team-invites/{token}', [\App\Http\Controllers\API\TeamInviteController::class, 'show']);

Route::get('/tracking/{trackingCode}', [DeliveryController::class, 'trackByCode']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::patch('/auth/current-business', [AuthController::class, 'updateCurrentBusiness']);
    Route::post('/auth/switch-business', [AuthController::class, 'switchBusiness']);
    Route::post('/auth/business/active-types', [AuthController::class, 'addActiveBusinessType']);
    Route::get('/auth/business/modules', [AuthController::class, 'availableModules']);
    Route::patch('/auth/business/modules', [AuthController::class, 'updateModules']);
    Route::post('/auth/businesses', [AuthController::class, 'createBusiness']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::middleware('role:admin')->group(function () {
        Route::get('/auth/team', [BusinessTeamController::class, 'index']);
        Route::post('/auth/team', [BusinessTeamController::class, 'store']);
        Route::patch('/auth/team/{member}', [BusinessTeamController::class, 'update']);
        Route::post('/auth/team/{member}/resend-invite', [BusinessTeamController::class, 'resendInvite']);
        Route::get('/branches', [\App\Http\Controllers\API\BranchController::class, 'index']);
        Route::post('/branches', [\App\Http\Controllers\API\BranchController::class, 'store']);
        Route::patch('/branches/{branch}', [\App\Http\Controllers\API\BranchController::class, 'update']);
        Route::get('/access-audit-log', [\App\Http\Controllers\API\AccessAuditLogController::class, 'index']);
    });

    // Dashboard
    Route::get('/dashboard', DashboardController::class);
    Route::get('/portfolio', \App\Http\Controllers\API\PortfolioController::class);

    // Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::patch('/products/{product}', [ProductController::class, 'update']);

    // Product Categories
    Route::get('/product-categories', [ProductCategoryController::class, 'index']);
    Route::post('/product-categories', [ProductCategoryController::class, 'store']);
    Route::patch('/product-categories/{category}', [ProductCategoryController::class, 'update']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::patch('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);

    // Customer Groups
    Route::get('/customer-groups', [CustomerGroupController::class, 'index']);
    Route::post('/customer-groups', [CustomerGroupController::class, 'store']);
    Route::patch('/customer-groups/{group}', [CustomerGroupController::class, 'update']);
    Route::delete('/customer-groups/{group}', [CustomerGroupController::class, 'destroy']);

    // Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::get('/suppliers/{supplier}', [SupplierController::class, 'show']);
    Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);

    // Purchases / Goods Received / Supplier Payments
    Route::get('/purchases', [PurchaseController::class, 'index']);
    Route::post('/purchases', [PurchaseController::class, 'store']);
    Route::get('/purchases/{purchase}', [PurchaseController::class, 'show']);
    Route::post('/purchases/{purchase}/receive', [PurchaseController::class, 'receive']);
    Route::post('/purchases/{purchase}/payments', [PurchaseController::class, 'recordPayment']);

    // Orders / POS
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/return', [OrderController::class, 'returnOrder']);
    Route::get('/orders/today', [OrderController::class, 'todaySales']);

    // Retail and Supermarket Operations
    Route::get('/retail/overview', [RetailController::class, 'overview']);
    Route::post('/retail/shifts/open', [RetailController::class, 'openShift']);
    Route::post('/retail/shifts/{shift}/close', [RetailController::class, 'closeShift']);
    Route::post('/retail/loyalty-customers', [RetailController::class, 'storeLoyaltyCustomer']);
    Route::post('/retail/petty-cash', [RetailController::class, 'storePettyCash']);
    Route::post('/retail/sales', [RetailController::class, 'storeSale']);
    Route::post('/retail/orders/{order}/refund', [RetailController::class, 'refund']);

    // Pure Water Retail
    Route::get('/pure-water-retail/overview', [PureWaterRetailController::class, 'overview']);
    Route::post('/pure-water-retail/price-tiers', [PureWaterRetailController::class, 'storePriceTier']);
    Route::post('/pure-water-retail/sales', [PureWaterRetailController::class, 'storeSale']);
    Route::post('/pure-water-retail/package-movements', [PureWaterRetailController::class, 'storePackageMovement']);
    Route::post('/pure-water-retail/crates', [PureWaterRetailController::class, 'storeCrateMovement']);
    Route::post('/pure-water-retail/transfers', [PureWaterRetailController::class, 'transfer']);

    // Wholesale and distributor operations
    Route::get('/wholesale/overview', [WholesaleController::class, 'overview']);
    Route::post('/wholesale/sales-reps', [WholesaleController::class, 'storeSalesRep']);
    Route::post('/wholesale/price-tiers', [WholesaleController::class, 'storePriceTier']);
    Route::post('/wholesale/route-runs', [WholesaleController::class, 'storeRouteRun']);
    Route::patch('/wholesale/route-runs/{routeRun}', [WholesaleController::class, 'updateRouteRun']);
    Route::post('/wholesale/orders', [WholesaleController::class, 'storeOrder']);
    Route::post('/wholesale/transfers', [WholesaleController::class, 'storeTransfer']);

    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/summary', [ExpenseController::class, 'summary']);

    // Expense Categories
    Route::get('/expense-categories', [ExpenseCategoryController::class, 'index']);
    Route::post('/expense-categories', [ExpenseCategoryController::class, 'store']);
    Route::patch('/expense-categories/{category}', [ExpenseCategoryController::class, 'update']);

    // Approval requests - deferred actions (expense creation, inventory
    // adjustments, order discounts) queued when they exceed a business's
    // configured threshold. Review/decide is admin-only; the deferred
    // action itself is created by whichever route triggered it (see
    // ExpenseController::store, InventoryController::adjust,
    // OrderController::store).
    Route::middleware('role:admin')->group(function () {
        Route::get('/approvals', [\App\Http\Controllers\API\ApprovalController::class, 'index']);
        Route::post('/approvals/{approval}/approve', [\App\Http\Controllers\API\ApprovalController::class, 'approve']);
        Route::post('/approvals/{approval}/decline', [\App\Http\Controllers\API\ApprovalController::class, 'decline']);
        Route::get('/approvals/settings', [\App\Http\Controllers\API\ApprovalController::class, 'settings']);
        Route::patch('/approvals/settings', [\App\Http\Controllers\API\ApprovalController::class, 'updateSettings']);
    });

    // Trust Fund
    Route::get('/trust-accounts', [TrustFundController::class, 'index']);
    Route::post('/trust-accounts', [TrustFundController::class, 'createAccount']);
    Route::get('/trust-accounts/overdue', [TrustFundController::class, 'overdue']);
    Route::get('/trust-accounts/{trustAccount}', [TrustFundController::class, 'show']);
    Route::post('/trust-accounts/{trustAccount}/draw', [TrustFundController::class, 'draw']);
    Route::post('/trust-accounts/{trustAccount}/repay', [TrustFundController::class, 'repay']);
    Route::get('/trust-accounts/{trustAccount}/transactions', [TrustFundController::class, 'transactionHistory']);

    // Taska Cooperative
    Route::get('/cooperative', [CooperativeController::class, 'show']);
    Route::post('/cooperative/setup', [CooperativeController::class, 'setup']);
    Route::get('/cooperative/dashboard', [CooperativeController::class, 'dashboard']);
    Route::get('/cooperative/members', [CooperativeController::class, 'members']);
    Route::post('/cooperative/members', [CooperativeController::class, 'storeMember']);
    Route::get('/cooperative/shares', [CooperativeController::class, 'shares']);
    Route::post('/cooperative/shares/purchase', [CooperativeController::class, 'purchaseShares']);
    Route::get('/cooperative/financing', [CooperativeController::class, 'financing']);
    Route::post('/cooperative/financing', [CooperativeController::class, 'storeFinancing']);
    Route::post('/cooperative/financing/{financing}/guarantors/{memberId}/approve', [CooperativeController::class, 'approveGuarantor']);
    Route::patch('/cooperative/financing/{financing}/status', [CooperativeController::class, 'updateFinancingStatus']);
    Route::post('/cooperative/financing/{financing}/reports', [CooperativeController::class, 'storeFinancingReport']);
    Route::get('/cooperative/investments', [CooperativeController::class, 'investments']);
    Route::post('/cooperative/investments', [CooperativeController::class, 'storeInvestment']);
    Route::get('/cooperative/profit-cycles', [CooperativeController::class, 'profitCycles']);
    Route::post('/cooperative/profit-cycles', [CooperativeController::class, 'storeProfitCycle']);
    Route::post('/cooperative/profit-cycles/{profitCycle}/distribute', [CooperativeController::class, 'distributeProfit']);
    Route::get('/cooperative/withdrawals', [CooperativeController::class, 'withdrawals']);
    Route::post('/cooperative/withdrawals', [CooperativeController::class, 'storeWithdrawal']);
    Route::get('/cooperative/governance', [CooperativeController::class, 'governance']);
    Route::post('/cooperative/governance', [CooperativeController::class, 'storeGovernance']);
    Route::get('/cooperative/reports', [CooperativeController::class, 'reports']);
    Route::get('/cooperative/settings', [CooperativeController::class, 'settings']);

    // Staff
    Route::get('/staff', [StaffController::class, 'index']);
    Route::post('/staff', [StaffController::class, 'store']);
    Route::get('/staff/{staff}', [StaffController::class, 'show']);
    Route::patch('/staff/{staff}', [StaffController::class, 'update']);

    // Referrals (legacy)
    Route::get('/referrals', [LegacyReferralController::class, 'index']);
    Route::post('/referrals/generate', [LegacyReferralController::class, 'generate']);
    Route::get('/referrals/apply', [LegacyReferralController::class, 'apply']);
    Route::get('/referrals/earnings', [LegacyReferralController::class, 'earnings']);

    // Billing / Subscription
    Route::get('/billing/plans', [BillingController::class, 'getPlans']);
    Route::get('/billing/plans/{slug}', [BillingController::class, 'getPlan']);
    Route::get('/billing/subscription', [BillingController::class, 'getSubscription']);
    Route::post('/billing/subscribe', [BillingController::class, 'subscribe']);
    Route::post('/billing/cancel', [BillingController::class, 'cancelSubscription']);
    Route::get('/billing/invoices', [BillingController::class, 'getInvoices']);
    Route::get('/billing/invoices/{id}', [BillingController::class, 'getInvoice']);
    Route::post('/billing/init-payment', [BillingController::class, 'initPayment']);
    Route::post('/billing/verify-payment', [BillingController::class, 'verifyPayment']);
    Route::get('/billing/payment-methods', [BillingController::class, 'getPaymentMethods']);
    Route::post('/billing/payment-methods', [BillingController::class, 'addPaymentMethod']);
    Route::post('/billing/payment-methods/{id}/default', [BillingController::class, 'setDefaultPaymentMethod']);
    Route::delete('/billing/payment-methods/{id}', [BillingController::class, 'removePaymentMethod']);
    Route::get('/billing/check-limit', [BillingController::class, 'checkLimit']);

    // Referral Partner System
    Route::get('/partners', [PartnerReferralController::class, 'getAgents']);
    Route::post('/partners/register', [PartnerReferralController::class, 'registerAgent']);
    Route::get('/partners/{id}', [PartnerReferralController::class, 'getAgent'])->whereNumber('id');
    Route::post('/partners/{id}/approve', [PartnerReferralController::class, 'approveAgent'])->whereNumber('id');
    Route::patch('/partners/{id}', [PartnerReferralController::class, 'updateAgent'])->whereNumber('id');
    Route::get('/partners/tiers', [PartnerReferralController::class, 'getTiers']);
    Route::get('/partners/commissions', [PartnerReferralController::class, 'getCommissions']);
    Route::post('/partners/commissions/{id}/approve', [PartnerReferralController::class, 'approveCommission'])->whereNumber('id');
    Route::get('/partners/payouts', [PartnerReferralController::class, 'getPayouts']);
    Route::post('/partners/payouts', [PartnerReferralController::class, 'createPayout']);
    Route::post('/partners/payouts/{id}/process', [PartnerReferralController::class, 'processPayout'])->whereNumber('id');
    Route::get('/partners/stats', [PartnerReferralController::class, 'getDashboardStats']);

    // Reports
    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/inventory', [ReportController::class, 'inventory']);
    Route::get('/reports/expenses', [ReportController::class, 'expenses']);
    Route::get('/reports/customers', [ReportController::class, 'customers']);
    Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss']);

    // AI Insights
    Route::get('/ai/insights', [AIInsightController::class, 'index']);
    Route::post('/ai/insights/{id}/read', [AIInsightController::class, 'markRead']);
    Route::post('/ai/insights/{id}/dismiss', [AIInsightController::class, 'dismiss']);
    Route::post('/ai/insights/{id}/restore', [AIInsightController::class, 'restore']);

    // Gamification (data model - see docs/TASKA_DESIGN_CONSTITUTION.md)
    Route::get('/gamification/overview', [\App\Http\Controllers\API\GamificationController::class, 'overview']);

    // Web Push subscriptions - any authenticated team member manages their
    // own device subscriptions, not admin-only.
    Route::post('/push-subscriptions', [\App\Http\Controllers\API\PushSubscriptionController::class, 'store']);
    Route::delete('/push-subscriptions', [\App\Http\Controllers\API\PushSubscriptionController::class, 'destroy']);
    Route::get('/push-subscriptions/public-key', [\App\Http\Controllers\API\PushSubscriptionController::class, 'publicKey']);

    // Offline queue replay - wires OfflineSyncService's existing conflict
    // strategy map to a real endpoint. Replays each queued action through
    // the normal internal routing stack (same auth/validation/tenant
    // scoping as a live request) instead of duplicating that logic here.
    Route::post('/offline/replay', [\App\Http\Controllers\API\OfflineSyncController::class, 'replay']);

    // Inventory
    Route::get('/inventory', [\App\Http\Controllers\API\InventoryController::class, 'index']);
    Route::get('/inventory/low-stock', [\App\Http\Controllers\API\InventoryController::class, 'lowStock']);
    Route::post('/inventory/adjust', [\App\Http\Controllers\API\InventoryController::class, 'adjust']);
    Route::get('/inventory/movements', [\App\Http\Controllers\API\InventoryController::class, 'movements']);

    // Manufacturing / Production
    Route::get('/production/overview', [\App\Http\Controllers\API\ProductionController::class, 'overview']);
    Route::get('/production/batches', [\App\Http\Controllers\API\ProductionController::class, 'index']);
    Route::post('/production/batches', [\App\Http\Controllers\API\ProductionController::class, 'store']);
    Route::get('/production/batches/{batch}', [\App\Http\Controllers\API\ProductionController::class, 'show']);
    Route::post('/production/batches/{batch}/start', [\App\Http\Controllers\API\ProductionController::class, 'start']);
    Route::post('/production/batches/{batch}/complete', [\App\Http\Controllers\API\ProductionController::class, 'complete']);
    Route::post('/production/purchases', [\App\Http\Controllers\API\ProductionController::class, 'storePurchase']);
    Route::post('/production/energy-logs', [\App\Http\Controllers\API\ProductionController::class, 'storeEnergyLog']);
    Route::post('/production/wastage-logs', [\App\Http\Controllers\API\ProductionController::class, 'storeWastageLog']);
    Route::get('/raw-materials', [\App\Http\Controllers\API\ProductionController::class, 'rawMaterials']);
    Route::post('/raw-materials', [\App\Http\Controllers\API\ProductionController::class, 'storeRawMaterial']);
    Route::post('/raw-materials/{material}/adjust', [\App\Http\Controllers\API\ProductionController::class, 'adjustRawMaterial']);

    // Grain Milling / Processing
    Route::get('/grain-milling/overview', [\App\Http\Controllers\API\GrainMillingController::class, 'overview']);
    Route::get('/grain-milling/batches', [\App\Http\Controllers\API\GrainMillingController::class, 'index']);
    Route::post('/grain-milling/batches', [\App\Http\Controllers\API\GrainMillingController::class, 'store']);

    // Livestock Trading / Market
    Route::get('/livestock-market/overview', [\App\Http\Controllers\API\LivestockMarketController::class, 'overview']);
    Route::get('/livestock-market/transactions', [\App\Http\Controllers\API\LivestockMarketController::class, 'index']);
    Route::post('/livestock-market/transactions', [\App\Http\Controllers\API\LivestockMarketController::class, 'store']);

    // Leather / Hides & Skins
    Route::get('/leather-trading/overview', [\App\Http\Controllers\API\LeatherTradingController::class, 'overview']);
    Route::get('/leather-trading/batches', [\App\Http\Controllers\API\LeatherTradingController::class, 'index']);
    Route::post('/leather-trading/batches', [\App\Http\Controllers\API\LeatherTradingController::class, 'store']);

    // Property Management / Rent Collection
    Route::get('/property-management/overview', [\App\Http\Controllers\API\PropertyManagementController::class, 'overview']);
    Route::get('/property-management/units', [\App\Http\Controllers\API\PropertyManagementController::class, 'units']);
    Route::post('/property-management/units', [\App\Http\Controllers\API\PropertyManagementController::class, 'storeUnit']);
    Route::get('/property-management/leases', [\App\Http\Controllers\API\PropertyManagementController::class, 'leases']);
    Route::post('/property-management/leases', [\App\Http\Controllers\API\PropertyManagementController::class, 'storeLease']);
    Route::post('/property-management/leases/{lease}/payments', [\App\Http\Controllers\API\PropertyManagementController::class, 'recordPayment']);
    Route::get('/property-management/maintenance-requests', [\App\Http\Controllers\API\PropertyManagementController::class, 'maintenanceRequests']);
    Route::post('/property-management/maintenance-requests', [\App\Http\Controllers\API\PropertyManagementController::class, 'storeMaintenanceRequest']);

    // Warehouses
    Route::get('/warehouses', [\App\Http\Controllers\API\WarehouseController::class, 'index']);
    Route::post('/warehouses', [\App\Http\Controllers\API\WarehouseController::class, 'store']);
    Route::patch('/warehouses/{warehouse}', [\App\Http\Controllers\API\WarehouseController::class, 'update']);

    // Pharmacy - Batches & Expiry
    Route::get('/pharmacy/overview', [\App\Http\Controllers\API\PharmacyController::class, 'overview']);
    Route::get('/pharmacy/substitutions', [\App\Http\Controllers\API\PharmacyController::class, 'substitutions']);
    Route::post('/pharmacy/substitutions', [\App\Http\Controllers\API\PharmacyController::class, 'storeSubstitution']);
    Route::get('/pharmacy/controlled-logs', [\App\Http\Controllers\API\PharmacyController::class, 'controlledLogs']);
    Route::get('/pharmacy/refill-reminders', [\App\Http\Controllers\API\PharmacyController::class, 'reminders']);
    Route::get('/pharmacy/purchase-history', [\App\Http\Controllers\API\PharmacyController::class, 'purchaseHistory']);
    Route::post('/pharmacy/dispense', [\App\Http\Controllers\API\PharmacyController::class, 'dispense']);
    Route::get('/batches', [\App\Http\Controllers\API\PharmacyController::class, 'index']);
    Route::post('/batches', [\App\Http\Controllers\API\PharmacyController::class, 'store']);
    Route::get('/batches/{batch}', [\App\Http\Controllers\API\PharmacyController::class, 'show']);
    Route::get('/batches/expiring', [\App\Http\Controllers\API\PharmacyController::class, 'expiring']);
    Route::get('/batches/expired', [\App\Http\Controllers\API\PharmacyController::class, 'expired']);
    Route::post('/batches/{batch}/use', [\App\Http\Controllers\API\PharmacyController::class, 'useBatch']);
    Route::post('/batches/{batch}/discount', [\App\Http\Controllers\API\PharmacyController::class, 'applyDiscount']);

    // Hotel Operations
    Route::get('/hotel/overview', [HotelController::class, 'overview']);
    Route::get('/hotel/rooms', [HotelController::class, 'rooms']);
    Route::post('/hotel/rooms', [HotelController::class, 'storeRoom']);
    Route::patch('/hotel/rooms/{room}', [HotelController::class, 'updateRoom']);
    Route::get('/hotel/bookings', [HotelController::class, 'bookings']);
    Route::post('/hotel/bookings', [HotelController::class, 'storeBooking']);
    Route::post('/hotel/bookings/{booking}/check-in', [HotelController::class, 'checkIn']);
    Route::post('/hotel/bookings/{booking}/check-out', [HotelController::class, 'checkOut']);
    Route::get('/hotel/reservation-calendar', [HotelController::class, 'reservationCalendar']);
    Route::post('/hotel/housekeeping', [HotelController::class, 'housekeeping']);
    Route::post('/hotel/maintenance-requests', [HotelController::class, 'maintenance']);
    Route::post('/hotel/inspections', [HotelController::class, 'inspection']);
    Route::post('/hotel/shifts', [HotelController::class, 'shifts']);

    // Clinic and Laboratory
    Route::get('/health/overview', [HealthController::class, 'overview']);
    Route::get('/health/patients', [HealthController::class, 'patients']);
    Route::post('/health/patients', [HealthController::class, 'storePatient']);
    Route::get('/health/appointments', [HealthController::class, 'appointments']);
    Route::post('/health/appointments', [HealthController::class, 'storeAppointment']);
    Route::get('/health/consultations', [HealthController::class, 'consultations']);
    Route::post('/health/consultations', [HealthController::class, 'storeConsultation']);
    Route::get('/health/lab-tests', [HealthController::class, 'labTests']);
    Route::post('/health/lab-tests', [HealthController::class, 'storeLabTest']);
    Route::get('/health/lab-requests', [HealthController::class, 'labRequests']);
    Route::post('/health/lab-requests', [HealthController::class, 'storeLabRequest']);
    Route::post('/health/lab-requests/{labRequest}/collect-sample', [HealthController::class, 'collectSample']);
    Route::post('/health/lab-requests/{labRequest}/submit-result', [HealthController::class, 'submitLabResult']);
    Route::post('/health/lab-requests/{labRequest}/approve', [HealthController::class, 'approveLabResult']);
    Route::post('/health/lab-requests/{labRequest}/reject', [HealthController::class, 'rejectLabSpecimen']);

    // School and Training Centre
    Route::get('/school/overview', [SchoolController::class, 'overview']);
    Route::get('/school/sessions', [SchoolController::class, 'sessions']);
    Route::post('/school/sessions', [SchoolController::class, 'storeSession']);
    Route::get('/school/terms', [SchoolController::class, 'terms']);
    Route::post('/school/terms', [SchoolController::class, 'storeTerm']);
    Route::get('/school/classes', [SchoolController::class, 'classrooms']);
    Route::post('/school/classes', [SchoolController::class, 'storeClassroom']);
    Route::get('/school/subjects', [SchoolController::class, 'subjects']);
    Route::post('/school/subjects', [SchoolController::class, 'storeSubject']);
    Route::get('/school/students', [SchoolController::class, 'students']);
    Route::post('/school/students', [SchoolController::class, 'storeStudent']);
    Route::get('/school/enrollments', [SchoolController::class, 'enrollments']);
    Route::post('/school/enrollments', [SchoolController::class, 'storeEnrollment']);
    Route::post('/school/enrollments/{enrollment}/promote', [SchoolController::class, 'promote']);
    Route::get('/school/attendance', [SchoolController::class, 'attendance']);
    Route::post('/school/attendance', [SchoolController::class, 'storeAttendance']);
    Route::get('/school/results', [SchoolController::class, 'results']);
    Route::post('/school/results', [SchoolController::class, 'storeResult']);
    Route::get('/school/fee-structures', [SchoolController::class, 'feeStructures']);
    Route::post('/school/fee-structures', [SchoolController::class, 'storeFeeStructure']);
    Route::get('/school/fee-payments', [SchoolController::class, 'feePayments']);
    Route::post('/school/fee-payments', [SchoolController::class, 'storeFeePayment']);
    Route::get('/school/debtors', [SchoolController::class, 'debtors']);

    // Restaurant Operations
    Route::get('/restaurant/overview', [RestaurantController::class, 'overview']);
    Route::get('/restaurant/tables', [RestaurantController::class, 'tables']);
    Route::post('/restaurant/tables', [RestaurantController::class, 'storeTable']);
    Route::get('/restaurant/shifts', [RestaurantController::class, 'shifts']);
    Route::post('/restaurant/shifts', [RestaurantController::class, 'storeShift']);
    Route::get('/restaurant/recipes', [RestaurantController::class, 'recipes']);
    Route::post('/restaurant/recipes', [RestaurantController::class, 'storeRecipe']);
    Route::get('/restaurant/reservations', [RestaurantController::class, 'reservations']);
    Route::post('/restaurant/reservations', [RestaurantController::class, 'storeReservation']);
    Route::get('/restaurant/tickets', [RestaurantController::class, 'tickets']);
    Route::post('/restaurant/tickets', [RestaurantController::class, 'storeTicket']);
    Route::get('/restaurant/kitchen-board', [RestaurantController::class, 'kitchenBoard']);
    Route::post('/restaurant/tickets/{ticket}/kitchen-status', [RestaurantController::class, 'updateKitchenStatus']);
    Route::post('/restaurant/tickets/{ticket}/close', [RestaurantController::class, 'closeTicket']);
    Route::get('/restaurant/waste-logs', [RestaurantController::class, 'wasteLogs']);
    Route::post('/restaurant/waste-logs', [RestaurantController::class, 'storeWasteLog']);

    // Mobile Agent Operations
    Route::get('/mobile-agent/overview', [MobileAgentController::class, 'overview']);
    Route::get('/mobile-agent/commission-tiers', [MobileAgentController::class, 'tiers']);
    Route::post('/mobile-agent/commission-tiers', [MobileAgentController::class, 'storeTier']);
    Route::get('/mobile-agent/float-requests', [MobileAgentController::class, 'floatRequests']);
    Route::post('/mobile-agent/float-requests', [MobileAgentController::class, 'storeFloatRequest']);
    Route::post('/mobile-agent/float-requests/{floatRequest}/approve', [MobileAgentController::class, 'approveFloatRequest']);
    Route::get('/mobile-agent/transactions', [MobileAgentController::class, 'transactions']);
    Route::post('/mobile-agent/transactions', [MobileAgentController::class, 'storeTransaction']);
    Route::get('/mobile-agent/reversals', [MobileAgentController::class, 'reversals']);
    Route::post('/mobile-agent/reversals', [MobileAgentController::class, 'storeReversal']);
    Route::get('/mobile-agent/shortages', [MobileAgentController::class, 'shortages']);
    Route::post('/mobile-agent/shortages', [MobileAgentController::class, 'storeShortage']);
    Route::get('/mobile-agent/fraud-alerts', [MobileAgentController::class, 'fraudAlerts']);

    // Textile Operations
    Route::get('/textile/overview', [TextileController::class, 'overview']);
    Route::get('/textile/measurements', [TextileController::class, 'measurements']);
    Route::post('/textile/measurements', [TextileController::class, 'storeMeasurement']);
    Route::get('/textile/variants', [TextileController::class, 'variants']);
    Route::post('/textile/variants', [TextileController::class, 'storeVariant']);
    Route::get('/textile/style-orders', [TextileController::class, 'styleOrders']);
    Route::post('/textile/style-orders', [TextileController::class, 'storeStyleOrder']);
    Route::get('/textile/jobs', [TextileController::class, 'jobs']);
    Route::patch('/textile/jobs/{job}', [TextileController::class, 'updateJob']);
    Route::get('/textile/consignments', [TextileController::class, 'consignments']);
    Route::post('/textile/consignments', [TextileController::class, 'storeConsignment']);
    Route::get('/textile/invoices', [TextileController::class, 'invoices']);
    Route::post('/textile/invoices', [TextileController::class, 'storeInvoice']);

    // Fuel Operations
    Route::get('/fuel/overview', [FuelController::class, 'overview']);
    Route::get('/fuel/tanks', [FuelController::class, 'tanks']);
    Route::post('/fuel/tanks', [FuelController::class, 'storeTank']);
    Route::get('/fuel/pumps', [FuelController::class, 'pumps']);
    Route::post('/fuel/pumps', [FuelController::class, 'storePump']);
    Route::get('/fuel/nozzle-readings', [FuelController::class, 'nozzleReadings']);
    Route::post('/fuel/nozzle-readings', [FuelController::class, 'storeNozzleReading']);
    Route::get('/fuel/tank-dips', [FuelController::class, 'tankDips']);
    Route::post('/fuel/tank-dips', [FuelController::class, 'storeTankDip']);
    Route::get('/fuel/shifts', [FuelController::class, 'shifts']);
    Route::post('/fuel/shifts', [FuelController::class, 'storeShift']);
    Route::get('/fuel/price-changes', [FuelController::class, 'priceChanges']);
    Route::post('/fuel/price-changes', [FuelController::class, 'storePriceChange']);
    Route::get('/fuel/alerts', [FuelController::class, 'alerts']);

    // Agro Dealer Operations
    Route::get('/agro/overview', [AgroDealerController::class, 'overview']);
    Route::get('/agro/forecasts', [AgroDealerController::class, 'forecasts']);
    Route::post('/agro/forecasts', [AgroDealerController::class, 'storeForecast']);
    Route::get('/agro/subsidy-sales', [AgroDealerController::class, 'subsidySales']);
    Route::post('/agro/subsidy-sales', [AgroDealerController::class, 'storeSubsidySale']);
    Route::get('/agro/recoveries', [AgroDealerController::class, 'recoveries']);
    Route::post('/agro/recoveries', [AgroDealerController::class, 'storeRecovery']);
    Route::patch('/agro/recoveries/{recovery}', [AgroDealerController::class, 'updateRecovery']);
    Route::get('/agro/advisories', [AgroDealerController::class, 'advisories']);
    Route::post('/agro/advisories', [AgroDealerController::class, 'storeAdvisory']);
    Route::get('/agro/trends', [AgroDealerController::class, 'trends']);
    Route::post('/agro/trends', [AgroDealerController::class, 'storeTrend']);

    // Commodity Trading
    Route::get('/commodity/overview', [CommodityController::class, 'overview']);
    Route::post('/commodity/lots', [CommodityController::class, 'storeLot']);
    Route::post('/commodity/price-board', [CommodityController::class, 'storePriceBoard']);
    Route::post('/commodity/trades', [CommodityController::class, 'storeTrade']);
    Route::patch('/commodity/trades/{trade}', [CommodityController::class, 'updateTrade']);
    Route::post('/commodity/trades/{trade}/settlements', [CommodityController::class, 'storeSettlement']);

    // Livestock
    Route::get('/livestock/overview', [LivestockController::class, 'overview']);
    Route::post('/livestock/pens', [LivestockController::class, 'storePen']);
    Route::post('/livestock/groups', [LivestockController::class, 'storeGroup']);
    Route::post('/livestock/weights', [LivestockController::class, 'storeWeight']);
    Route::post('/livestock/milk-logs', [LivestockController::class, 'storeMilk']);
    Route::post('/livestock/disease-logs', [LivestockController::class, 'storeDisease']);
    Route::post('/livestock/medications', [LivestockController::class, 'storeMedication']);
    Route::post('/livestock/breeding-records', [LivestockController::class, 'storeBreeding']);
    Route::post('/livestock/sales', [LivestockController::class, 'storeSale']);

    // Crop Farming
    Route::get('/farm/overview', [FarmController::class, 'overview']);
    Route::post('/farm/plots', [FarmController::class, 'storePlot']);
    Route::post('/farm/planting-cycles', [FarmController::class, 'storePlantingCycle']);
    Route::post('/farm/input-logs', [FarmController::class, 'storeInputLog']);
    Route::post('/farm/harvest-logs', [FarmController::class, 'storeHarvestLog']);

    // Beauty / Salon
    Route::get('/beauty/overview', [BeautyController::class, 'overview']);
    Route::post('/beauty/services', [BeautyController::class, 'storeService']);
    Route::post('/beauty/staff', [BeautyController::class, 'storeStaff']);
    Route::post('/beauty/appointments', [BeautyController::class, 'storeAppointment']);
    Route::post('/beauty/appointments/{appointment}/complete', [BeautyController::class, 'completeAppointment']);

    // Service Business
    Route::get('/service-business/overview', [ServiceBusinessController::class, 'overview']);
    Route::post('/service-business/offerings', [ServiceBusinessController::class, 'storeOffering']);
    Route::post('/service-business/staff', [ServiceBusinessController::class, 'storeStaff']);
    Route::post('/service-business/bookings', [ServiceBusinessController::class, 'storeBooking']);
    Route::post('/service-business/jobs', [ServiceBusinessController::class, 'storeJob']);
    Route::patch('/service-business/jobs/{job}', [ServiceBusinessController::class, 'updateJob']);

    // General SME / Mixed Business
    Route::get('/general-sme/overview', [GeneralSMEController::class, 'overview']);
    Route::post('/general-sme/cash-entries', [GeneralSMEController::class, 'storeCashEntry']);
    Route::post('/general-sme/follow-ups', [GeneralSMEController::class, 'storeFollowUp']);
    Route::post('/general-sme/daily-targets', [GeneralSMEController::class, 'storeDailyTarget']);

    // Building Materials / Construction
    Route::get('/building-materials/overview', [ConstructionMaterialsController::class, 'overview']);
    Route::post('/building-materials/items', [ConstructionMaterialsController::class, 'storeItem']);
    Route::post('/building-materials/customers', [ConstructionMaterialsController::class, 'storeCustomer']);
    Route::post('/building-materials/quotations', [ConstructionMaterialsController::class, 'storeQuotation']);
    Route::post('/building-materials/quotations/{quotation}/convert', [ConstructionMaterialsController::class, 'convertQuotation']);
    Route::post('/building-materials/deliveries', [ConstructionMaterialsController::class, 'storeDelivery']);
    Route::patch('/building-materials/deliveries/{delivery}', [ConstructionMaterialsController::class, 'updateDelivery']);
    Route::post('/building-materials/credit-accounts/{account}/payments', [ConstructionMaterialsController::class, 'recordCreditPayment']);
    Route::post('/building-materials/price-changes', [ConstructionMaterialsController::class, 'storePriceChange']);
    Route::post('/building-materials/transfers', [ConstructionMaterialsController::class, 'storeTransfer']);

    // Warehouse
    Route::get('/warehouse/overview', [NGOWarehouseController::class, 'overview']);
    Route::post('/warehouse/donors', [NGOWarehouseController::class, 'storeDonor']);
    Route::post('/warehouse/partner-requests', [NGOWarehouseController::class, 'storePartnerRequest']);
    Route::post('/warehouse/distributions', [NGOWarehouseController::class, 'storeDistribution']);
    Route::post('/warehouse/distributions/{distribution}/signatures', [NGOWarehouseController::class, 'storeSignature']);

    // Warehouse legacy alias
    Route::get('/ngo-warehouse/overview', [NGOWarehouseController::class, 'overview']);
    Route::post('/ngo-warehouse/donors', [NGOWarehouseController::class, 'storeDonor']);
    Route::post('/ngo-warehouse/partner-requests', [NGOWarehouseController::class, 'storePartnerRequest']);
    Route::post('/ngo-warehouse/distributions', [NGOWarehouseController::class, 'storeDistribution']);
    Route::post('/ngo-warehouse/distributions/{distribution}/signatures', [NGOWarehouseController::class, 'storeSignature']);

    // Delivery / Courier
    Route::get('/deliveries/overview', [DeliveryController::class, 'overview']);
    Route::get('/deliveries/operations', [DeliveryOperationsController::class, 'index']);
    Route::get('/deliveries', [DeliveryController::class, 'index']);
    Route::post('/deliveries', [DeliveryController::class, 'store']);
    Route::post('/deliveries/manifests', [DeliveryOperationsController::class, 'storeManifest']);
    Route::get('/deliveries/{delivery}', [DeliveryController::class, 'show']);
    Route::post('/deliveries/{delivery}/pickup', [DeliveryController::class, 'markPickup']);
    Route::post('/deliveries/{delivery}/deliver', [DeliveryController::class, 'markDelivery']);
    Route::post('/deliveries/{delivery}/confirm-otp', [DeliveryController::class, 'confirmOtp']);
    Route::post('/deliveries/{delivery}/fail', [DeliveryController::class, 'markFailed']);
    Route::post('/deliveries/{delivery}/disputes', [DeliveryOperationsController::class, 'storeDispute']);
    Route::post('/deliveries/{delivery}/complaints', [DeliveryOperationsController::class, 'storeComplaint']);
    Route::post('/deliveries/{delivery}/settle', [DeliveryController::class, 'settle']);
    Route::post('/deliveries/{delivery}/remittance', [DeliveryController::class, 'recordRemittance']);
    Route::post('/deliveries/{delivery}/settlement-paid', [DeliveryController::class, 'markSettlementPaid']);
    Route::get('/delivery-vehicles', [DeliveryVehicleController::class, 'index']);
    Route::post('/delivery-vehicles', [DeliveryVehicleController::class, 'store']);

    // Logistics / Transport
    Route::get('/logistics/overview', [LogisticsController::class, 'overview']);
    Route::post('/logistics/fleet-assets', [LogisticsController::class, 'storeFleetAsset']);
    Route::post('/logistics/trip-sheets', [LogisticsController::class, 'storeTripSheet']);
    Route::patch('/logistics/trip-sheets/{tripSheet}', [LogisticsController::class, 'updateTripSheet']);
    Route::post('/logistics/fuel-logs', [LogisticsController::class, 'storeFuelLog']);
    Route::post('/logistics/maintenance-logs', [LogisticsController::class, 'storeMaintenanceLog']);
    Route::post('/logistics/trip-sheets/{tripSheet}/settle', [LogisticsController::class, 'settleTrip']);

    // Admin Routes - platform-wide, cross-tenant. Gated on the explicit
    // is_platform_admin flag (see EnsurePlatformAdmin), not the tenant-scoped
    // `role:admin` check used above for /auth/team - every self-registered
    // business owner passes that one by default.
    Route::middleware('platform.admin')->group(function () {
        Route::get('/admin/stats', [AdminController::class, 'stats']);
        Route::get('/admin/users', [AdminController::class, 'users']);
        Route::get('/admin/businesses', [AdminController::class, 'businesses']);
        Route::get('/admin/plans', [AdminController::class, 'plans']);
        Route::get('/admin/transactions', [AdminController::class, 'transactions']);
        Route::get('/admin/support-tickets', [AdminController::class, 'supportTickets']);
        Route::get('/admin/referrals', [AdminController::class, 'referrals']);
        Route::post('/admin/suspend', [AdminController::class, 'suspendUser']);
        Route::post('/admin/activate', [AdminController::class, 'activateUser']);
        Route::post('/admin/suspend-business', [AdminController::class, 'suspendBusiness']);
        Route::post('/admin/resolve-ticket', [AdminController::class, 'resolveTicket']);
    });
});
