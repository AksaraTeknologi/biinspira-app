<?php

use App\Http\Controllers\AdEvaluationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MasterEventController;
use App\Http\Controllers\ProgramEventController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MasterPlatformController;
use App\Http\Controllers\AdPlanPlatformController;
use App\Http\Controllers\AdResultPlatformController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\MasterAdGoalController;
use App\Http\Controllers\TvDashboardController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\UserTechController;
use App\Http\Controllers\RevisionRequestController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $user = Auth::user();

    if (! $user) {
        return redirect()->route('login');
    }

    $roles = method_exists($user, 'getRoleNames')
        ? call_user_func([$user, 'getRoleNames'])
        : collect();

    if ($roles->contains('admin')) {
        return redirect()->route('admin.marketing.dashboard');
    }

    if ($roles->contains('user')) {
        return redirect()->route('user.dashboard');
    }

    return redirect()->route('user.dashboard');
})->name('home');

Route::get('/statistics', [TvDashboardController::class, 'index'])->name('tv.statistics');
Route::get('/statistics/detail', [TvDashboardController::class, 'detail'])->name('tv.statistics.detail');

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:admin|technician'])->prefix('admin')->group(function () {
    Route::redirect('/', 'admin/dashboard')->name('admin.home');
    Route::get('marketing/{id}/print', [FormController::class, 'generatePDF'])->name('admin.marketing.print');

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
            Route::post("/update/{id}/{mode}", "update")->name("admin.marketing.update.mode");
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

        Route::get('/dashboard', [DashboardController::class, 'dashboardMarketing'])->name('admin.marketing.dashboard');
        Route::get('/marketing/show/{id}', [FormController::class, 'show'])->name('admin.marketing.show');

        // Program Event (Biinspira Induk)
        Route::controller(ProgramEventController::class)->group(function () {
            Route::get('/program-events', 'index')->name('admin.program-events.index');
            Route::get('/program-events/create', 'create')->name('admin.program-events.create');
            Route::post('/program-events', 'store')->name('admin.program-events.store');
            Route::get('/program-events/{id}/edit', 'edit')->name('admin.program-events.edit');
            Route::put('/program-events/{id}', 'update')->name('admin.program-events.update');
            Route::post('/program-events/{id}/duplicate', 'duplicate')->name('admin.program-events.duplicate');
            Route::patch('/program-events/{id}/move', 'move')->name('admin.program-events.move');
            Route::delete('/program-events/{id}', 'destroy')->name('admin.program-events.destroy');
        });
    });

    Route::get('/transactions', [TransactionController::class, 'index'])->name('admin.transactions.index');

    // ✅ BARU: Halaman grafik peserta per event (admin)
    Route::get('/audience-chart', [DashboardController::class, 'audienceChart'])->name('admin.audience.chart');
});

// ─────────────────────────────────────────────
// USER ROUTES
// ─────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:user'])->prefix('user')->as('user.')->group(function () {
    Route::redirect('/', 'user/dashboard')->name('home');
    Route::get('marketing/dashboard', [DashboardController::class, 'dashboardUser'])->name('dashboard');
    Route::get('marketing/show/{id}', [FormController::class, 'show'])->name('marketing.show');
    Route::get('marketing/{id}/print', [FormController::class, 'generatePDF'])->name('marketing.print');

    Route::controller(AdPlanPlatformController::class)->group(function () {
        Route::get('/marketing/list', 'index')->name('marketing.index');
        Route::get('/marketing/create', 'create')->name('marketing.create');
        Route::post('/marketing/store', 'store')->name('marketing.store');
        Route::get("/marketing/edit/{id}", "edit")->name("marketing.edit");
        Route::post("/update/{id}/{mode}", "update")->name("marketing.update.mode");
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

    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');

    Route::controller(MasterEventController::class)->group(function () {
        Route::get('/marketing/event', 'index')->name('events.index');
        Route::get('/marketing/event/create', 'create')->name('events.create');
        Route::post('/marketing/event/store', 'store')->name('events.store');
        Route::get('/marketing/event/edit/{id}', 'edit')->name('events.edit');
        Route::post('/marketing/event/update/{id}', 'update')->name('events.update');
        Route::delete('/marketing/event/destroy/{id}', 'destroy')->name('events.destroy');
    });

    Route::controller(ProgramEventController::class)->group(function () {
        Route::get('/program-events', 'index')->name('program-events.index');
        Route::get('/program-events/create', 'create')->name('program-events.create');
        Route::post('/program-events', 'store')->name('program-events.store');
        Route::get('/program-events/{id}/edit', 'edit')->name('program-events.edit');
        Route::put('/program-events/{id}', 'update')->name('program-events.update');
        Route::post('/program-events/{id}/duplicate', 'duplicate')->name('program-events.duplicate');
        Route::patch('/program-events/{id}/move', 'move')->name('program-events.move');
        Route::delete('/program-events/{id}', 'destroy')->name('program-events.destroy');
    });
});
// ✅ BARU: Halaman grafik peserta per event (user)
Route::get('/audience-chart', [DashboardController::class, 'audienceChart'])->name('audience.chart');

Route::middleware(['auth'])->group(function () {

    Route::get('/technicians', [UserTechController::class, 'index'])
        ->name('technicians.index');

    Route::get('/technicians/create', [UserTechController::class, 'createTechnician'])
        ->name('technicians.create');

    Route::post('/technicians', [UserTechController::class, 'storeTechnician'])
        ->name('technicians.store');

    Route::patch('/technicians/{id}', [UserTechController::class, 'updateTechnician'])
        ->name('technicians.update');

    Route::delete('/technicians/{id}', [UserTechController::class, 'destroyTechnician'])
        ->name('technicians.destroy');

    Route::get('/requests', [RevisionRequestController::class, 'index'])
        ->name('requests.index');

    Route::post('/requests', [RevisionRequestController::class, 'store']);

    Route::patch(
        '/requests/{id}/status',
        [RevisionRequestController::class, 'updateStatus']
    );

    Route::patch(
        '/requests/{id}/review',
        [RevisionRequestController::class, 'reviewAction']
    )->name('requests.review');

    Route::get('/requests/create', [RevisionRequestController::class, 'create'])
        ->name('requests.create');

    Route::post('/requests', [RevisionRequestController::class, 'store'])
        ->name('requests.store');

    Route::get('/requests/{id}/edit', [RevisionRequestController::class, 'edit'])
        ->name('requests.edit');

    Route::put('/requests/{id}', [RevisionRequestController::class, 'update'])
        ->name('requests.update');

    Route::delete('/requests/{id}', [RevisionRequestController::class, 'destroy'])
        ->name('requests.destroy');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
