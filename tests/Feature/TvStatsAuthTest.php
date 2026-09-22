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
});

test('unauthenticated visitor cannot access stats dashboard and is redirected to stats auth', function () {
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

test('user with valid device token cookie can access stats directly', function () {
    $admin = User::role('admin')->first();
    $tokenHash = hash_hmac('sha256', $admin->id . $admin->password, (string) config('app.key'));
    $cookieValue = $admin->id . '|' . $tokenHash;

    $response = $this->withCookie('stats_device_token', $cookieValue)->get('/stats');
    $response->assertOk();
    $this->assertTrue(session('stats_authenticated'));
});

