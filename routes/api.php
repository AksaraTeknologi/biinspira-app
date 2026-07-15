<?php

use App\Http\Controllers\Api\ProgramEventApiController;
use App\Http\Middleware\VerifyBiinspiraApiToken;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Biinspira (Induk)
|--------------------------------------------------------------------------
| Platform lain (aksademy, kompeten, dll) dapat mengakses data Program Event
| dari sini. Gunakan header: Authorization: Bearer {BIINSPIRA_API_TOKEN}
|
*/

Route::middleware([VerifyBiinspiraApiToken::class])->group(function () {
    Route::get('/program-events', [ProgramEventApiController::class, 'index'])
        ->name('api.program-events.index');
    Route::get('/program-events/{id}', [ProgramEventApiController::class, 'show'])
        ->name('api.program-events.show');
});
