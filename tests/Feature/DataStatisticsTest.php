<?php

namespace Tests\Feature;

use App\Models\AdSpendStat;
use App\Models\BrevetStat;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'user']);
    Role::firstOrCreate(['name' => 'technician']);
    Role::firstOrCreate(['name' => 'technician-intern']);

    $this->admin = User::firstOrCreate(
        ['email' => 'admin_stats_test@example.com'],
        [
            'name' => 'Admin Stats Test',
            'password' => Hash::make('password123'),
        ]
    );
    $this->admin->syncRoles(['admin']);

    $this->regularUser = User::firstOrCreate(
        ['email' => 'user_stats_test@example.com'],
        [
            'name' => 'Regular User',
            'password' => Hash::make('password123'),
        ]
    );
    $this->regularUser->syncRoles(['user']);

    $this->technician = User::firstOrCreate(
        ['email' => 'technician_stats_test@example.com'],
        [
            'name' => 'Technician User',
            'password' => Hash::make('password123'),
        ]
    );
    $this->technician->syncRoles(['technician']);

    $this->technicianIntern = User::firstOrCreate(
        ['email' => 'technician_intern_stats_test@example.com'],
        [
            'name' => 'Technician Intern User',
            'password' => Hash::make('password123'),
        ]
    );
    $this->technicianIntern->syncRoles(['technician-intern']);
});

test('admin can access ad spend stats index', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.ad-spend-stats.index'))
        ->assertOk();
});

test('regular user can access ad spend stats index and store data', function () {
    $this->actingAs($this->regularUser)
        ->get(route('admin.ad-spend-stats.index'))
        ->assertOk();

    $storeResponse = $this->actingAs($this->regularUser)
        ->post(route('admin.ad-spend-stats.store'), [
            'platform' => 'sekolahpajak',
            'date' => '2026-09-24',
            'amount' => 1500000,
            'ad_channel' => 'meta',
            'notes' => 'Input by regular user',
        ]);

    $storeResponse->assertSessionHas('success');
    $this->assertDatabaseHas('ad_spend_stats', [
        'platform' => 'sekolahpajak',
        'amount' => 1500000,
        'created_by' => $this->regularUser->id,
    ]);
});

test('technician and technician intern cannot access ad spend stats', function () {
    // Technician
    $this->actingAs($this->technician)
        ->get(route('admin.ad-spend-stats.index'))
        ->assertForbidden();

    $this->actingAs($this->technician)
        ->post(route('admin.ad-spend-stats.store'), [
            'platform' => 'sekolahpajak',
            'date' => '2026-09-24',
            'amount' => 1000000,
            'ad_channel' => 'meta',
        ])
        ->assertForbidden();

    // Technician Intern
    $this->actingAs($this->technicianIntern)
        ->get(route('admin.ad-spend-stats.index'))
        ->assertForbidden();

    $this->actingAs($this->technicianIntern)
        ->post(route('admin.ad-spend-stats.store'), [
            'platform' => 'sekolahpajak',
            'date' => '2026-09-24',
            'amount' => 1000000,
            'ad_channel' => 'meta',
        ])
        ->assertForbidden();
});

