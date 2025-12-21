<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdPlan extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'event_id',
        'status',
        "ad_schedule_time",
        "title_flayer",
        "image_flayer"
    ];
    protected $guarded = ['created_at', 'updated_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function event()
    {
        return $this->belongsTo(MasterEvent::class, 'event_id');
    }

    public function planPlatforms()
    {
        return $this->hasMany(AdPlanPlatform::class, 'ad_plan_id');
    }

    public function results()
    {
        return $this->hasMany(AdResult::class, 'ad_plan_id');
    }

    public function evaluations()
    {
        return $this->hasMany(AdEvaluation::class, 'ad_plan_id');
    }
}
