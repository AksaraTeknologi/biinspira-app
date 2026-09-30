<?php

use App\Models\RevisionRequest;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

Broadcast::channel('tickets.{id}', function ($user, $id) {
    if (!$user) return false;
    if ($user->hasRole('admin')) return true;

    $ticket = RevisionRequest::find($id);
    if (!$ticket) return false;

    // Platform user yang buat tiket
    if ((string) $ticket->created_by === (string) $user->id) return true;

    // Programmer yang ditugaskan
    if ($ticket->assignees()->where('users.id', $user->id)->exists()) return true;

    // Technician role in general
    if ($user->hasAnyRole(['technician', 'technician-intern'])) return true;

    return false;
});
