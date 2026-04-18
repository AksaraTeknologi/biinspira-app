<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RevisionLog extends Model
{
       public $timestamps = false;
    protected $fillable = [
        'revision_id',
        'from_status',
        'to_status',
        'changed_by',
        'changed_at'
    ];

    
}