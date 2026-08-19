@component('mail::message')
# You're invited to join {{ $business->name }}

{{ $inviter->name }} has invited you to join **{{ $business->name }}** on Taska as **{{ $role->name }}**.

@component('mail::button', ['url' => $acceptUrl])
Accept invitation
@endcomponent

This invite link expires in 7 days. If you weren't expecting this, you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
