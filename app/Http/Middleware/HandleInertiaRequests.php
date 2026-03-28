<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $roles = $user?->getRoleNames() ?? collect();
        $isUserRole = $roles->contains('user');
        $platforms = config('services.platforms', []);
        $userPlatformKey = $isUserRole ? $this->resolveUserPlatformKey($user, $platforms) : null;
        $canViewTransactions = ! $isUserRole || ($userPlatformKey !== null && $this->hasPlatformCredentials($platforms[$userPlatformKey] ?? null));

        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'role' => $request->user()?->getRoleNames() ?? [],
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'message' => fn() => $request->session()->get('message'),
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error')
            ],
            'transactionAccess' => [
                'can_view' => $canViewTransactions,
                'platform_key' => $userPlatformKey,
            ],
        ];
    }

    private function resolveUserPlatformKey(?User $user, array $platforms): ?string
    {
        if (! $user) {
            return null;
        }

        $platformKeys = array_keys($platforms);
        $emailUsername = Str::before((string) $user->email, '@');
        $candidates = [
            $this->normalizePlatformKey($user->name),
            $this->normalizePlatformKey($emailUsername),
        ];

        foreach ($candidates as $candidate) {
            if ($candidate !== null && in_array($candidate, $platformKeys, true)) {
                return $candidate;
            }
        }

        return null;
    }

    private function normalizePlatformKey(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        $normalized = Str::of($value)
            ->lower()
            ->replaceMatches('/[^a-z0-9]/', '')
            ->toString();

        return $normalized !== '' ? $normalized : null;
    }

    private function hasPlatformCredentials(mixed $platform): bool
    {
        return is_array($platform) && ! empty($platform['base_url']) && ! empty($platform['token']);
    }
}
