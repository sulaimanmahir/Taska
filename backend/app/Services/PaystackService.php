<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PaystackService
{
    protected string $secretKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.paystack.secret_key');
        $this->baseUrl = config('services.paystack.url', 'https://api.paystack.co');
    }

    public function initializeTransaction(float $amount, string $email, string $reference = null): array
    {
        $reference = $reference ?? $this->generateReference();

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/transaction/initialize", [
                'amount' => $amount * 100,
                'email' => $email,
                'reference' => $reference,
                'currency' => 'NGN',
            ]);

        $data = $response->json();

        if (!$data['status']) {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Failed to initialize transaction',
            ];
        }

        return [
            'success' => true,
            'reference' => $reference,
            'authorization_url' => $data['data']['authorization_url'],
        ];
    }

    public function verifyTransaction(string $reference): array
    {
        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/transaction/verify/{$reference}");

        $data = $response->json();

        if (!$data['status']) {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Verification failed',
            ];
        }

        $txn = $data['data'];

        return [
            'success' => $txn['status'] === 'success',
            'reference' => $txn['reference'],
            'amount' => $txn['amount'] / 100,
            'currency' => $txn['currency'],
            'customer_email' => $txn['customer']['email'],
            'gateway_response' => $txn['gateway_response'],
        ];
    }

    public function chargeAuthorization(string $authorizationCode, float $amount, string $reference = null): array
    {
        $reference = $reference ?? $this->generateReference();

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/transaction/charge_authorization", [
                'authorization_code' => $authorizationCode,
                'amount' => $amount * 100,
                'reference' => $reference,
                'currency' => 'NGN',
            ]);

        $data = $response->json();

        if (!$data['status']) {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Charge failed',
                'reference' => $reference,
            ];
        }

        $txn = $data['data'];

        return [
            'success' => $txn['status'] === 'success',
            'reference' => $txn['reference'],
            'gateway_response' => $txn['gateway_response'],
        ];
    }

    public function createCustomer(string $email, string $firstName, string $lastName): ?string
    {
        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/customer", [
                'email' => $email,
                'first_name' => $firstName,
                'last_name' => $lastName,
            ]);

        $data = $response->json();

        return $data['status'] ? $data['data']['customer_code'] : null;
    }

    public function getAuthorization(string $customerCode): array
    {
        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/customer/{$customerCode}/authorizations");

        $data = $response->json();

        if (!$data['status']) {
            return [];
        }

        return $data['data']['authorizations'];
    }

    public function deactivateAuthorization(string $authorizationCode): bool
    {
        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/customer/deactivate_authorization", [
                'authorization_code' => $authorizationCode,
            ]);

        return $response->json()['status'] ?? false;
    }

    public function transfer(float $amount, string $bankCode, string $accountNumber, string $accountName, string $reference = null): array
    {
        $reference = $reference ?? $this->generateReference();

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/transfer", [
                'amount' => $amount * 100,
                'recipient' => $this->createRecipient($bankCode, $accountNumber, $accountName),
                'reference' => $reference,
            ]);

        $data = $response->json();

        if (!$data['status']) {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Transfer failed',
            ];
        }

        return [
            'success' => true,
            'reference' => $reference,
            'transfer_code' => $data['data']['transfer_code'],
        ];
    }

    protected function createRecipient(string $bankCode, string $accountNumber, string $accountName): ?string
    {
        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/transferrecipient", [
                'type' => 'nuban',
                'name' => $accountName,
                'account_number' => $accountNumber,
                'bank_code' => $bankCode,
                'currency' => 'NGN',
            ]);

        $data = $response->json();

        return $data['status'] ? $data['data']['recipient_code'] : null;
    }

    protected function generateReference(): string
    {
        return 'TXN_' . strtoupper(Str::random(16));
    }
}