<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Catalog;
use App\Models\Hamper;
use App\Models\Product;
use App\Models\Variant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_variants' => Variant::count(),
            'total_products' => Product::count(),
            'total_hampers' => Hamper::count(),
            'total_catalogs' => Catalog::count(),
            'total_agents' => Agent::count(),
        ];

        $recent_products = Product::with('variant')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $recent_hampers = Hamper::orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $recent_agents = Agent::orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $products_by_variant = Variant::withCount('products')
            ->orderBy('products_count', 'desc')
            ->get()
            ->map(function ($variant) {
                return [
                    'name' => $variant->name,
                    'count' => $variant->products_count,
                ];
            });

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recent_products' => $recent_products,
            'recent_hampers' => $recent_hampers,
            'recent_agents' => $recent_agents,
            'products_by_variant' => $products_by_variant,
        ]);
    }
}
