<?php

use App\Models\Application;
use App\Models\RevisionComment;
use App\Models\RevisionRequest;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'technician']);
    Role::firstOrCreate(['name' => 'technician-intern']);
    Role::firstOrCreate(['name' => 'user']);
});

test('admin can view, create, update, and delete applications', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    // 1. Index
    $response = $this->actingAs($admin)->get(route('applications.index'));
    $response->assertOk();

    // 2. Create
    $postResponse = $this->actingAs($admin)->post(route('applications.store'), [
        'name'        => 'Biinsight App',
        'description' => 'Aplikasi analisa data',
        'color'       => '#3B82F6',
        'is_active'   => true,
    ]);
    $postResponse->assertSessionHasNoErrors();
    $postResponse->assertRedirect();

    $this->assertDatabaseHas('applications', [
        'name'  => 'Biinsight App',
        'slug'  => 'biinsight-app',
        'color' => '#3B82F6',
    ]);

    $app = Application::where('name', 'Biinsight App')->first();

    // 3. Update
    $putResponse = $this->actingAs($admin)->put(route('applications.update', $app->id), [
        'name'        => 'Biinsight Pro',
        'description' => 'Aplikasi analisa data pro',
        'color'       => '#10B981',
        'is_active'   => true,
    ]);
    $putResponse->assertSessionHasNoErrors();
    $this->assertDatabaseHas('applications', [
        'id'   => $app->id,
        'name' => 'Biinsight Pro',
        'slug' => 'biinsight-pro',
    ]);

    // 4. Delete
    $deleteResponse = $this->actingAs($admin)->delete(route('applications.destroy', $app->id));
    $deleteResponse->assertSessionHasNoErrors();
    $this->assertDatabaseMissing('applications', ['id' => $app->id]);
});

test('non-admin cannot manage applications', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $this->actingAs($user)->get(route('applications.index'))->assertForbidden();
    $this->actingAs($user)->post(route('applications.store'), ['name' => 'Hack'])->assertForbidden();

    $tech = User::factory()->create();
    $tech->assignRole('technician');

    $this->actingAs($tech)->get(route('applications.index'))->assertForbidden();
});

test('ticket can be created and updated with application_id and work_type', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $user->assignRole('user');

    $app = Application::create([
        'name'      => 'Biinspira Core',
        'slug'      => 'biinspira-core',
        'is_active' => true,
    ]);

    $file = UploadedFile::fake()->create('mockup.png', 100, 'image/png');

    $response = $this->actingAs($user)->post(route('requests.store'), [
        'title'          => 'Tambah Fitur Export Excel',
        'description'    => 'Harap menambahkan export data ke excel',
        'related_url'    => 'https://example.com/test',
        'urgency'        => 'high',
        'target_role'    => 'technician',
        'deadline'       => now()->addDays(5)->toDateString(),
        'application_id' => $app->id,
        'work_type'      => 'penambahan_fitur',
        'attachments'    => [$file],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('requests.index'));

    $this->assertDatabaseHas('revision_requests', [
        'title'          => 'Tambah Fitur Export Excel',
        'application_id' => $app->id,
        'work_type'      => 'penambahan_fitur',
    ]);

    $ticket = RevisionRequest::where('title', 'Tambah Fitur Export Excel')->first();

    // Update ticket
    $updateResponse = $this->actingAs($user)->put(route('requests.update', $ticket->id), [
        'title'          => 'Tambah Fitur Export Excel & PDF',
        'description'    => 'Update deskripsi',
        'related_url'    => 'https://example.com/test2',
        'urgency'        => 'medium',
        'target_role'    => 'technician',
        'deadline'       => now()->addDays(7)->toDateString(),
        'application_id' => $app->id,
        'work_type'      => 'pengerjaan',
    ]);

    $updateResponse->assertSessionHasNoErrors();
    $this->assertDatabaseHas('revision_requests', [
        'id'        => $ticket->id,
        'title'     => 'Tambah Fitur Export Excel & PDF',
        'work_type' => 'pengerjaan',
    ]);
});

test('ticket can be created and updated without attachments', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $app = Application::create([
        'name'      => 'Biinspira Portal',
        'slug'      => 'biinspira-portal',
        'is_active' => true,
    ]);

    // Create without attachments
    $response = $this->actingAs($user)->post(route('requests.store'), [
        'title'          => 'Tiket Tanpa Lampiran',
        'description'    => 'Ini tiket tanpa lampiran file',
        'related_url'    => 'https://example.com/no-attachment',
        'urgency'        => 'low',
        'target_role'    => 'technician',
        'deadline'       => now()->addDays(3)->toDateString(),
        'application_id' => $app->id,
        'work_type'      => 'maintenance',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('requests.index'));

    $this->assertDatabaseHas('revision_requests', [
        'title' => 'Tiket Tanpa Lampiran',
    ]);

    $ticket = RevisionRequest::where('title', 'Tiket Tanpa Lampiran')->first();

    // Update without attachments
    $updateResponse = $this->actingAs($user)->put(route('requests.update', $ticket->id), [
        'title'          => 'Tiket Tanpa Lampiran Diperbarui',
        'description'    => 'Deskripsi baru',
        'related_url'    => 'https://example.com/no-attachment',
        'urgency'        => 'medium',
        'target_role'    => 'technician',
        'deadline'       => now()->addDays(4)->toDateString(),
        'application_id' => $app->id,
        'work_type'      => 'maintenance',
    ]);

    $updateResponse->assertSessionHasNoErrors();
    $this->assertDatabaseHas('revision_requests', [
        'id'    => $ticket->id,
        'title' => 'Tiket Tanpa Lampiran Diperbarui',
    ]);
});