test('admin can store, update, and delete ad spend stat', function () {
    // 1. Store
    $storeResponse = $this->actingAs($this->admin)
        ->post(route('admin.ad-spend-stats.store'), [
            'platform' => 'sekolahpajak',
            'date' => '2026-09-24',
            'amount' => 5000000,
            'ad_channel' => 'meta',
            'notes' => 'Test Meta Ads',
        ]);

    $storeResponse->assertSessionHas('success');
    $this->assertDatabaseHas('ad_spend_stats', [
        'platform' => 'sekolahpajak',
        'amount' => 5000000,
        'ad_channel' => 'meta',
    ]);

    $stat = AdSpendStat::where('platform', 'sekolahpajak')->where('amount', 5000000)->first();

    // 2. Update
    $updateResponse = $this->actingAs($this->admin)
        ->put(route('admin.ad-spend-stats.update', ['id' => $stat->id]), [
            'platform' => 'sekolahpajak',
            'date' => '2026-09-25',
            'amount' => 7500000,
            'ad_channel' => 'tiktok',
            'notes' => 'Updated to TikTok Ads',
        ]);

    $updateResponse->assertSessionHas('success');
    $this->assertDatabaseHas('ad_spend_stats', [
        'id' => $stat->id,
        'amount' => 7500000,
        'ad_channel' => 'tiktok',
    ]);

    // 3. Delete
    $deleteResponse = $this->actingAs($this->admin)
        ->delete(route('admin.ad-spend-stats.destroy', ['id' => $stat->id]));

    $deleteResponse->assertSessionHas('success');
    $this->assertDatabaseMissing('ad_spend_stats', [
        'id' => $stat->id,
    ]);
});

test('admin can access brevet stats index', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.brevet-stats.index'))
        ->assertOk();
});

test('regular user can access brevet stats index and store data', function () {
    $this->actingAs($this->regularUser)
        ->get(route('admin.brevet-stats.index'))
        ->assertOk();

    $storeResponse = $this->actingAs($this->regularUser)
        ->post(route('admin.brevet-stats.store'), [
            'platform' => 'sekolahpajak',
            'batch' => 'Batch User Test',
            'month' => 'September',
            'year' => 2026,
            'weekend' => 5,
            'weekday' => 10,
            'scholarship' => 15,
            'other_brevet' => 2,
            'notes' => 'Input by regular user',
        ]);

    $storeResponse->assertSessionHas('success');
    $this->assertDatabaseHas('brevet_stats', [
        'batch' => 'Batch User Test',
        'total' => 32,
        'created_by' => $this->regularUser->id,
    ]);
});

test('technician and technician intern cannot access brevet stats', function () {
    // Technician
    $this->actingAs($this->technician)
        ->get(route('admin.brevet-stats.index'))
        ->assertForbidden();

    $this->actingAs($this->technician)
        ->post(route('admin.brevet-stats.store'), [
            'platform' => 'sekolahpajak',
            'batch' => 'Batch Tech Test',
            'month' => 'September',
            'year' => 2026,
            'weekend' => 5,
            'weekday' => 5,
            'scholarship' => 0,
            'other_brevet' => 0,
        ])
        ->assertForbidden();

    // Technician Intern
    $this->actingAs($this->technicianIntern)
        ->get(route('admin.brevet-stats.index'))
        ->assertForbidden();

    $this->actingAs($this->technicianIntern)
        ->post(route('admin.brevet-stats.store'), [
            'platform' => 'sekolahpajak',
            'batch' => 'Batch Intern Test',
            'month' => 'September',
            'year' => 2026,
            'weekend' => 5,
            'weekday' => 5,
            'scholarship' => 0,
            'other_brevet' => 0,
        ])
        ->assertForbidden();
});

