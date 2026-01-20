<?php

namespace App\Http\Controllers;

use App\Models\MasterPlatform;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class MasterPlatformController extends Controller
{
    public function index()
    {
        $platforms = MasterPlatform::all();
        return Inertia::render('admin/platforms/platform', [
            'platforms' => $platforms,
            'dashboard_item' => 'Master Platform',
        ]);
    }
    public function create()
    {
        return Inertia::render('admin/platforms/modal/platform-modal-create', [
            'dashboard_item' => 'Buat Platform',
        ]);
    }
    public function store(Request $request) {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255', 'unique:master_platforms,name'],
        ]);
        if ($validator->fails()) {
            // dd($validator->errors());
            return redirect()->back()->withErrors($validator)->withInput();
        }

        MasterPlatform::create($validator->validated());
        return redirect()->route('admin.platforms.index');
    }
    public function edit(String $id) {
        $platform = MasterPlatform::findOrFail($id);

        return Inertia::render('admin/platforms/modal/platform-modal-edit', [
            'platform' => $platform,
            'dashboard_item' => 'Edit Platform',
        ]);
    }
    public function update(Request $request, String $id) {
        $platform = MasterPlatform::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255', 'unique:master_platforms,name,' . $platform->id],
        ]);
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $platform->update($validator->validated());
        return redirect()->route('admin.platforms.index');
    }
    public function destroy(String $id) {
        $platform = MasterPlatform::findOrFail($id);
        $platform->delete();
        return redirect()->route('admin.platforms.index');
    }
}
