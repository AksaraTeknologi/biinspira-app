<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RevisionRequest extends Model
{
    use HasFactory, HasUuids;

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
        'application_id',
        'work_type',
    ];

    // Hubungan ke user yang bikin request
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Hubungan ke aplikasi (opsional)
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    // Hubungan ke komentar diskusi
    public function comments()
    {
        return $this->hasMany(RevisionComment::class)->latest();
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
        return $this->belongsToMany(User::class, 'revision_request_user')
            ->using(RevisionRequestUser::class);
    }

    public function attachments()
    {
        return $this->hasMany(RevisionAttachment::class);
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(RevisionSubtask::class)->orderBy('order')->orderBy('id');
    }
}