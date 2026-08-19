<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use App\Models\Business;
use App\Services\PushNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class CriticalAlertCommandTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_command_skips_entirely_when_push_is_not_configured(): void
    {
        $mock = $this->mock(PushNotificationService::class, function ($mock) {
            $mock->shouldReceive('isConfigured')->once()->andReturn(false);
            $mock->shouldNotReceive('sendToBusiness');
        });

        Artisan::call('taska:send-critical-alerts');

        $this->assertStringContainsString('not configured', Artisan::output());
    }

    public function test_command_sends_a_push_for_each_new_critical_insight_and_marks_it_notified(): void
    {
        $tenant = $this->createTenantContext('retail', 'alert-owner@example.com');

        AiInsight::create([
            'business_id' => $tenant['business']->id,
            'type' => 'test_critical',
            'severity' => 'critical',
            'title' => 'Critical thing happened',
            'description' => 'Something needs attention now.',
            'is_read' => false,
            'is_dismissed' => false,
        ]);

        $this->mock(PushNotificationService::class, function ($mock) {
            $mock->shouldReceive('isConfigured')->once()->andReturn(true);
            $mock->shouldReceive('sendToBusiness')
                ->once()
                ->withArgs(fn (Business $business, string $title) => $title === 'Critical thing happened')
                ->andReturn(['sent' => 1, 'failed' => 0]);
        });

        Artisan::call('taska:send-critical-alerts');

        $insight = AiInsight::where('business_id', $tenant['business']->id)->first();
        $this->assertNotNull($insight->notified_at);
    }

    public function test_command_does_not_resend_for_an_already_notified_insight(): void
    {
        $tenant = $this->createTenantContext('retail', 'alert-owner-2@example.com');

        AiInsight::create([
            'business_id' => $tenant['business']->id,
            'type' => 'test_critical',
            'severity' => 'critical',
            'title' => 'Already handled',
            'description' => 'x',
            'is_read' => false,
            'is_dismissed' => false,
            'notified_at' => now(),
        ]);

        $this->mock(PushNotificationService::class, function ($mock) {
            $mock->shouldReceive('isConfigured')->once()->andReturn(true);
            $mock->shouldNotReceive('sendToBusiness');
        });

        Artisan::call('taska:send-critical-alerts');
    }

    public function test_command_ignores_dismissed_critical_insights(): void
    {
        $tenant = $this->createTenantContext('retail', 'alert-owner-3@example.com');

        AiInsight::create([
            'business_id' => $tenant['business']->id,
            'type' => 'test_critical',
            'severity' => 'critical',
            'title' => 'Dismissed already',
            'description' => 'x',
            'is_read' => false,
            'is_dismissed' => true,
        ]);

        $this->mock(PushNotificationService::class, function ($mock) {
            $mock->shouldReceive('isConfigured')->once()->andReturn(true);
            $mock->shouldNotReceive('sendToBusiness');
        });

        Artisan::call('taska:send-critical-alerts');
    }
}
