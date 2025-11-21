<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function index()
    {
        $users = User::where('name', '!=', 'admin')->get();
        return Inertia::render('admin/users/user', [
            'dashboard_item' => 'User',
            'users' => $users
        ]);
    }
    public function create()
    {
        return inertia('admin/users/modal/user-modal-create', [
            'dashboard_item' => 'Buat User',
        ]);
    }
    public function edit(String $id)
    {
        $user = User::findOrFail($id);
        return Inertia::render('admin/users/modal/user-modal-edit', [
            'user' => $user
        ]);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();
        $data['password'] = bcrypt('12345678');

        $user = User::create($data);

        if ($request->hasFile('avatar')) {
            $filename = time() . '_' . $request->file('avatar')->getClientOriginalName();
            $path = $request->file('avatar')->storeAs('avatars', $filename, 'public');
            $user->update(['avatar' => $path]);
        }
        $user->assignRole('user');
        event(new Registered($user));
        return redirect()->route('admin.users.index');
    }

    public function update(Request $request, String $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $id],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        $user = User::findOrFail($id);
        $data = $validator->validated();
        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        } else {
            unset($data['password']);
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $filename = time() . '_' . $request->file('avatar')->getClientOriginalName();
            $path = $request->file('avatar')->storeAs('avatars', $filename, 'public');
            $data['avatar'] = $path;
        }

        $user->update($data);
    }
    public function destroy(String $id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return redirect()->route('admin.users.index');
    }
}
