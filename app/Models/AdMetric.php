<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdMetric extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function result()
    {
        return $this->belongsTo(AdResult::class, 'ad_result_id');
    }

    public function platform()
    {
        return $this->belongsTo(MasterPlatform::class, 'platform_id');
    }
}
