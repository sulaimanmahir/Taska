<?php

namespace App\Services;

use App\Models\Business;
use App\Models\PushSubscription;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Sends real browser push notifications via minishlink/web-push. Requires
 * VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY to be configured (config/services.php) -
 * silently no-ops without them rather than throwing, since a business
 * running without push configured should never break because of it.
 */
class PushNotificationService
{
    private ?WebPush $client = null;

    public function isConfigured(): bool
    {
        return filled(config('services.vapid.public_key')) && filled(config('services.vapid.private_key'));
    }

    /**
     * @return array{sent: int, failed: int} counts, for the caller to log/report
     */
    public function sendToBusiness(Business $business, string $title, string $body, ?string $url = null): array
    {
        if (!$this->isConfigured()) {
            return ['sent' => 0, 'failed' => 0];
        }

        $subscriptions = PushSubscription::where('business_id', $business->id)->get();

        if ($subscriptions->isEmpty()) {
            return ['sent' => 0, 'failed' => 0];
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'url' => $url ?? '/ai-insights',
        ]);

        $webPush = $this->client();
        $sent = 0;
        $failed = 0;
        $staleSubscriptionIds = [];

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->p256dh_key,
                    'authToken' => $subscription->auth_token,
                ]),
                $payload,
            );
        }

        foreach ($webPush->flush() as $report) {
            $endpoint = $report->getRequest()->getUri()->__toString();
            $matchingSubscription = $subscriptions->first(fn (PushSubscription $sub) => $sub->endpoint === $endpoint);

            if ($report->isSuccess()) {
                $sent++;
                continue;
            }

            $failed++;

            // A push endpoint that's gone (expired, uninstalled, permission
            // revoked) will never succeed again - stop retrying it forever.
            if ($report->isSubscriptionExpired() && $matchingSubscription) {
                $staleSubscriptionIds[] = $matchingSubscription->id;
            }
        }

        if ($staleSubscriptionIds !== []) {
            PushSubscription::whereIn('id', $staleSubscriptionIds)->delete();
        }

        return ['sent' => $sent, 'failed' => $failed];
    }

    private function client(): WebPush
    {
        if ($this->client) {
            return $this->client;
        }

        return $this->client = new WebPush([
            'VAPID' => [
                'subject' => config('services.vapid.subject'),
                'publicKey' => config('services.vapid.public_key'),
                'privateKey' => config('services.vapid.private_key'),
            ],
        ]);
    }
}
