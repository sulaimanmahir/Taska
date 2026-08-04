<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_owner_can_register_delivery_company(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'business_name' => 'Swifta Kaduna',
            'business_email' => 'delivery-owner@example.com',
            'business_type' => 'delivery_company',
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'password' => 'password123',
            'phone' => '08030000000',
            'role' => 'admin',
        ]);

        $response->assertCreated()
            ->assertJsonPath('business.business_type', 'delivery_company')
            ->assertJsonStructure(['token', 'user', 'business']);
    }

    public function test_user_can_login_and_receive_current_business_context(): void
    {
        $this->postJson('/api/auth/register', [
            'business_name' => 'Taska Retail',
            'business_email' => 'retail@example.com',
            'business_type' => 'retail',
            'name' => 'Retail Owner',
            'email' => 'retail-owner@example.com',
            'password' => 'password123',
            'phone' => '08031111111',
            'role' => 'admin',
        ])->assertCreated();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'retail-owner@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user', 'businesses', 'current_business']);
    }

    public function test_user_can_request_a_password_reset_link(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'recover@example.com',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'If an account exists for that email, Taska has sent a password reset link.');

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'password' => Hash::make('old-password'),
        ]);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Password reset successfully. You can now sign in with your new password.');

        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
    }
}