test('role-based access control for technician and intern in index', function () {
    $techUser = User::factory()->create();
    $techUser->assignRole('technician');

    $internUser = User::factory()->create();
    $internUser->assignRole('technician-intern');

    $ticketForTech = RevisionRequest::create([
        'title'       => 'Tiket Programmer',
        'description' => 'Desc',
        'target_role' => 'technician',
        'urgency'     => 'medium',
        'status'      => 'todo',
        'created_by'  => $techUser->id,
    ]);

    $ticketForIntern = RevisionRequest::create([
        'title'       => 'Tiket Magang',
        'description' => 'Desc',
        'target_role' => 'technician-intern',
        'urgency'     => 'low',
        'status'      => 'todo',
        'created_by'  => $internUser->id,
    ]);

    // Technician should see technician tickets, but NOT intern tickets
    $responseTech = $this->actingAs($techUser)->get(route('requests.index'));
    $responseTech->assertOk();
    $tasksTech = $responseTech->original->getData()['page']['props']['tasks'] ?? [];
    $allTechTitles = collect($tasksTech)->flatten(1)->pluck('title')->toArray();

    expect($allTechTitles)->toContain('Tiket Programmer')
        ->and($allTechTitles)->not->toContain('Tiket Magang');

    // Intern should see intern tickets, but NOT programmer tickets
    $responseIntern = $this->actingAs($internUser)->get(route('requests.index'));
    $responseIntern->assertOk();
    $tasksIntern = $responseIntern->original->getData()['page']['props']['tasks'] ?? [];
    $allInternTitles = collect($tasksIntern)->flatten(1)->pluck('title')->toArray();

    expect($allInternTitles)->toContain('Tiket Magang')
        ->and($allInternTitles)->not->toContain('Tiket Programmer');
});

test('idor security: users can only delete their own tickets unless admin', function () {
    Storage::fake('public');

    $userA = User::factory()->create();
    $userA->assignRole('user');

    $userB = User::factory()->create();
    $userB->assignRole('user');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $ticketA = RevisionRequest::create([
        'title'       => 'Tiket Milik User A',
        'description' => 'Desc',
        'target_role' => 'technician',
        'urgency'     => 'medium',
        'status'      => 'request',
        'created_by'  => $userA->id,
    ]);

    // User B tries to delete User A's ticket -> 403 Forbidden
    $this->actingAs($userB)->delete(route('requests.destroy', $ticketA->id))->assertForbidden();
    $this->assertDatabaseHas('revision_requests', ['id' => $ticketA->id]);

    // User A deletes own ticket -> success
    $this->actingAs($userA)->delete(route('requests.destroy', $ticketA->id))->assertRedirect();
    $this->assertDatabaseMissing('revision_requests', ['id' => $ticketA->id]);

    // Create another ticket for User A
    $ticketA2 = RevisionRequest::create([
        'title'       => 'Tiket Milik User A Ke-2',
        'description' => 'Desc',
        'target_role' => 'technician',
        'urgency'     => 'medium',
        'status'      => 'request',
        'created_by'  => $userA->id,
    ]);

    // Admin can delete any ticket -> success
    $this->actingAs($admin)->delete(route('requests.destroy', $ticketA2->id))->assertRedirect();
    $this->assertDatabaseMissing('revision_requests', ['id' => $ticketA2->id]);
});

test('comments can be added and deleted with proper permissions', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $otherUser = User::factory()->create();
    $otherUser->assignRole('user');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $ticket = RevisionRequest::create([
        'title'       => 'Tiket Diskusi',
        'description' => 'Desc',
        'target_role' => 'technician',
        'urgency'     => 'medium',
        'status'      => 'request',
        'created_by'  => $user->id,
    ]);

    // 1. Add comment
    $addResponse = $this->actingAs($user)->post(route('requests.comment.store', $ticket->id), [
        'body' => 'Mohon segera diproses ya tim IT.',
    ]);
    $addResponse->assertSessionHasNoErrors();
    $this->assertDatabaseHas('revision_comments', [
        'revision_request_id' => $ticket->id,
        'user_id'             => $user->id,
        'body'                => 'Mohon segera diproses ya tim IT.',
    ]);

    $comment = RevisionComment::where('revision_request_id', $ticket->id)->first();

    // Verify GET comments API endpoint returns comments list
    $getCommentsResponse = $this->actingAs($user)->getJson(route('requests.comments.index', $ticket->id));
    $getCommentsResponse->assertOk();
    expect($getCommentsResponse->json('comments'))->toHaveCount(1)
        ->and($getCommentsResponse->json('comments.0.body'))->toBe('Mohon segera diproses ya tim IT.');

    // 2. Other user tries to delete -> 403 Forbidden
    $this->actingAs($otherUser)
        ->delete(route('requests.comment.destroy', ['id' => $ticket->id, 'commentId' => $comment->id]))
        ->assertForbidden();
    $this->assertDatabaseHas('revision_comments', ['id' => $comment->id]);

    // 3. Admin can delete comment
    $this->actingAs($admin)
        ->delete(route('requests.comment.destroy', ['id' => $ticket->id, 'commentId' => $comment->id]))
        ->assertRedirect();
    $this->assertDatabaseMissing('revision_comments', ['id' => $comment->id]);
});

