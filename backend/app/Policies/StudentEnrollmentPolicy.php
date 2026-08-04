<?php

namespace App\Policies;

use App\Models\StudentEnrollment;
use App\Models\User;

class StudentEnrollmentPolicy
{
    public function update(User $user, StudentEnrollment $enrollment): bool
    {
        return (int) $user->current_business_id === (int) $enrollment->business_id;
    }
}
