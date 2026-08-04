<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\CheckBillingLimitRequest;
use App\Http\Requests\Billing\InitializeBillingPaymentRequest;
use App\Http\Requests\Billing\StorePaymentMethodRequest;
use App\Http\Requests\Billing\SubscribeBusinessRequest;
use App\Http\Requests\Billing\VerifyBillingPaymentRequest;
use App\Http\Resources\BusinessSubscriptionResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PaymentMethodResource;
use App\Http\Resources\SubscriptionPlanResource;
use App\Services\BillingService;
use App\Models\SubscriptionPlan;
use App\Models\BusinessSubscription;
use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Models\PaymentAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BillingController extends Controller
{
    public function __construct(private BillingService $billingService)
    {
    }

    public function getPlans(): JsonResponse
    {
        $plans = $this->billingService->getPlans();

        return response()->json([
            'success' => true,
            'data' => SubscriptionPlanResource::collection($plans)->resolve(),
        ]);
    }

    public function getPlan(string $slug): JsonResponse
    {
        $plan = $this->billingService->getPlanBySlug($slug);

        if (!$plan) {
            return response()->json(['success' => false, 'message' => 'Plan not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => (new SubscriptionPlanResource($plan))->resolve(),
        ]);
    }

    public function getSubscription(Request $request): JsonResponse
    {
        $business = $request->user()->business;
        $subscription = $business->activeSubscription()->with(['plan', 'usage'])->first();

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'No active subscription'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => (new BusinessSubscriptionResource($subscription))->resolve(),
        ]);
    }

    public function subscribe(SubscribeBusinessRequest $request): JsonResponse
    {
        $business = $request->user()->business;
        
        $subscription = $this->billingService->subscribe(
            $business,
            (int) $request->validated('plan_id'),
            $request->validated('billing_cycle')
        )->load(['plan', 'usage']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription created',
            'data' => (new BusinessSubscriptionResource($subscription))->resolve(),
        ], 201);
    }

    public function cancelSubscription(Request $request): JsonResponse
    {
        $business = $request->user()->business;
        $subscription = $business->subscription;

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'No subscription found'], 404);
        }

        $subscription->update([
            'status' => BusinessSubscription::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'is_auto_renew' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscription cancelled',
        ]);
    }

    public function getInvoices(Request $request): JsonResponse
    {
        $business = $request->user()->business;
        $invoices = $business->invoices()
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => InvoiceResource::collection($invoices->getCollection())->resolve(),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    public function getInvoice(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::with('subscription.plan')->find($id);
        
        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Invoice not found'], 404);
        }
        $this->authorize('view', $invoice);

        return response()->json([
            'success' => true,
            'data' => (new InvoiceResource($invoice))->resolve(),
        ]);
    }

    public function initPayment(InitializeBillingPaymentRequest $request): JsonResponse
    {
        $invoice = Invoice::findOrFail($request->validated('invoice_id'));
        $this->authorize('update', $invoice);
        $business = $request->user()->business;

        $gateway = $request->validated('gateway') === 'paystack'
            ? app(\App\Services\PaystackService::class)
            : app(\App\Services\FlutterwaveService::class);

        $result = $gateway->initializeTransaction(
            $invoice->total,
            $business->email
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['error'],
            ], 400);
        }

        $invoice->paymentAttempts()->create([
            'gateway' => $request->validated('gateway'),
            'reference' => $result['reference'],
            'status' => 'pending',
            'amount' => $invoice->total,
            'currency' => $invoice->currency,
            'attempt_number' => 1,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'reference' => $result['reference'],
                'authorization_url' => $result['authorization_url'],
            ],
        ]);
    }

    public function verifyPayment(VerifyBillingPaymentRequest $request): JsonResponse
    {
        $attempt = PaymentAttempt::with('invoice')->where('reference', $request->validated('reference'))->first();
        
        if (!$attempt) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }
        $this->authorize('update', $attempt);

        $gateway = $attempt->gateway === 'paystack'
            ? app(\App\Services\PaystackService::class)
            : app(\App\Services\FlutterwaveService::class);

        $result = $gateway->verifyTransaction($request->validated('reference'));

        if ($result['success']) {
            $attempt->invoice->markAsPaid($attempt->gateway, $result['reference']);
            $attempt->update(['status' => 'success']);
        } else {
            $attempt->update(['status' => 'failed', 'failure_reason' => $result['error']]);
        }

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Payment verified' : $result['error'],
        ]);
    }

    public function getPaymentMethods(Request $request): JsonResponse
    {
        $business = $request->user()->business;
        $methods = $business->paymentMethods;

        return response()->json([
            'success' => true,
            'data' => PaymentMethodResource::collection($methods)->resolve(),
        ]);
    }

    public function addPaymentMethod(StorePaymentMethodRequest $request): JsonResponse
    {
        $business = $request->user()->business;
        $validated = $request->validated();
        
        $method = PaymentMethod::create([
            'business_id' => $business->id,
            'type' => $validated['type'],
            'provider' => $validated['provider'],
            'gateway_token' => $validated['gateway_token'],
            'last_four' => $validated['last_four'] ?? null,
            'brand' => $validated['brand'] ?? null,
            'expiry_month' => $validated['expiry_month'] ?? null,
            'expiry_year' => $validated['expiry_year'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'account_number' => $validated['account_number'] ?? null,
            'account_name' => $validated['account_name'] ?? null,
            'bank_code' => $validated['bank_code'] ?? null,
            'is_default' => $business->paymentMethods()->count() === 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment method added',
            'data' => (new PaymentMethodResource($method))->resolve(),
        ], 201);
    }

    public function setDefaultPaymentMethod(Request $request, int $id): JsonResponse
    {
        $method = PaymentMethod::where('business_id', $request->user()->business->id)->findOrFail($id);
        $method->markAsDefault();

        return response()->json([
            'success' => true,
            'message' => 'Default payment method updated',
        ]);
    }

    public function removePaymentMethod(Request $request, int $id): JsonResponse
    {
        $method = PaymentMethod::where('business_id', $request->user()->business->id)->findOrFail($id);
        $method->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment method removed',
        ]);
    }

    public function checkLimit(CheckBillingLimitRequest $request): JsonResponse
    {
        $business = $request->user()->business;
        $result = $this->billingService->checkLimit($business, $request->validated('feature_key'));

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}
