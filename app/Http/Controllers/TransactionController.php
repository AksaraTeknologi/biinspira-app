<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TransactionController extends Controller
{
    private array $platformLabels = [
        'biinspira' => 'Biinspira',
        'smartcounting' => 'Smartcounting',
        'kompeten' => 'Kompeten',
        'sekolahpajak' => 'Sekolah Pajak',
        'talenta' => 'Talenta',
        'skillgrow' => 'Skillgrow',
        'aksademy' => 'Aksademy',
    ];

    private array $customAuthHeaderPlatforms = [
        'biinspira',
        'smartcounting',
    ];

    public function index(Request $request)
    {
        $platforms = config('services.platforms');
        $user = $request->user();
        $isUserRole = $user?->hasRole('user') === true;
        $userPlatformKey = $isUserRole ? $this->resolveUserPlatformKey($user, $platforms) : null;
        $hasUserPlatformAccess = $userPlatformKey !== null && $this->hasPlatformCredentials($platforms[$userPlatformKey] ?? null);
        $allowedPlatforms = array_merge(['all'], $hasUserPlatformAccess ? [$userPlatformKey] : array_keys($platforms));
        $defaultStartDate = now()->subMonth()->startOfDay()->toDateString();
        $defaultEndDate = now()->endOfDay()->toDateString();

        $validated = $request->validate([
            'platform' => ['nullable', 'string', Rule::in($allowedPlatforms)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $selectedPlatform = $isUserRole
            ? ($hasUserPlatformAccess ? $userPlatformKey : 'none')
            : ($validated['platform'] ?? 'all');
        $startDate = $validated['start_date'] ?? $defaultStartDate;
        $endDate = $validated['end_date'] ?? $defaultEndDate;

        // Build available platform list eagerly and keep UI order consistent with platformLabels.
        $availablePlatforms = [];
        foreach ($this->platformLabels as $key => $label) {
            if ($isUserRole && $key !== $userPlatformKey) {
                continue;
            }

            $platform = $platforms[$key] ?? null;
            if (!is_array($platform)) {
                continue;
            }

            if (!empty($platform['base_url']) && !empty($platform['token'])) {
                $availablePlatforms[] = [
                    'key' => $key,
                    'label' => $label,
                ];
            }
        }

        return Inertia::render('admin/transactions/index', [
            'availablePlatforms' => $availablePlatforms,
            'routeName' => $isUserRole ? 'user.transactions.index' : 'admin.transactions.index',
            'isUserRestricted' => $isUserRole,
            'filters' => [
                'platform' => $selectedPlatform,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'invoices' => Inertia::defer(function () use ($platforms, $selectedPlatform, $startDate, $endDate, $isUserRole, $hasUserPlatformAccess): array {
                if ($isUserRole && ! $hasUserPlatformAccess) {
                    return [];
                }

                return $this->fetchInvoices($platforms, $selectedPlatform, $startDate, $endDate);
            }),
        ]);
    }

    private function fetchInvoices(array $platforms, string $selectedPlatform, string $startDate, string $endDate): array
    {
        $allInvoices = [];
        $perPage = 100;
        $startTimestamp = strtotime($startDate . ' 00:00:00');
        $endTimestamp = strtotime($endDate . ' 23:59:59');
        $requestStartDate = Carbon::parse($startDate)->subDay()->toDateString();
        $requestEndDate = Carbon::parse($endDate)->addDay()->toDateString();

        $targetPlatforms = $selectedPlatform === 'all'
            ? $platforms
            : array_intersect_key($platforms, array_flip([$selectedPlatform]));

        foreach ($targetPlatforms as $key => $platform) {
            $baseUrl = $platform['base_url'] ?? null;
            $token = $platform['token'] ?? null;

            if (!$baseUrl || !$token) {
                continue;
            }

            try {
                $page = 1;
                $hasMore = true;
                $lastSignature = null;

                while ($hasMore && $page <= 100) {
                    $invoicesEndpoint = $this->resolveInvoicesEndpoint($key);

                    $response = $this->buildPlatformRequest($key, $token)
                        ->get("{$baseUrl}/{$invoicesEndpoint}", [
                            'status' => 'paid',
                            'page' => $page,
                            'per_page' => $perPage,
                            // Use a buffered window for upstream APIs because some platforms
                            // apply timezone or exclusive boundary filtering.
                            'start_date' => $requestStartDate,
                            'end_date' => $requestEndDate,
                        ]);

                    if (!$response->successful()) {
                        $this->logApiAuthKeyError(
                            $key,
                            'invoices',
                            sprintf('Gagal fetch invoices (%s) dengan header api-auth-key.', $key),
                            [
                                'status' => $response->status(),
                                'response_body' => $response->body(),
                            ]
                        );

                        break;
                    }

                    $data = $response->json('data.items');
                    if (!is_array($data)) {
                        $data = $response->json('data.data'); // Standard Laravel pagination
                    }
                    if (!is_array($data)) {
                        $data = $response->json('data', []);
                    }
                    if (!is_array($data) || empty($data)) {
                        Log::warning("Data invoices kosong untuk platform [{$key}]", [
                            'status'       => $response->status(),
                            'body_preview' => substr($response->body(), 0, 500),
                        ]);
                        break;
                    }

                    $data = array_values(array_filter($data, function ($item) use ($startTimestamp, $endTimestamp) {
                        $paidAt = $item['paid_at'] ?? null;
                        if (!$paidAt) {
                            return false;
                        }

                        $paidAtTimestamp = strtotime($paidAt);
                        if ($paidAtTimestamp === false) {
                            return false;
                        }

                        return $paidAtTimestamp >= $startTimestamp && $paidAtTimestamp <= $endTimestamp;
                    }));

                    foreach ($data as &$item) {
                        $item['source_platform'] = $key;

                        // Normalize payment fields: prioritize payment_channel across all platforms.
                        $normalizedPayment = $item['payment_channel'] ?? $item['payment_method'] ?? null;
                        $item['payment_channel'] = $normalizedPayment;
                        $item['payment_method'] = $normalizedPayment;
                    }
                    unset($item);

                    $allInvoices = array_merge($allInvoices, $data);

                    $currentPage = (int) ($response->json('data.pagination.current_page')
                        ?? $response->json('data.meta.current_page')
                        ?? $response->json('data.current_page')
                        ?? $response->json('meta.current_page')
                        ?? $page);
                    $lastPage = (int) ($response->json('data.pagination.last_page')
                        ?? $response->json('data.meta.last_page')
                        ?? $response->json('data.last_page')
                        ?? $response->json('meta.last_page')
                        ?? 0);

                    if ($lastPage > 0) {
                        $hasMore = $currentPage < $lastPage;
                    } else {
                        // Fallback if metadata is unavailable.
                        $signature = md5(json_encode(array_column($data, 'id')));
                        if ($lastSignature !== null && $signature === $lastSignature) {
                            break;
                        }
                        $lastSignature = $signature;
                        $hasMore = count($data) === $perPage;
                    }

                    $page++;
                }
            } catch (\Exception $e) {
                $this->logApiAuthKeyError(
                    $key,
                    'invoices',
                    sprintf('Exception saat fetch invoices (%s) dengan header api-auth-key.', $key),
                    [
                        'exception' => $e->getMessage(),
                    ]
                );

                // Skip platform on failure
            }
        }

        usort($allInvoices, function ($a, $b) {
            return strtotime($b['paid_at'] ?? '0') - strtotime($a['paid_at'] ?? '0');
        });

        return $allInvoices;
    }

    private function buildPlatformRequest(string $platformKey, string $token)
    {
        if (in_array($platformKey, $this->customAuthHeaderPlatforms, true)) {
            return Http::timeout(10)->withHeaders([
                'api-auth-key' => $token,
            ]);
        }

        return Http::timeout(10)->withToken($token);
    }

    private function logApiAuthKeyError(string $platformKey, string $endpoint, string $message, array $context = []): void
    {
        if (!in_array($platformKey, $this->customAuthHeaderPlatforms, true)) {
            return;
        }

        Log::error($message, array_merge([
            'platform' => $platformKey,
            'endpoint' => $endpoint,
        ], $context));
    }

    private function resolveInvoicesEndpoint(string $platformKey): string
    {
        return $platformKey === 'smartcounting' || $platformKey === 'biinspira' ? 'purchases' : 'invoices';
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
