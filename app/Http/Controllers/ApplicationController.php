<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        if (!Auth::user()->hasRole('admin')) {
            abort(403);
        }

        $query = Application::withCount('revisionRequests');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = min(50, max(5, (int) $request->input('per_page', 10)));
        $applications = $query->orderBy('name')->paginate($perPage)->withQueryString();

        return Inertia::render('applications/index', [
            'applications' => $applications,
            'filters' => [
                'search'    => $request->input('search'),
                'is_active' => $request->input('is_active'),
                'per_page'  => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->hasRole('admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:applications,name',
            'description' => 'nullable|string|max:1000',
            'color'       => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active'   => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        // Ensure slug uniqueness
        $baseSlug = $validated['slug'];
        $counter = 1;
        while (Application::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $baseSlug . '-' . $counter++;
        }

        Application::create($validated);

        return back()->with('success', 'Aplikasi berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        if (!Auth::user()->hasRole('admin')) {
            abort(403);
        }

        $app = Application::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:applications,name,' . $id,
            'description' => 'nullable|string|max:1000',
            'color'       => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active'   => 'boolean',
        ]);

        // Update slug if name changed
        if ($app->name !== $validated['name']) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Application::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }
            $validated['slug'] = $slug;
        }

        $app->update($validated);

        return back()->with('success', 'Aplikasi berhasil diperbarui.');
    }

    public function destroy($id)
    {
        if (!Auth::user()->hasRole('admin')) {
            abort(403);
        }

        $app = Application::findOrFail($id);

        // Set tiket yang menggunakan aplikasi ini menjadi null (sudah handled oleh nullOnDelete)
        $app->delete();

        return back()->with('success', 'Aplikasi berhasil dihapus.');
    }
}
