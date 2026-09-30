<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Pastikan role admin dan user admin tersedia
    Role::firstOrCreate(['name' => 'admin']);
    User::firstOrCreate(
        ['email' => 'testadmin@example.com'],
        [
            'name' => 'Test Admin',
            'password' => Hash::make('secretadmin123'),
        ]
    )->assignRole('admin');
});

test('old statistics urls redirect to new stats urls', function () {
    $this->get('/statistics')->assertRedirect('/stats');
    $this->get('/statistics-omset')->assertRedirect('/stats-omset');
    $this->get('/statistics-dashboard')->assertRedirect('/stats-dashboard');
});

test('unauthenticated visitor cannot access stats dashboard and is redirected to stats auth', function () {
    $response = $this->get('/stats-dashboard');
    $response->assertRedirect(route('tv.stats.auth'));
    $this->assertEquals(url('/stats-dashboard'), session('stats_target_url'));
});

test('unauthenticated visitor cannot access stats platform and is redirected to stats auth', function () {
    $response = $this->get('/stats');
    $response->assertRedirect(route('tv.stats.auth'));
    $this->assertEquals(url('/stats'), session('stats_target_url'));
});

test('unauthenticated visitor cannot access stats omset and is redirected to stats auth', function () {
    $response = $this->get('/stats-omset');
    $response->assertRedirect(route('tv.stats.auth'));
    $this->assertEquals(url('/stats-omset'), session('stats_target_url'));
});

test('unauthenticated ajax request to stats detail returns 401', function () {
    $response = $this->getJson('/stats/detail');
    $response->assertStatus(401);
});

test('stats auth page is accessible', function () {
    $response = $this->get(route('tv.stats.auth'));
    $response->assertOk();
});

test('submitting wrong password fails validation', function () {
    $response = $this->post(route('tv.stats.auth.submit'), [
        'password' => 'wrongpassword',
    ]);

    $response->assertSessionHasErrors('password');
    $this->assertFalse(session('stats_authenticated', false));
});

test('submitting correct admin password authenticates and redirects to target url', function () {
    session(['stats_target_url' => url('/stats-omset')]);

    $response = $this->post(route('tv.stats.auth.submit'), [
        'password' => 'secretadmin123',
        'remember' => true,
    ]);

    $response->assertRedirect('/stats-omset');
    $this->assertTrue(session('stats_authenticated'));
    $response->assertCookie('stats_device_token');
});

test('authenticated session can access stats and stats omset', function () {
    $responseDashboard = $this->withSession(['stats_authenticated' => true])->get('/stats-dashboard');
    $responseDashboard->assertOk();

    $response = $this->withSession(['stats_authenticated' => true])->get('/stats');
    $response->assertOk();

    $responseOmset = $this->withSession(['stats_authenticated' => true])->get('/stats-omset');
    $responseOmset->assertOk();
});

test('logging out via stats lock clears session and redirect to auth', function () {
    $response = $this->withSession(['stats_authenticated' => true])
        ->post(route('tv.stats.lock'));

    $response->assertRedirect(route('tv.stats.auth'));
    $this->assertNull(session('stats_authenticated'));
});

test('logged in user with admin role can access stats directly without entering password', function () {
    $admin = User::role('admin')->first();

    $response = $this->actingAs($admin)->get('/stats');
    $response->assertOk();

    $responseOmset = $this->actingAs($admin)->get('/stats-omset');
    $responseOmset->assertOk();
});

test('logged in admin cannot access stats when screen is explicitly locked until password is submitted', function () {
    $admin = User::role('admin')->first();

    // Admin locks the stats view
    $responseLock = $this->actingAs($admin)->post(route('tv.stats.lock'));
    $responseLock->assertRedirect(route('tv.stats.auth'));
    $this->assertTrue(session('stats_locked'));

    // Admin tries to view stats auth page -> sees auth page (not redirected to stats)
    $responseAuth = $this->actingAs($admin)->get(route('tv.stats.auth'));
    $responseAuth->assertOk();

    // Admin tries to bypass to stats directly -> redirected to auth
    $responseStats = $this->actingAs($admin)->get('/stats');
    $responseStats->assertRedirect(route('tv.stats.auth'));

    // Submitting password unlocks it
    $responseUnlock = $this->actingAs($admin)->post(route('tv.stats.auth.submit'), [
        'password' => 'secretadmin123',
    ]);
    $this->assertFalse(session('stats_locked', false));
    $responseUnlock->assertRedirect(route('tv.statistics'));
});

test('user with valid device token cookie can access stats directly', function () {
    $admin = User::role('admin')->first();
    $tokenHash = hash_hmac('sha256', $admin->id . $admin->password, (string) config('app.key'));
    $cookieValue = $admin->id . '|' . $tokenHash;

    $response = $this->withCookie('stats_device_token', $cookieValue)->get('/stats');
    $response->assertOk();
    $this->assertTrue(session('stats_authenticated'));
});

