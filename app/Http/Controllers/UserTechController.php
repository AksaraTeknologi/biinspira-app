<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserTechController extends Controller
{
    public function index()
    {
        /** @var User|null $authUser */
        $authUser = Auth::user();

        if (! $authUser || ! $authUser->hasAnyRole(['admin', 'technician'])) {
            abort(403);
        }

        $users = User::role('technician')->get();

        return Inertia::render('technician/index', [
            'users' => $users
        ]);
    }

    public function createTechnician()
    {
        /** @var User|null $authUser */
        $authUser = Auth::user();

        // 🔒 hanya admin
        if (! $authUser || ! $authUser->hasRole('admin')) {
            abort(403);
        }

        return Inertia::render('technician/create');
    }
    public function storeTechnician(Request $request)
    {
        /** @var User|null $authUser */
        $authUser = Auth::user();

        // 🔒 hanya admin
        if (! $authUser || ! $authUser->hasRole('admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        // assign role
        $user->assignRole('technician');

        return redirect()
            ->route('technicians.index')
            ->with('success', 'Technician created successfully');
    }

    public function updateTechnician(Request $request, string $id)
    {
        /** @var User|null $authUser */
        $authUser = Auth::user();

        // 🔒 hanya admin
        if (! $authUser || ! $authUser->hasRole('admin')) {
            abort(403);
        }

        $technician = User::role('technician')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $technician->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $technician->update($payload);

        return redirect()
            ->route('technicians.index')
            ->with('success', 'Technician updated successfully');
    }

    public function destroyTechnician(string $id)
    {
        /** @var User|null $authUser */
        $authUser = Auth::user();

        // 🔒 hanya admin
        if (! $authUser || ! $authUser->hasRole('admin')) {
            abort(403);
        }

        $technician = User::role('technician')->findOrFail($id);
        $technician->delete();

        return redirect()
            ->route('technicians.index')
            ->with('success', 'Technician deleted successfully');
    }
}
