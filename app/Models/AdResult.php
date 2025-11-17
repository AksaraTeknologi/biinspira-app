<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdResult extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'revenue' => 'decimal:2',
    ];

    public function plan()
    {
        return $this->belongsTo(AdPlan::class, 'ad_plan_id');
    }

    public function resultPlatforms()
    {
        return $this->hasMany(AdResultPlatform::class, 'ad_result_id');
    }
}