test('statistics page accessible by admin and technician with filters', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $tech = User::factory()->create();
    $tech->assignRole('technician');

    $regularUser = User::factory()->create();
    $regularUser->assignRole('user');

    $app = Application::create([
        'name'      => 'App Test',
        'slug'      => 'app-test',
        'is_active' => true,
    ]);

    RevisionRequest::create([
        'title'          => 'Tugas 1',
        'description'    => 'Desc',
        'status'         => 'in_progress',
        'urgency'        => 'high',
        'work_type'      => 'pengerjaan',
        'application_id' => $app->id,
        'target_role'    => 'technician',
        'created_by'     => $admin->id,
    ]);

    RevisionRequest::create([
        'title'          => 'Tugas 2',
        'description'    => 'Desc',
        'status'         => 'todo',
        'urgency'        => 'medium',
        'work_type'      => 'maintenance',
        'application_id' => $app->id,
        'target_role'    => 'technician',
        'created_by'     => $admin->id,
    ]);

    // requests/create page renders successfully
    $this->actingAs($regularUser)->get(route('requests.create'))->assertOk();

    // requests/statistics redirects to stats-ticket
    $this->actingAs($admin)->get('/requests/statistics')->assertRedirect('/stats-ticket');

    // Admin can access stats-ticket directly
    $adminResponse = $this->actingAs($admin)->get(route('tv.statistics.ticket'));
    $adminResponse->assertOk();

    // JSON data endpoint returns ticketData
    $jsonResponse = $this->actingAs($admin)->get(route('tv.statistics.ticket.data'));
    $jsonResponse->assertOk();
    $data = $jsonResponse->json();
    expect($data['summary']['total_active'])->toBe(2)
        ->and($data['summary']['in_progress'])->toBe(1)
        ->and($data['summary']['todo'])->toBe(1)
        ->and($data['summary']['pengerjaan'])->toBe(1)
        ->and($data['summary']['maintenance'])->toBe(1);
});

test('ticket notifications are generated correctly based on roles and permissions', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $creator = User::factory()->create();
    $creator->assignRole('user');

    $assignedTech = User::factory()->create();
    $assignedTech->assignRole('technician');

    $unassignedTech = User::factory()->create();
    $unassignedTech->assignRole('technician');

    $ticket = RevisionRequest::create([
        'title'       => 'Tiket Notifikasi',
        'description' => 'Test notif',
        'target_role' => 'technician',
        'urgency'     => 'high',
        'status'      => 'in_progress',
        'created_by'  => $creator->id,
    ]);

    // Assign technician
    $ticket->assignees()->attach($assignedTech->id);

    // Creator posts a comment
    $this->actingAs($creator)->post(route('requests.comment.store', $ticket->id), [
        'body' => 'Ada update terbaru dari saya',
    ]);

    // 1. Admin should have notification
    $this->assertDatabaseHas('ticket_notifications', [
        'user_id'             => $admin->id,
        'revision_request_id' => $ticket->id,
        'read_at'             => null,
    ]);

    // 2. Assigned tech should have notification
    $this->assertDatabaseHas('ticket_notifications', [
        'user_id'             => $assignedTech->id,
        'revision_request_id' => $ticket->id,
        'read_at'             => null,
    ]);

    // 3. Sender (creator) should NOT have notification for own comment
    $this->assertDatabaseMissing('ticket_notifications', [
        'user_id'             => $creator->id,
        'revision_request_id' => $ticket->id,
    ]);

    // 4. Unassigned tech should NOT have notification
    $this->assertDatabaseMissing('ticket_notifications', [
        'user_id'             => $unassignedTech->id,
        'revision_request_id' => $ticket->id,
    ]);

    // 5. Check API notifications endpoint for assignedTech
    $notifResponse = $this->actingAs($assignedTech)->getJson(route('notifications.index'));
    $notifResponse->assertOk();
    expect($notifResponse->json('unread_count'))->toBe(1);

    // 6. Mark ticket notifications as read
    $readResponse = $this->actingAs($assignedTech)->postJson(route('notifications.markTicketAsRead', $ticket->id));
    $readResponse->assertOk();
    $this->assertDatabaseMissing('ticket_notifications', [
        'user_id'             => $assignedTech->id,
        'revision_request_id' => $ticket->id,
        'read_at'             => null,
    ]);
});

