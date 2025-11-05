<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterAdGoal extends Model
{
    use HasFactory;

    protected $guarded = ['created_at', 'updated_at'];

    public function planPlatforms()
    {
        return $this->hasMany(AdPlanPlatform::class, 'goals_id');
    }
}
