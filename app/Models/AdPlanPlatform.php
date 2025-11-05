<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdPlanPlatform extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'daily_budget' => 'decimal:2',
    ];

    public function plan()
    {
        return $this->belongsTo(AdPlan::class, 'ad_plan_id');
    }

    public function platform()
    {
        return $this->belongsTo(MasterPlatform::class, 'platform_id');
    }

    public function goal()
    {
        return $this->belongsTo(MasterAdGoal::class, 'goals_id');
    }
}
