<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdSpendStat extends Model
{
    use HasFactory;

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'date' => 'date',
        'amount' => 'float',
    ];

    public const PLATFORMS = [
        'biinspira' => 'Biinspira',
        'smartcounting' => 'Smartcounting',
        'sekolahpajak' => 'Sekolah Pajak',
        'kompeten' => 'Kompeten',
        'talenta' => 'Talenta',
        'levelup' => 'LevelUp Accounting',
        'aksademy' => 'Aksademy',
        'skillgrow' => 'Skill Grow',
    ];

    public const CHANNELS = [
        'boost_post' => 'Boost Post',
        'meta' => 'Meta Ads',
        'tiktok' => 'TikTok Ads',
        'google' => 'Google Ads',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
