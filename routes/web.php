<?php

use App\Http\Controllers\AdEvaluationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MasterEventController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MasterPlatformController;
use App\Http\Controllers\UserPagesController;
use App\Http\Controllers\AdPlanPlatformController;
use App\Http\Controllers\AdResultPlatformController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\MasterAdGoalController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthenticatedSessionController::class, 'create'])->name('home');

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->group(function () {
    Route::redirect('/', 'admin/dashboard')->name('admin.home');
    Route::controller(UserController::class)->group(function () {
        Route::get('/users', 'index')->name('admin.users.index');
        Route::get('/users/create', 'create')->name('admin.users.create');
        Route::post('/users/store', 'store')->name('admin.users.store');
        Route::get('/users/edit/{id}', 'edit')->name('admin.users.edit');
        Route::post('/users/update/{id}', 'update')->name('admin.users.update');
        Route::delete('/users/destroy/{id}', 'destroy')->name('admin.users.destroy');
    });
    Route::prefix('marketing')->group(function () {
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
        Route::controller(MasterAdGoalController::class)->group(function () {
            Route::get('/adgoals', 'index')->name('admin.adgoals.index');
            Route::get('/adgoals/create', 'create')->name('admin.adgoals.create');
            Route::post('/adgoals/store', 'store')->name('admin.adgoals.store');
            Route::get('/adgoals/edit/{id}', 'edit')->name('admin.adgoals.edit');
            Route::post('/adgoals/update/{id}', 'update')->name('admin.adgoals.update');
            Route::delete('/adgoals/destroy/{id}', 'destroy')->name('admin.adgoals.destroy');
        });
        Route::controller(AdPlanPlatformController::class)->group(function () {
            Route::get('/list', 'index')->name('admin.marketing.index');
            Route::get('/create', 'create')->name('admin.marketing.create');
            Route::post('/store', 'store')->name('admin.marketing.store');
            Route::get("/edit/{id}", "edit")->name("admin.marketing.edit");
            Route::post("/update/{id}", "update")->name("admin.marketing.update");
            Route::delete("/delete/{id}", "destroy")->name("admin.marketing.destroy");
        });
        Route::controller(AdResultPlatformController::class)->group(function () {
            Route::get("/result/{id_event}/{id_ad_plan}", "resultForm")->name("admin.marketing.result");
            Route::post("/result/store", "storeOrUpdate")->name("admin.marketing.result.store");
        });
        Route::controller(AdEvaluationController::class)->group(function () {
            Route::get("/evaluation/{id}", "evaluationForm")->name("admin.marketing.evaluation");
            Route::post("/evaluation/store", "storeOrUpdate")->name("admin.marketing.evaluation.storeOrUpdate");
        });
        Route::get('/dashboard', [DashboardController::class, "dashboardMarketing"])->name("admin.marketing.dashboard");
    });
    // Route::get('dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
});

Route::middleware(['auth', 'verified', 'role:user'])->prefix('user')->as('user.')->group(function () {
    Route::redirect('/', 'user/dashboard')->name('home');
    Route::get('dashboard', [DashboardController::class, 'dashboardUser'])->name('dashboard');

    // Route::get('form_iklan', [FormController::class, 'planForm'])->name('adsForm');
    // Route::post('plan_form', [FormController::class, 'AdPlanStore'])->name('plan.store');
    // Route::post('result_form', [FormController::class, 'AdResultStore'])->name('result.store');
    // Route::post('eval_form', [FormController::class, 'AdEvalStore'])->name('eval.store');

    Route::controller(AdPlanPlatformController::class)->group(function () {
        Route::get('/marketing/list', 'index')->name('marketing.index');
        Route::get('/marketing/create', 'create')->name('marketing.create');
        Route::post('/marketing/store', 'store')->name('marketing.store');
        Route::get("/marketing/edit/{id}", "edit")->name("marketing.edit");
        Route::post("/marketing/update/{id}", "update")->name("marketing.update");
        Route::delete("/marketing/delete/{id}", "destroy")->name("marketing.destroy");
    });
    Route::controller(AdResultPlatformController::class)->group(function () {
        Route::get("/marketing/result/{id_event}/{id_ad_plan}", "resultForm")->name("marketing.result");
        Route::post("/marketing/result/store", "storeOrUpdate")->name("marketing.result.store");
    });
    Route::controller(AdEvaluationController::class)->group(function () {
        Route::get("/marketing/evaluation/{id}", "evaluationForm")->name("marketing.evaluation");
        Route::post("/marketing/evaluation/store", "storeOrUpdate")->name("marketing.evaluation.storeOrUpdate");
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
