<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RevisionSubtask extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'revision_request_id',
        'title',
        'is_completed',
        'completed_at',
        'order',
        'created_by',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'order'        => 'integer',
    ];

    public function revisionRequest(): BelongsTo
    {
        return $this->belongsTo(RevisionRequest::class, 'revision_request_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
