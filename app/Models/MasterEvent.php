<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterEvent extends Model
{
    use HasFactory;
    protected $guarded = ['created_at', 'updated_at'];
    protected $casts = [
        'end_date' => 'date',
        'user_id' => 'string',
    ];

    public function plans()
    {
        return $this->hasMany(AdPlan::class, 'event_id');
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
