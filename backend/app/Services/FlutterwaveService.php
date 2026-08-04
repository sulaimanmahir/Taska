<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class FlutterwaveService
{
    protected string $secretKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.flutterwave.secret_key');
        $this->baseUrl = config('services.flutterwave.url', 'https://api.flutterwave.com/v3');
    }

    public function initializeTransaction(float $amount, string $email, string $reference = null): array
    {
        $reference = $reference ?? $this->generateReference();

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/payments", [
                'tx_ref' => $reference,
                'amount' => $amount,
                'currency' => 'NGN',
                'redirect_url' => route('payment.callback'),
                'customer' => [
                    'email' => $email,
                ],
                'customizations' => [
                    'title' => config('app.name', 'Taska'),
                ],
            ]);

        $data = $response->json();

        if ($data['status'] !== 'success') {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Failed to initialize transaction',
            ];
        }

        return [
            'success' => true,
            'reference' => $reference,
            'authorization_url' => $data['data']['link'],
        ];
    }

    public function verifyTransaction(string $reference): array
    {
        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/transactions/verify_by_ref/{$reference}");

        $data = $response->json();

        if ($data['status'] !== 'success') {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Verification failed',
            ];
        }

        $txn = $data['data'];

        return [
            'success' => $txn['status'] === 'successful',
            'reference' => $txn['tx_ref'],
            'amount' => (float) $txn['amount'],
            'currency' => $txn['currency'],
            'customer_email' => $txn['customer']['email'],
            'gateway_response' => $txn['gateway_response'],
        ];
    }

    public function chargeAuthorization(string $authorizationId, float $amount, string $reference = null): array
    {
        $reference = $reference ?? $this->generateReference();

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/tokenized-charges", [
                'token' => $authorizationId,
                'tx_ref' => $reference,
                'amount' => $amount,
                'currency' => 'NGN',
            ]);

        $data = $response->json();

        if ($data['status'] !== 'success') {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Charge failed',
                'reference' => $reference,
            ];
        }

        $txn = $data['data'];

        return [
            'success' => $txn['status'] === 'successful',
            'reference' => $txn['tx_ref'],
            'gateway_response' => $txn['gateway_response'],
        ];
    }

    public function createVirtualAccount(string $accountName, string $email, float $amount = 0): array
    {
        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/virtual-account-numbers", [
                'account_name' => $accountName,
                'email' => $email,
                'amount' => $amount,
                'is_permanent' => false,
            ]);

        $data = $response->json();

        if ($data['status'] !== 'success') {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Failed to create virtual account',
            ];
        }

        return [
            'success' => true,
            'account_number' => $data['data']['account_number'],
            'account_status' => $data['data']['account_status'],
            'frequency' => $data['data']['frequency'],
        ];
    }

    public function getBankList(): array
    {
        $cached = Cache::get('flutterwave_banks');
        if ($cached) {
            return $cached;
        }

        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/banks/NG");

        $data = $response->json();

        if ($data['status'] !== 'success') {
            return [];
        }

        $banks = $data['data'];
        Cache::put('flutterwave_banks', $banks, now()->addDay());

        return $banks;
    }

    public function resolveAccount(string $bankCode, string $accountNumber): array
    {
        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/accounts/resolve", [
                'account_number' => $accountNumber,
                'bank_code' => $bankCode,
            ]);

        $data = $response->json();

        if ($data['status'] !== 'success') {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Account resolution failed',
            ];
        }

        return [
            'success' => true,
            'account_name' => $data['data']['account_name'],
            'account_number' => $data['data']['account_number'],
        ];
    }

    public function transfer(float $amount, string $bankCode, string $accountNumber, string $reference = null): array
    {
        $reference = $reference ?? $this->generateReference();

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/transfers", [
                'amount' => $amount,
                'currency' => 'NGN',
                'reference' => $reference,
                'bank' => [
                    'type' => 'nuban',
                    'code' => $bankCode,
                    'account_number' => $accountNumber,
                ],
            ]);

        $data = $response->json();

        if ($data['status'] !== 'success') {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Transfer failed',
            ];
        }

        return [
            'success' => true,
            'reference' => $reference,
            'transfer_id' => $data['data']['id'],
        ];
    }

    protected function generateReference(): string
    {
        return 'FLW_' . strtoupper(Str::random(16));
    }
}
