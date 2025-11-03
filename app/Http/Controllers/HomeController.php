<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Variant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $all_products = Product::with('variant')
            ->orderBy('created_at', 'desc')
            ->get();

        $variants = Variant::withCount('products')
            ->orderBy('name')
            ->get();

        return Inertia::render('user/home/index', [
            'all_products' => $all_products,
            'variants' => $variants,
        ]);
    }

    public function about()
    {
        return Inertia::render('user/about/index');
    }
}
