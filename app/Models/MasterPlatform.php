<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterPlatform extends Model
{
    use HasFactory;

    protected $guarded = ['created_at', 'updated_at'];

    public function planPlatforms()
    {
        return $this->hasMany(AdPlanPlatform::class, 'platform_id');
    }

    public function resultPlatforms()
    {
        return $this->hasMany(AdResultPlatform::class, 'platform_id');
    }
}
