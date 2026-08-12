<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class RevisionRequest extends Model
{
    use HasFactory;

    // Field yang bisa diisi mass assignment
    protected $fillable = [
        'title',
        'description',
        'status',
        'urgency',
        'target_role',
        'deadline',
        'related_url',
        'review_note',
        'created_by',
        'estimation_start',
        'estimation_end',
        'actual_start',
        'actual_end',
    ];

    // Hubungan ke user yang bikin request
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes untuk filter status atau urgency
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeUrgency($query, $urgency)
    {
        return $query->where('urgency', $urgency);
    }

    // Relasi ke user yang ditugaskan (assignees)
    public function assignees()
    {
        return $this->belongsToMany(User::class, 'revision_request_user');
    }

        public function attachments()
    {
        return $this->hasMany(RevisionAttachment::class);
    }
}