<?php

namespace App\Http\Controllers;

use App\Services\OmsetComparisonService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class StatisticsOmsetController extends Controller
{
    public function __construct(
        private readonly OmsetComparisonService $omsetService,
    ) {}

    public function index(): Response
    {
        @set_time_limit(60);

        return Inertia::render('tv/statistics-omset', [
            'comparisonData' => Inertia::defer(fn () => $this->omsetService->getComparisonData()),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    public function refresh(): JsonResponse
    {
        @set_time_limit(60);

        $data = $this->omsetService->refreshComparisonData();

        return response()->json([
            'success' => true,
            'message' => 'Data statistik omset 2025 vs 2026 berhasil diperbarui.',
            'data' => $data,
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    public function data(): JsonResponse
    {
        return response()->json($this->omsetService->getComparisonData());
    }
}