test('admin can store, update, and delete brevet stat with auto total calculation', function () {
    // 1. Store
    $storeResponse = $this->actingAs($this->admin)
        ->post(route('admin.brevet-stats.store'), [
            'platform' => 'sekolahpajak',
            'batch' => 'Batch 999 Test',
            'month' => 'September',
            'year' => 2026,
            'weekend' => 10,
            'weekday' => 20,
            'scholarship' => 30,
            'other_brevet' => 5,
            'notes' => 'Test Brevet',
        ]);

    $storeResponse->assertSessionHas('success');
    $this->assertDatabaseHas('brevet_stats', [
        'platform' => 'sekolahpajak',
        'batch' => 'Batch 999 Test',
        'total' => 65, // 10 + 20 + 30 + 5
    ]);

    $stat = BrevetStat::where('batch', 'Batch 999 Test')->first();

    // 2. Update
    $updateResponse = $this->actingAs($this->admin)
        ->put(route('admin.brevet-stats.update', ['id' => $stat->id]), [
            'platform' => 'sekolahpajak',
            'batch' => 'Batch 999 Test Updated',
            'month' => 'Oktober',
            'year' => 2026,
            'weekend' => 15,
            'weekday' => 25,
            'scholarship' => 35,
            'other_brevet' => 10,
        ]);

    $updateResponse->assertSessionHas('success');
    $this->assertDatabaseHas('brevet_stats', [
        'id' => $stat->id,
        'batch' => 'Batch 999 Test Updated',
        'total' => 85, // 15 + 25 + 35 + 10
    ]);

    // 3. Delete
    $deleteResponse = $this->actingAs($this->admin)
        ->delete(route('admin.brevet-stats.destroy', ['id' => $stat->id]));

    $deleteResponse->assertSessionHas('success');
    $this->assertDatabaseMissing('brevet_stats', [
        'id' => $stat->id,
    ]);
});

test('unauthenticated visitor cannot access stats-iklan and stats-brevet without password', function () {
    $this->get('/stats-iklan')->assertRedirect(route('tv.stats.auth'));
    $this->get('/stats-brevet')->assertRedirect(route('tv.stats.auth'));
});

test('authenticated stats session can access stats-iklan and stats-brevet', function () {
    $this->withSession(['stats_authenticated' => true])
        ->get('/stats-iklan')
        ->assertOk();

    $this->withSession(['stats_authenticated' => true])
        ->get('/stats-brevet')
        ->assertOk();
});

test('user who also has technician role is strictly forbidden from data statistics', function () {
    $dualUser = User::firstOrCreate(
        ['email' => 'dual_role_test@example.com'],
        [
            'name' => 'Dual Role User',
            'password' => Hash::make('password123'),
        ]
    );
    $dualUser->syncRoles(['user', 'technician']);

    $this->actingAs($dualUser)
        ->get(route('admin.ad-spend-stats.index'))
        ->assertForbidden();

    $this->actingAs($dualUser)
        ->get(route('admin.brevet-stats.index'))
        ->assertForbidden();
});

test('stats-iklan and stats-brevet data json endpoints work when authenticated', function () {
    $this->withSession(['stats_authenticated' => true])
        ->getJson('/stats-iklan/data')
        ->assertOk()
        ->assertJsonStructure(['summary', 'monthly_data', 'platforms', 'channels']);

    $this->withSession(['stats_authenticated' => true])
        ->getJson('/stats-brevet/data')
        ->assertOk()
        ->assertJsonStructure(['platforms']);
});

