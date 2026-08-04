<?php

namespace App\Services;

use App\Models\TrustAccount;
use App\Models\TrustTransaction;
use Illuminate\Support\Facades\DB;

class TrustFundService
{
    public function createAccount(int $customerId, string $type, float $limit, int $businessId, array $options = []): TrustAccount
    {
        return TrustAccount::create([
            'business_id' => $businessId,
            'customer_id' => $customerId,
            'account_type' => $type,
            'cycle_name' => $options['cycle_name'] ?? null,
            'limit' => $limit,
            'installment_amount' => $options['installment_amount'] ?? null,
            'contribution_frequency_days' => $options['contribution_frequency_days'] ?? null,
            'balance' => 0,
            'next_due_date' => $options['next_due_date'] ?? null,
            'status' => 'active',
        ]);
    }

    public function draw(int $accountId, int $businessId, float $amount, ?string $reference, int $userId): TrustAccount
    {
        return DB::transaction(function () use ($accountId, $businessId, $amount, $reference, $userId) {
            $account = $this->resolveAccount($accountId, $businessId);
            
            if (!$account->canDraw($amount)) {
                throw new \Exception(
                    $account->account_type === 'contribution'
                        ? 'Contribution exceeds the remaining cycle target'
                        : 'Insufficient credit limit'
                );
            }

            $balanceBefore = $account->balance;
            $balanceAfter = $balanceBefore + $amount;

            // Create transaction
            TrustTransaction::create([
                'business_id' => $account->business_id,
                'trust_account_id' => $account->id,
                'customer_id' => $account->customer_id,
                'created_by' => $userId,
                'type' => 'draw',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference' => $reference,
                'transaction_date' => now(),
            ]);

            // Update account
            $account->balance = $balanceAfter;
            if ($account->account_type === 'contribution') {
                $account->last_payment_date = now();

                if ($account->contribution_frequency_days) {
                    $baseDate = $account->next_due_date && $account->next_due_date->greaterThan(now())
                        ? $account->next_due_date->copy()
                        : now()->copy();

                    $account->next_due_date = $baseDate->addDays($account->contribution_frequency_days);
                }
            }
            $account->save();

            // Update customer balance
            $customer = $account->customer;
            $customer->balance = ($customer->balance ?? 0) + $amount;
            $customer->save();

            return $account;
        });
    }

    public function repay(int $accountId, int $businessId, float $amount, ?string $reference, int $userId): TrustAccount
    {
        return DB::transaction(function () use ($accountId, $businessId, $amount, $reference, $userId) {
            $account = $this->resolveAccount($accountId, $businessId);
            
            $balanceBefore = $account->balance;
            $balanceAfter = max(0, $balanceBefore - $amount);

            // Create transaction
            TrustTransaction::create([
                'business_id' => $account->business_id,
                'trust_account_id' => $account->id,
                'customer_id' => $account->customer_id,
                'created_by' => $userId,
                'type' => 'repayment',
                'amount' => -$amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference' => $reference,
                'transaction_date' => now(),
            ]);

            // Update account
            $account->balance = $balanceAfter;
            $account->total_repaid = $account->total_repaid + $amount;
            $account->last_payment_date = now();
            $account->save();

            // Update customer balance
            $customer = $account->customer;
            $customer->balance = max(0, ($customer->balance ?? 0) - $amount);
            $customer->save();

            return $account;
        });
    }

    public function getStatement(int $accountId, int $businessId)
    {
        $account = $this->resolveAccount($accountId, $businessId, ['customer']);
        
        $transactions = TrustTransaction::where('business_id', $businessId)
            ->where('trust_account_id', $accountId)
            ->orderByDesc('transaction_date')
            ->get();

        return [
            'account' => $account,
            'transactions' => $transactions,
            'available_credit' => $account->availableCredit(),
        ];
    }

    public function getOverdueAccounts(int $businessId)
    {
        return TrustAccount::where('business_id', $businessId)
            ->where('account_type', 'credit')
            ->where('balance', '>', 0)
            ->whereDate('last_payment_date', '<', now()->subDays(30))
            ->with('customer')
            ->get();
    }

    private function resolveAccount(int $accountId, int $businessId, array $with = []): TrustAccount
    {
        return TrustAccount::with($with)
            ->where('business_id', $businessId)
            ->findOrFail($accountId);
    }
}
