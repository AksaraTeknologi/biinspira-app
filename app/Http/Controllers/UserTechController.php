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

        $users = User::role(['technician', 'technician-intern'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->hasRole('technician') ? 'Technician' : 'Intern',
                ];
            });

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
            'role' => 'required|in:technician,technician-intern',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        // assign role
        $user->assignRole($validated['role']);

        return redirect()
            ->route('technicians.index')
            ->with('success', 'Programmer berhasil ditambahkan');
    }

    public function updateTechnician(Request $request, string $id)
    {
        /** @var User|null $authUser */
        $authUser = Auth::user();

        // 🔒 hanya admin
        if (! $authUser || ! $authUser->hasRole('admin')) {
            abort(403);
        }

        $technician = User::role(['technician', 'technician-intern'])->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $technician->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6|confirmed',
            'role' => 'required|in:technician,technician-intern',
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

        $technician->syncRoles([$validated['role']]);

        return redirect()
            ->route('technicians.index')
            ->with('success', 'Programmer berhasil diupdate');
    }

    public function destroyTechnician(string $id)
    {
        /** @var User|null $authUser */
        $authUser = Auth::user();

        // 🔒 hanya admin
        if (! $authUser || ! $authUser->hasRole('admin')) {
            abort(403);
        }

        $technician = User::role(['technician', 'technician-intern'])->findOrFail($id);
        $technician->delete();

        return redirect()
            ->route('technicians.index')
            ->with('success', 'Programmer berhasil dihapus');
    }
}
