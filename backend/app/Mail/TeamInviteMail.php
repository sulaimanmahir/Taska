<?php

namespace App\Mail;

use App\Models\Business;
use App\Models\Role;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TeamInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Business $business,
        public Role $role,
        public User $inviter,
        public string $acceptUrl,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You're invited to join {$this->business->name} on Taska",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.team-invite',
        );
    }
}
