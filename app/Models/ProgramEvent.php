<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProgramEvent extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'start_time'                             => 'datetime',
        'end_time'                               => 'datetime',
        'start_date'                             => 'date',
        'end_date'                               => 'date',
        'registration_deadline'                  => 'datetime',
        'socialization_registration_deadline'    => 'datetime',
        'strikethrough_price'                    => 'integer',
        'price'                                  => 'integer',
        'scholarship_price'                      => 'integer',
        'quota'                                  => 'integer',
    ];

    /**
     * Auto-generate slug from title if not provided.
     */
    protected static function booted(): void
    {
        static::creating(function ($program) {
            if (empty($program->slug)) {
                $base = Str::slug($program->title);
                $slug = $base;
                $count = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = "{$base}-{$count}";
                    $count++;
                }
                $program->slug = $slug;
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function schedules()
    {
        return $this->hasMany(ProgramEventSchedule::class, 'program_event_id');
    }

    public function mainSchedules()
    {
        return $this->hasMany(ProgramEventSchedule::class, 'program_event_id')
            ->where('schedule_type', 'main')
            ->orderBy('schedule_date');
    }

    public function socializationSchedules()
    {
        return $this->hasMany(ProgramEventSchedule::class, 'program_event_id')
            ->where('schedule_type', 'socialization')
            ->orderBy('schedule_date');
    }
}
