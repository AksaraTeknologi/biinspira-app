<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RevisionAttachment extends Model
{
    use HasUuids;

    protected $fillable = [
        'revision_request_id',
        'file_path'
    ];

    public function request()
    {
        return $this->belongsTo(RevisionRequest::class);
    }
}