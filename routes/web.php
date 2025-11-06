<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MasterEventController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MasterPlatformController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->group(function () {
    Route::redirect('/', 'admin/dashboard')->name('admin.home');
    Route::controller(MasterEventController::class)->group(function () {
        Route::get('/event', 'index')->name('admin.events.index');
        Route::get('/event/create', 'create')->name('admin.events.create');
        Route::post('/event/store', 'store')->name('admin.events.store');
        Route::get('/event/edit/{id}', 'edit')->name('admin.events.edit');
        Route::post('/event/update/{id}', 'update')->name('admin.events.update');
        Route::delete('/event/destroy/{id}', 'destroy')->name('admin.events.destroy');
    });
    Route::controller(MasterPlatformController::class)->group(function () {
        Route::get('/platform', 'index')->name('admin.platforms.index');
        Route::get('/platform/create', 'create')->name('admin.platforms.create');
        Route::post('/platform/store', 'store')->name('admin.platforms.store');
        Route::get('/platform/edit/{id}', 'edit')->name('admin.platforms.edit');
        Route::post('/platform/update/{id}', 'update')->name('admin.platforms.update');
        Route::delete('/platform/destroy/{id}', 'destroy')->name('admin.platforms.destroy');
    });
    Route::controller(UserController::class)->group(function () {
        Route::get('/users', 'index')->name('admin.users.index');
        Route::get('/users/create', 'create')->name('admin.users.create');
        Route::post('/users/store', 'store')->name('admin.users.store');
        Route::get('/users/edit/{id}', 'edit')->name('admin.users.edit');
        Route::post('/users/update/{id}', 'update')->name('admin.users.update');
        Route::delete('/users/destroy/{id}', 'destroy')->name('admin.users.destroy');
    });
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
