<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class TransactionController extends Controller
{
    private array $platformLabels = [
        'aksademy' => 'Aksademy',
        'kompeten' => 'Kompeten',
        'sekolahpajak' => 'Sekolah Pajak',
        'talenta' => 'Talenta',
        'skillgrow' => 'Skillgrow',
    ];

    public function index()
    {
        $platforms = config('services.platforms');

        // Build available platform list eagerly (no API call needed)
        $availablePlatforms = [];
        foreach ($platforms as $key => $platform) {
            if (!empty($platform['base_url']) && !empty($platform['token'])) {
                $availablePlatforms[] = [
                    'key' => $key,
                    'label' => $this->platformLabels[$key] ?? $key,
                ];
            }
        }

        return Inertia::render('admin/transactions/index', [
            'availablePlatforms' => $availablePlatforms,
            'invoices' => Inertia::defer(fn() => $this->fetchInvoices($platforms)),
            'perPlatformStats' => Inertia::defer(fn() => $this->fetchStats($platforms), 'stats'),
        ]);
    }

    private function fetchInvoices(array $platforms): array
    {
        $allInvoices = [];
        $perPage = 100;

        foreach ($platforms as $key => $platform) {
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
                    $response = Http::withToken($token)
                        ->timeout(10)
                        ->get("{$baseUrl}/invoices", [
                            'status' => 'paid',
                            'page' => $page,
                            'per_page' => $perPage,
                        ]);

                    if (!$response->successful()) {
                        break;
                    }

                    $data = $response->json('data.items');
                    if (!is_array($data)) {
                        $data = $response->json('data', []);
                    }
                    if (!is_array($data) || empty($data)) {
                        break;
                    }

                    foreach ($data as &$item) {
                        $item['source_platform'] = $key;

                        // Normalize payment fields: prioritize payment_channel across all platforms.
                        $normalizedPayment = $item['payment_channel'] ?? $item['payment_method'] ?? null;
                        $item['payment_channel'] = $normalizedPayment;
                        $item['payment_method'] = $normalizedPayment;
                    }
                    unset($item);

                    $allInvoices = array_merge($allInvoices, $data);

                    $currentPage = (int) ($response->json('data.meta.current_page')
                        ?? $response->json('data.current_page')
                        ?? $response->json('meta.current_page')
                        ?? $page);
                    $lastPage = (int) ($response->json('data.meta.last_page')
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
                // Skip platform on failure
            }
        }

        usort($allInvoices, function ($a, $b) {
            return strtotime($b['paid_at'] ?? '0') - strtotime($a['paid_at'] ?? '0');
        });

        return $allInvoices;
    }

    private function fetchStats(array $platforms): array
    {
        $perPlatformStats = [];

        foreach ($platforms as $key => $platform) {
            $baseUrl = $platform['base_url'] ?? null;
            $token = $platform['token'] ?? null;

            if (!$baseUrl || !$token) {
                continue;
            }

            try {
                $response = Http::withToken($token)
                    ->timeout(10)
                    ->get("{$baseUrl}/invoices/statistics");

                if ($response->successful()) {
                    $stats = $response->json('data', []);
                    $perPlatformStats[$key] = [
                        'paid_transactions' => $stats['paid_transactions'] ?? 0,
                        'total_revenue' => $stats['total_revenue'] ?? 0,
                        'this_month_revenue' => $stats['this_month_revenue'] ?? 0,
                    ];
                }
            } catch (\Exception $e) {
                // Skip platform on failure
            }
        }

        return $perPlatformStats;
    }
}
