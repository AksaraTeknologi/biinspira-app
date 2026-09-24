<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrevetStat extends Model
{
    use HasFactory;

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'year' => 'integer',
        'weekend' => 'integer',
        'weekday' => 'integer',
        'scholarship' => 'integer',
        'other_brevet' => 'integer',
        'total' => 'integer',
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

    protected static function booted(): void
    {
        static::saving(function (BrevetStat $stat) {
            $stat->total = (int) $stat->weekend + (int) $stat->weekday + (int) $stat->scholarship + (int) $stat->other_brevet;
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
