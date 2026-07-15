<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgramEventSchedule extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function programEvent()
    {
        return $this->belongsTo(ProgramEvent::class, 'program_event_id');
    }
}
