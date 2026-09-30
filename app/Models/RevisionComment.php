<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RevisionComment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'revision_request_id',
        'user_id',
        'body',
    ];

    public function revisionRequest(): BelongsTo
    {
        return $this->belongsTo(RevisionRequest::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
