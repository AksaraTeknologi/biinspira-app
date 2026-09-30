<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated visitor can access stats dashboard and receives expected inertia props', function () {
    $response = $this->withSession(['stats_authenticated' => true])->get('/stats-dashboard');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('tv/stats-dashboard')
        ->has('overview.active_platforms_count')
        ->has('overview.active_tickets_count')
        ->has('overview.in_progress_tickets_count')
        ->has('overview.brevet_total_year')
        ->has('overview.ad_spend_this_month')
        ->has('overview.ad_spend_this_year')
        ->has('overview.year')
        ->has('generatedAt')
    );
});

test('all stats pages render their expected inertia components', function () {
    $session = ['stats_authenticated' => true];

    $this->withSession($session)->get('/stats-dashboard')
        ->assertInertia(fn (Assert $page) => $page->component('tv/stats-dashboard'));

    $this->withSession($session)->get('/stats')
        ->assertInertia(fn (Assert $page) => $page->component('tv/dashboard'));

    $this->withSession($session)->get('/stats-omset')
        ->assertInertia(fn (Assert $page) => $page->component('tv/statistics-omset'));

    $this->withSession($session)->get('/stats-iklan')
        ->assertInertia(fn (Assert $page) => $page->component('tv/ad-spend-stats'));

    $this->withSession($session)->get('/stats-brevet')
        ->assertInertia(fn (Assert $page) => $page->component('tv/brevet-stats'));

    $this->withSession($session)->get('/stats-ticket')
        ->assertInertia(fn (Assert $page) => $page->component('tv/ticket-stats'));
});
