<?php
require __DIR__ . '/backend/vendor/autoload.php';
$app = require __DIR__ . '/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = \App\Models\User::where('email', 'commodity@taska.local')->first();
if (!$user) {
    echo "User not found\n";
    exit;
}

echo "User: " . $user->name . "\n";
echo "Email: " . $user->email . "\n";
echo "Password hash present: " . (substr($user->password, 0, 10) === '$2y$12$' ? 'Yes' : 'No') . "\n";
echo "Verify password123: " . (password_verify('password123', $user->password) ? 'OK' : 'FAILED') . "\n";
echo "\nUsers count: " . \App\Models\User::count() . "\n";