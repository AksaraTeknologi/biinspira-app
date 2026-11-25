<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PlatformClientService
{
    public const PLATFORM_LABELS = [
        'biinspira' => 'Biinspira',
        'smartcountingacademy' => 'Smartcounting Academy',
        'kompeten' => 'Kompeten',
        'sekolahpajak' => 'Sekolah Pajak',
        'talenta' => 'Talenta',
        'skillgrow' => 'Skillgrow',
        'aksademy' => 'Aksademy',
    ];

    public const CUSTOM_AUTH_HEADER_PLATFORMS = [
        'biinspira',
        'smartcounting',
        'smartcountingacademy',
    ];

    private const PLATFORM_LOGO_ALIASES = [
        'biinspira' => ['biinspira'],
        'smartcountingacademy' => ['smartcountingacademy', 'smartcounting'],
        'kompeten' => ['kompeten', 'kompetenidn'],
        'sekolahpajak' => ['sekolahpajak'],
        'talenta' => ['talenta'],
        'skillgrow' => ['skillgrow'],
        'aksademy' => ['aksademy'],
    ];

    /**
     * @return list<string>
     */
    public function getAvailablePlatformKeys(?array $platformsConfig = null): array
    {
        $platforms = $platformsConfig ?? config('services.platforms', []);
        $availableKeys = [];

        foreach (self::PLATFORM_LABELS as $key => $_label) {
            if ($this->hasPlatformCredentials($platforms[$key] ?? null)) {
                $availableKeys[] = $key;
            }
        }

        return $availableKeys;
    }

    public function hasPlatformCredentials(mixed $platform): bool
    {
        return is_array($platform) && ! empty($platform['base_url']) && ! empty($platform['token']);
    }

    public function resolveInvoicesEndpoint(string $platformKey): string
    {
        return in_array($platformKey, ['smartcounting', 'smartcountingacademy', 'biinspira'], true)
            ? 'purchases'
            : 'invoices';
    }

    public function buildPlatformRequest(string $platformKey, string $token, int $timeout = 12): PendingRequest
    {
        if (in_array($platformKey, self::CUSTOM_AUTH_HEADER_PLATFORMS, true)) {
            return Http::timeout($timeout)->withHeaders([
                'api-auth-key' => $token,
            ]);
        }

        return Http::timeout($timeout)->withToken($token);
    }

    public function buildPoolRequest(Pool $pool, string $poolKey, string $platformKey, string $token, int $timeout = 12): PendingRequest
    {
        $request = $pool->as($poolKey)->timeout($timeout);

        if (in_array($platformKey, self::CUSTOM_AUTH_HEADER_PLATFORMS, true)) {
            return $request->withHeaders([
                'api-auth-key' => $token,
            ]);
        }

        return $request->withToken($token);
    }

    /**
     * @return array<string, string>
     */
    public function buildPlatformLogoMap(): array
    {
        $logos = [];
        $users = User::query()
            ->select(['name', 'email', 'avatar'])
            ->whereNotNull('avatar')
            ->get();

        foreach (self::PLATFORM_LABELS as $platformKey => $_label) {
            $aliases = self::PLATFORM_LOGO_ALIASES[$platformKey] ?? [$platformKey];

            $matchedUser = $users->first(function (User $user) use ($platformKey): bool {
                $nameKey = $this->normalizePlatformKey((string) $user->name);
                $emailKey = $this->normalizePlatformKey(Str::before((string) $user->email, '@'));

                return $nameKey === $platformKey || $emailKey === $platformKey;
            });

            if (! $matchedUser) {
                $matchedUser = $users->first(function (User $user) use ($aliases): bool {
                    $nameKey = $this->normalizePlatformKey((string) $user->name);
                    $emailKey = $this->normalizePlatformKey(Str::before((string) $user->email, '@'));

                    foreach ($aliases as $alias) {
                        if (str_contains($nameKey, $alias) || str_contains($emailKey, $alias)) {
                            return true;
                        }
                    }

                    return false;
                });
            }

            if (! $matchedUser || ! $matchedUser->avatar) {
                continue;
            }

            $logos[$platformKey] = Str::startsWith($matchedUser->avatar, ['http://', 'https://'])
                ? $matchedUser->avatar
                : url('/storage/' . ltrim($matchedUser->avatar, '/'));
        }

        return $logos;
    }

    public function normalizePlatformKey(string $value): string
    {
        return Str::of($value)
            ->lower()
            ->replaceMatches('/[^a-z0-9]/', '')
            ->toString();
    }

    public function resolveStatisticNumber(mixed $value): float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '') {
                return 0.0;
            }

            if (is_numeric($trimmed)) {
                return (float) $trimmed;
            }

            $normalized = preg_replace('/[^0-9,.-]/', '', $trimmed);
            if ($normalized === null || $normalized === '') {
                return 0.0;
            }

            $lastComma = strrpos($normalized, ',');
            $lastDot = strrpos($normalized, '.');

            if ($lastComma !== false && $lastDot !== false) {
                if ($lastComma > $lastDot) {
                    $normalized = str_replace('.', '', $normalized);
                    $normalized = str_replace(',', '.', $normalized);
                } else {
                    $normalized = str_replace(',', '', $normalized);
                }
            } elseif ($lastComma !== false) {
                $normalized = str_replace(',', '.', $normalized);
            }

            return is_numeric($normalized) ? (float) $normalized : 0.0;
        }

        return 0.0;
    }

    public function pickStatisticValue(array $statistics, array $keys, mixed $default = 0.0): mixed
    {
        foreach ($keys as $key) {
            if (isset($statistics[$key]) && $statistics[$key] !== '') {
                return $statistics[$key];
            }
        }

        return $default;
    }
}
