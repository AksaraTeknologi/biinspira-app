<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class UserTechController extends Controller
{
    public function index()
    {

        if (!auth()->user()->hasAnyRole(['admin', 'technician'])) {
            abort(403);
        }

        $users = User::role('technician')->get();

        return Inertia::render('technician/index', [
            'users' => $users
        ]);
    }

    public function createTechnician()
    {
        // 🔒 hanya admin
        if (!auth()->user()->hasRole('admin')) {
            abort(403);
        }

        return Inertia::render('technicians/create');
    }
    public function storeTechnician(Request $request)
    {
        // 🔒 hanya admin
        if (!auth()->user()->hasRole('admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|min:6',
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
}