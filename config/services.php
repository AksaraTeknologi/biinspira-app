<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'platforms' => [
        'aksademy' => [
            'base_url' => env('AKSADEMY_API_BASE_URL'),
            'token' => env('AKSADEMY_API_TOKEN'),
        ],
        'kompeten' => [
            'base_url' => env('KOMPETEN_API_BASE_URL'),
            'token' => env('KOMPETEN_API_TOKEN'),
        ],
        'sekolahpajak' => [
            'base_url' => env('SEKOLAHPAJAK_API_BASE_URL'),
            'token' => env('SEKOLAHPAJAK_API_TOKEN'),
        ],
        'talenta' => [
            'base_url' => env('TALENTA_API_BASE_URL'),
            'token' => env('TALENTA_API_TOKEN'),
        ],
        'skillgrow' => [
            'base_url' => env('SKILLGROW_API_BASE_URL'),
            'token' => env('SKILLGROW_API_TOKEN'),
        ],
        'smartcounting' => [
            'base_url' => env('SMARTCOUNTING_API_BASE_URL'),
            'token' => env('SMARTCOUNTING_API_TOKEN'),
        ],
        'biinspira' => [
            'base_url' => env('BIINSPIRA_API_BASE_URL'),
            'token' => env('BIINSPIRA_API_TOKEN'),
        ],
    ],

];
