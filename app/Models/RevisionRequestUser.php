<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;

class RevisionRequestUser extends Pivot
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
}
