<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketNotification extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'revision_request_id',
        'revision_comment_id',
        'sender_id',
        'sender_name',
        'ticket_title',
        'comment_body',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(RevisionRequest::class, 'revision_request_id');
    }

    public function comment(): BelongsTo
    {
        return $this->belongsTo(RevisionComment::class, 'revision_comment_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }
}
