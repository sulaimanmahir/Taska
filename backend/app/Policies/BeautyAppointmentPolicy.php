<?php

namespace App\Policies;

use App\Models\BeautyAppointment;
use App\Models\User;

class BeautyAppointmentPolicy
{
    public function view(User $user, BeautyAppointment $appointment): bool
    {
        return (int) $user->current_business_id === (int) $appointment->business_id;
    }

    public function update(User $user, BeautyAppointment $appointment): bool
    {
        return (int) $user->current_business_id === (int) $appointment->business_id;
    }
}
