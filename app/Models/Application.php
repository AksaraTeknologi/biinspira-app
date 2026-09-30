<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Application extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Auto-generate slug dari name
    protected static function booted(): void
    {
        static::creating(function (Application $app) {
            if (empty($app->slug)) {
                $app->slug = Str::slug($app->name);
            }
        });
    }

    public function revisionRequests()
    {
        return $this->hasMany(RevisionRequest::class);
    }
}
