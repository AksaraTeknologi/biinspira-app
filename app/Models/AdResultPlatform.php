<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdResultPlatform extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'total_cost' => 'decimal:2',
        'cost_month_1_amount' => 'decimal:2',
        'cost_month_2_amount' => 'decimal:2',
    ];

    public function planPlatform()
    {
        return $this->belongsTo(AdPlanPlatform::class, 'ad_plan_platform_id');
    }

    public function result()
    {
        return $this->belongsTo(AdResult::class, 'ad_result_id');
    }

    public function platform()
    {
        return $this->belongsTo(MasterPlatform::class, 'platform_id');
    }

    public function metrics()
    {
        return $this->hasMany(AdMetric::class, 'ad_result_platform_id');
    }
}