test('brevet stats are ordered by newest month then platform priority', function () {
    // Create test records across months and platforms
    BrevetStat::create([
        'batch' => 'Batch Agustus SP',
        'platform' => 'sekolahpajak',
        'month' => 'Agustus',
        'year' => 2026,
        'weekend' => 10,
        'weekday' => 10,
        'scholarship' => 10,
        'other' => 0,
        'total' => 30,
        'created_by' => $this->admin->id,
    ]);

    BrevetStat::create([
        'batch' => 'Batch September SG',
        'platform' => 'skillgrow',
        'month' => 'September',
        'year' => 2026,
        'weekend' => 5,
        'weekday' => 5,
        'scholarship' => 5,
        'other' => 0,
        'total' => 15,
        'created_by' => $this->admin->id,
    ]);

    BrevetStat::create([
        'batch' => 'Batch September Biinspira',
        'platform' => 'biinspira',
        'month' => 'September',
        'year' => 2026,
        'weekend' => 8,
        'weekday' => 8,
        'scholarship' => 8,
        'other' => 0,
        'total' => 24,
        'created_by' => $this->admin->id,
    ]);

    BrevetStat::create([
        'batch' => 'Batch September Smartcounting',
        'platform' => 'smartcounting',
        'month' => 'September',
        'year' => 2026,
        'weekend' => 7,
        'weekday' => 7,
        'scholarship' => 7,
        'other' => 0,
        'total' => 21,
        'created_by' => $this->admin->id,
    ]);

    BrevetStat::create([
        'batch' => 'Batch Juli Biinspira',
        'platform' => 'biinspira',
        'month' => 'Juli',
        'year' => 2026,
        'weekend' => 6,
        'weekday' => 6,
        'scholarship' => 6,
        'other' => 0,
        'total' => 18,
        'created_by' => $this->admin->id,
    ]);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.brevet-stats.index'));

    $response->assertOk();
    $records = $response->viewData('page')['props']['records']['data'];

    // Expected order:
    // 1. September Biinspira
    // 2. September Smartcounting
    // 3. September Skill Grow
    // 4. Agustus Sekolah Pajak
    // 5. Juli Biinspira
    expect($records[0]['month'])->toBe('September');
    expect($records[0]['platform'])->toBe('biinspira');

    expect($records[1]['month'])->toBe('September');
    expect($records[1]['platform'])->toBe('smartcounting');

    expect($records[2]['month'])->toBe('September');
    expect($records[2]['platform'])->toBe('skillgrow');

    expect($records[3]['month'])->toBe('Agustus');
    expect($records[3]['platform'])->toBe('sekolahpajak');

    expect($records[4]['month'])->toBe('Juli');
    expect($records[4]['platform'])->toBe('biinspira');
});

test('tv brevet stats chart data is sorted chronologically with year displayed and same-month batches sorted by weekend batch ASC', function () {
    BrevetStat::create([
        'batch' => 'Batch 101 (weekend), 36 (weekday), 86 (beasiswa)',
        'platform' => 'sekolahpajak',
        'month' => 'Agustus',
        'year' => 2026,
        'weekend' => 12,
        'weekday' => 18,
        'scholarship' => 17,
        'other_brevet' => 0,
        'created_by' => $this->admin->id,
    ]);

    BrevetStat::create([
        'batch' => 'Batch 100 (weekend), 35 (weekday), 85 (beasiswa)',
        'platform' => 'sekolahpajak',
        'month' => 'Agustus',
        'year' => 2026,
        'weekend' => 8,
        'weekday' => 22,
        'scholarship' => 27,
        'other_brevet' => 0,
        'created_by' => $this->admin->id,
    ]);

    BrevetStat::create([
        'batch' => 'Batch 102 (weekend), 37 (weekday), 87 (beasiswa)',
        'platform' => 'sekolahpajak',
        'month' => 'September',
        'year' => 2026,
        'weekend' => 15,
        'weekday' => 6,
        'scholarship' => 23,
        'other_brevet' => 1,
        'created_by' => $this->admin->id,
    ]);

    $response = $this->withSession(['stats_authenticated' => true])
        ->getJson('/stats-brevet/data')
        ->assertOk();

    $platforms = $response->json('platforms');

    // 1. Akumulasi Group ('all')
    $allChart = $platforms['all']['chart_data'];
    expect($allChart)->toHaveCount(2);
    // Oldest (Agustus 2026) must be first (on the left), newest (September 2026) last (on the right)
    expect($allChart[0]['name'])->toBe('Agustus 2026');
    expect($allChart[1]['name'])->toBe('September 2026');

    // 2. Sekolah Pajak ('sekolahpajak')
    $spChart = $platforms['sekolahpajak']['chart_data'];
    expect($spChart)->toHaveCount(3);
    // In Agustus: Batch 100 is smaller than Batch 101, so Batch 100 on the left, Batch 101 next, Batch 102 (Sep) on the far right
    expect($spChart[0]['name'])->toBe('Batch 100 (Agu 2026)');
    expect($spChart[1]['name'])->toBe('Batch 101 (Agu 2026)');
    expect($spChart[2]['name'])->toBe('Batch 102 (Sep 2026)');
});

