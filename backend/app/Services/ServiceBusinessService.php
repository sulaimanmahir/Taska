<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\ServiceBooking;
use App\Models\ServiceJob;
use App\Models\ServiceOffering;
use App\Models\ServiceStaffProfile;
use App\Models\User;

class ServiceBusinessService
{
    public function overview(int $businessId): array
    {
        $summary = ServiceJob::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END), 0) as jobs_created_today,
                COALESCE(SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END), 0) as open_jobs,
                COALESCE(SUM(CASE WHEN date(completed_at) = date('now') THEN invoice_amount ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN invoice_amount > amount_paid THEN invoice_amount - amount_paid ELSE 0 END), 0) as invoices_outstanding,
                COALESCE(SUM(CASE WHEN due_date < date('now') AND invoice_amount > amount_paid THEN 1 ELSE 0 END), 0) as overdue_invoices
            ")
            ->first();

        return [
            'summary' => [
                'bookings_today' => ServiceBooking::where('business_id', $businessId)->whereDate('scheduled_for', today())->count(),
                'jobs_created_today' => (int) ($summary?->jobs_created_today ?? 0),
                'open_jobs' => (int) ($summary?->open_jobs ?? 0),
                'revenue_today' => (float) ($summary?->revenue_today ?? 0),
                'invoices_outstanding' => (float) ($summary?->invoices_outstanding ?? 0),
                'overdue_invoices' => (int) ($summary?->overdue_invoices ?? 0),
                'assigned_staff' => ServiceStaffProfile::where('business_id', $businessId)->where('is_active', true)->count(),
            ],
            'offerings' => ServiceOffering::where('business_id', $businessId)->orderBy('name')->get(),
            'staff' => ServiceStaffProfile::where('business_id', $businessId)->orderBy('name')->get(),
            'bookings' => ServiceBooking::with(['customer', 'offering'])->where('business_id', $businessId)->latest('scheduled_for')->get(),
            'jobs' => ServiceJob::with(['booking', 'customer', 'offering', 'staffProfile'])->where('business_id', $businessId)->latest()->get(),
            'clients' => \App\Models\Customer::where('business_id', $businessId)->orderBy('name')->get(),
            'insights' => [
                'profit_driver' => 'Consistent booking conversion, clean job completion, and disciplined invoice follow-up drive service-business cash flow.',
                'profit_killers' => ['Idle staff hours', 'Jobs completed without invoicing', 'Weak follow-up on unpaid work', 'Poor scheduling discipline'],
                'daily_decisions' => ['Which bookings need staff assignment', 'Which open jobs should close today', 'Which invoices need follow-up', 'Which services deserve more promotion'],
            ],
        ];
    }

    public function storeOffering(array $payload, User $user): ServiceOffering
    {
        return ServiceOffering::create([
            'business_id' => $user->current_business_id,
            'branch_id' => $user->current_branch_id,
            'name' => $payload['name'],
            'category' => $payload['category'] ?? null,
            'duration_minutes' => $payload['duration_minutes'] ?? 60,
            'base_price' => $payload['base_price'] ?? 0,
            'is_active' => $payload['is_active'] ?? true,
        ]);
    }

    public function storeStaff(array $payload, User $user): ServiceStaffProfile
    {
        return ServiceStaffProfile::create([
            'business_id' => $user->current_business_id,
            'branch_id' => $user->current_branch_id,
            'user_id' => $payload['user_id'] ?? null,
            'name' => $payload['name'],
            'specialty' => $payload['specialty'] ?? null,
            'phone' => $payload['phone'] ?? null,
            'is_active' => $payload['is_active'] ?? true,
        ]);
    }

    public function storeBooking(array $payload, User $user): ServiceBooking
    {
        $businessId = $user->current_business_id;
        $customer = isset($payload['customer_id'])
            ? $this->resolveCustomer($businessId, $payload['customer_id'])
            : null;
        $offering = $this->resolveOffering($businessId, $payload['offering_id']);

        return ServiceBooking::create([
            'business_id' => $businessId,
            'branch_id' => $user->current_branch_id,
            'customer_id' => $customer?->id,
            'offering_id' => $offering->id,
            'scheduled_for' => $payload['scheduled_for'],
            'status' => $payload['status'] ?? 'scheduled',
            'referral_source' => $payload['referral_source'] ?? null,
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    public function storeJob(array $payload, User $user): ServiceJob
    {
        $businessId = $user->current_business_id;
        $offering = $this->resolveOffering($businessId, $payload['offering_id']);
        $booking = isset($payload['booking_id'])
            ? $this->resolveBooking($businessId, $payload['booking_id'])
            : null;
        $customer = isset($payload['customer_id'])
            ? $this->resolveCustomer($businessId, $payload['customer_id'])
            : null;
        $staffProfile = isset($payload['staff_profile_id'])
            ? $this->resolveStaffProfile($businessId, $payload['staff_profile_id'])
            : null;

        if ($booking) {
            $booking->update(['status' => 'converted']);
        }

        return ServiceJob::create([
            'business_id' => $businessId,
            'branch_id' => $user->current_branch_id,
            'booking_id' => $booking?->id,
            'customer_id' => $customer?->id ?? $booking?->customer_id,
            'offering_id' => $offering->id,
            'staff_profile_id' => $staffProfile?->id,
            'status' => $payload['status'] ?? 'open',
            'quoted_amount' => $payload['quoted_amount'] ?? $offering->base_price,
            'invoice_amount' => $payload['invoice_amount'] ?? $payload['quoted_amount'] ?? $offering->base_price,
            'amount_paid' => $payload['amount_paid'] ?? 0,
            'due_date' => $payload['due_date'] ?? null,
            'started_at' => in_array($payload['status'] ?? 'open', ['in_progress', 'completed'], true) ? now() : null,
            'completed_at' => ($payload['status'] ?? null) === 'completed' ? now() : null,
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    public function updateJob(ServiceJob $job, array $payload): ServiceJob
    {
        $staffProfile = isset($payload['staff_profile_id'])
            ? $this->resolveStaffProfile($job->business_id, $payload['staff_profile_id'])
            : null;

        $updates = [
            'staff_profile_id' => $staffProfile?->id ?? $job->staff_profile_id,
            'status' => $payload['status'] ?? $job->status,
            'quoted_amount' => $payload['quoted_amount'] ?? $job->quoted_amount,
            'invoice_amount' => $payload['invoice_amount'] ?? $job->invoice_amount,
            'amount_paid' => $payload['amount_paid'] ?? $job->amount_paid,
            'due_date' => $payload['due_date'] ?? $job->due_date,
            'notes' => $payload['notes'] ?? $job->notes,
        ];

        if (($payload['status'] ?? null) === 'in_progress' && !$job->started_at) {
            $updates['started_at'] = now();
        }

        if (($payload['status'] ?? null) === 'completed' && !$job->completed_at) {
            $updates['completed_at'] = now();
        }

        $job->update($updates);

        return $job->fresh(['booking', 'customer', 'offering', 'staffProfile']);
    }

    private function resolveBooking(int $businessId, int $bookingId): ServiceBooking
    {
        return ServiceBooking::where('business_id', $businessId)->findOrFail($bookingId);
    }

    private function resolveCustomer(int $businessId, int $customerId): Customer
    {
        return Customer::where('business_id', $businessId)->findOrFail($customerId);
    }

    private function resolveOffering(int $businessId, int $offeringId): ServiceOffering
    {
        return ServiceOffering::where('business_id', $businessId)->findOrFail($offeringId);
    }

    private function resolveStaffProfile(int $businessId, int $staffProfileId): ServiceStaffProfile
    {
        return ServiceStaffProfile::where('business_id', $businessId)->findOrFail($staffProfileId);
    }
}
