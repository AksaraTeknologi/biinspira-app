<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStatsAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Jika pengguna saat ini sedang login di aplikasi dan memiliki role admin
        if ($request->user() && $request->user()->hasRole('admin')) {
            return $next($request);
        }

        // 2. Jika sesi browser sudah berhasil memasukkan kata sandi admin
        if ($request->session()->get('stats_authenticated') === true) {
            return $next($request);
        }

        // 3. Periksa cookie "Ingat Perangkat Ini" (stats_device_token)
        $deviceToken = $request->cookie('stats_device_token');
        if ($deviceToken && is_string($deviceToken) && str_contains($deviceToken, '|')) {
            [$userId, $tokenHash] = explode('|', $deviceToken, 2);

            /** @var User|null $adminUser */
            $adminUser = User::role('admin')->where('id', $userId)->first();
            if ($adminUser) {
                $expectedHash = hash_hmac('sha256', $adminUser->id . $adminUser->password, (string) config('app.key'));
                if (hash_equals($expectedHash, $tokenHash)) {
                    $request->session()->put('stats_authenticated', true);
                    return $next($request);
                }
            }
        }

        // 4. Jika request berupa API/JSON/AJAX (seperti /stats/detail)
        if ($request->expectsJson() || $request->isXmlHttpRequest()) {
            return response()->json([
                'message' => 'Kata sandi admin diperlukan untuk mengakses data ini.',
                'authenticated' => false,
            ], 401);
        }

        // 5. Simpan URL tujuan dan alihkan ke halaman input kata sandi
        if ($request->isMethod('GET')) {
            $request->session()->put('stats_target_url', $request->fullUrl());
        }

        return redirect()->route('tv.stats.auth');
    }
}
