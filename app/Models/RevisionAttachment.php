<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RevisionAttachment extends Model
{
    protected $fillable = [
        'revision_request_id',
        'file_path'
    ];

    public function request()
    {
        return $this->belongsTo(RevisionRequest::class);
    }
}