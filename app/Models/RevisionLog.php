<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RevisionLog extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $fillable = [
        'revision_id',
        'from_status',
        'to_status',
        'changed_by',
        'changed_at'
    ];
}