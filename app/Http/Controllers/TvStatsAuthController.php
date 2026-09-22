<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class TvStatsAuthController extends Controller
{
    /**
     * Tampilkan halaman masukkan kata sandi TV statistik.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        // Jika sudah login sebagai admin atau sesi statistik sudah aktif, langsung alihkan
        if (($request->user() && $request->user()->hasRole('admin')) || $request->session()->get('stats_authenticated') === true) {
            $targetUrl = $request->session()->pull('stats_target_url', route('tv.statistics'));
            return redirect()->to($targetUrl);
        }

        return Inertia::render('tv/stats-auth');
    }

    /**
     * Verifikasi kata sandi admin.
     */
    public function authenticate(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ], [
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        $inputPassword = (string) $request->input('password');

        // Ambil semua pengguna dengan role admin
        $adminUsers = User::role('admin')->get();

        $matchedAdmin = null;
        foreach ($adminUsers as $admin) {
            if (Hash::check($inputPassword, $admin->password)) {
                $matchedAdmin = $admin;
                break;
            }
        }

        if (! $matchedAdmin) {
            return back()->withErrors([
                'password' => 'Kata sandi akun admin tidak cocok. Silakan coba lagi.',
            ]);
        }

        // Tandai sesi terotentikasi untuk statistik
        $request->session()->put('stats_authenticated', true);
        $targetUrl = $request->session()->pull('stats_target_url', route('tv.statistics'));

        $response = redirect()->to($targetUrl);

        // Jika opsi ingat perangkat dicentang, buat cookie selama 30 hari
        if ($request->boolean('remember')) {
            $tokenHash = hash_hmac('sha256', $matchedAdmin->id . $matchedAdmin->password, (string) config('app.key'));
            $cookieValue = $matchedAdmin->id . '|' . $tokenHash;
            $response->withCookie(cookie('stats_device_token', $cookieValue, 43200, '/', null, null, true, false, 'Lax'));
        }

        return $response;
    }

    /**
     * Kunci kembali tampilan statistik.
     */
    public function lock(Request $request): RedirectResponse
    {
        $request->session()->forget(['stats_authenticated', 'stats_target_url']);
        $cookie = cookie()->forget('stats_device_token');

        return redirect()->route('tv.stats.auth')->withCookie($cookie);
    }
}
