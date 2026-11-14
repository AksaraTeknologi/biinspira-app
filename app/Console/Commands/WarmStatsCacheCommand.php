<?php

namespace App\Console\Commands;

use App\Services\OmsetComparisonService;
use App\Services\TvPlatformStatsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class WarmStatsCacheCommand extends Command
{
    protected $signature = 'stats:warm
        {--only= : Warm only a specific section (tv, omset, details)}
        {--skip-details : Skip warming drilldown detail caches}';

    protected $description = 'Pre-fetch external platform API statistics and store them in cache';

    public function handle(
        TvPlatformStatsService $tvStatsService,
        OmsetComparisonService $omsetService,
    ): int {
        $only = $this->option('only');
        $validSections = ['tv', 'omset', 'details'];

        if ($only !== null && ! in_array($only, $validSections, true)) {
            $this->error('Invalid --only option. Allowed values: tv, omset, details.');

            return self::INVALID;
        }

        $shouldRunTv = $only === null || $only === 'tv';
        $shouldRunOmset = $only === null || $only === 'omset';
        $shouldRunDetails = ($only === 'details') || ($only === null && ! $this->option('skip-details'));

        $hasFailure = false;

        if ($shouldRunTv) {
            $this->info('Warming TV platform statistics...');
            try {
                $cached = $tvStatsService->warmPlatformStats();
                $this->info(sprintf('TV platform statistics warmed (%d platform entries cached).', count($cached)));
            } catch (\Throwable $e) {
                $hasFailure = true;
                Log::error('stats:warm failed on tv section', ['error' => $e->getMessage()]);
                $this->error("TV platform statistics failed: {$e->getMessage()}");
            }
        }

        if ($shouldRunOmset) {
            $this->info('Warming Omset comparison statistics (2025 vs 2026)...');
            try {
                $omsetService->warmComparisonData();
                $this->info('Omset comparison statistics warmed.');
            } catch (\Throwable $e) {
                $hasFailure = true;
                Log::error('stats:warm failed on omset section', ['error' => $e->getMessage()]);
                $this->error("Omset comparison statistics failed: {$e->getMessage()}");
            }
        }

        if ($shouldRunDetails) {
            $this->info('Warming TV drilldown detail statistics...');
            try {
                $summary = $tvStatsService->warmDetails();
                $this->info(sprintf(
                    'TV drilldown details warmed (warmed: %d, failed: %d, skipped: %d).',
                    $summary['warmed'],
                    $summary['failed'],
                    $summary['skipped']
                ));
            } catch (\Throwable $e) {
                $hasFailure = true;
                Log::error('stats:warm failed on details section', ['error' => $e->getMessage()]);
                $this->error("TV drilldown details failed: {$e->getMessage()}");
            }
        }

        return $hasFailure ? self::FAILURE : self::SUCCESS;
    }
}
