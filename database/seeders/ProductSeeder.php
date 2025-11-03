<?php

namespace Database\Seeders;

use App\Models\Hamper;
use App\Models\Product;
use App\Models\Variant;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Variant::create([
            'id' => 1,
            'name' => 'Manis',
            'description' => 'Koleksi kue manis premium: perpaduan cokelat lembut, selai buah segar, dan keju manis yang menghadirkan kebahagiaan di setiap gigitan.'
        ]);
        Variant::create([
            'id' => 2,
            'name' => 'Asin',
            'description' => 'Varian asin istimewa: keju panggang, ebi renyah, dan rempah rahasia yang memberi sensasi savory yang bikin ketagihan.'
        ]);
        Variant::create([
            'id' => 3,
            'name' => 'Coklat',
            'description' => 'Rangkaian cokelat intens: choco-chip renyah, medeci lembut, dan perpaduan kacang untuk pengalaman cokelat sejati.'
        ]);

        Product::create(['variant_id' => 1, 'name' => 'Almond Coklat', 'price_regular' => 105000, 'price_jar' => 70000,]);
        Product::create(['variant_id' => 1, 'name' => 'Almond Oatmeal', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Blueberry', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Cornflake Keju', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Emping Keju', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Greantea', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Lidah Kucing Keju', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Nastar Keju', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Nastar Klasik', 'price_regular' => 105000, 'price_jar' => 70000,]);
        Product::create(['variant_id' => 1, 'name' => 'Mango Orange', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Kenari Coklat', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Putri Salju Keju', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Putri Salju Mede', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 1, 'name' => 'Red Velvet', 'price_regular' => 105000, 'price_jar' => 70000,]);
        Product::create(['variant_id' => 1, 'name' => 'Sagu Keju', 'price_regular' => 105000, 'price_jar' => 70000,]);

        Product::create(['variant_id' => 2, 'name' => 'Cheesekrez', 'price_regular' => 105000, 'price_jar' => 70000,]);
        Product::create(['variant_id' => 2, 'name' => 'Ebi Bawang', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 2, 'name' => 'Kastengel', 'price_regular' => 105000, 'price_jar' => 70000,]);
        Product::create(['variant_id' => 2, 'name' => 'Kastengel Coklat', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 2, 'name' => 'Keju Kentang Pedas', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 2, 'name' => 'Keju Keju Mede', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 2, 'name' => 'Cheese Smoked', 'price_regular' => 105000, 'price_jar' => 0,]);

        Product::create(['variant_id' => 3, 'name' => 'Choco Mede', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 3, 'name' => 'Chocochip', 'price_regular' => 105000, 'price_jar' => 70000,]);
        Product::create(['variant_id' => 3, 'name' => 'Lidah Kucing Coklat', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 3, 'name' => 'Putri Mede', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 3, 'name' => 'Sunlady', 'price_regular' => 105000, 'price_jar' => 0,]);
        Product::create(['variant_id' => 3, 'name' => 'Medeci Coklat', 'price_regular' => 105000, 'price_jar' => 70000,]);
        Product::create(['variant_id' => 3, 'name' => 'Choco Oreo', 'price_regular' => 105000, 'price_jar' => 0,]);

        Hamper::create(['name' => 'Hamper Regular Isi 2 Toples', 'description' => '2 toples reguler, Hardbox Premium, Free Greeting Card', 'price' => 275000,]);
        Hamper::create(['name' => 'Hamper Regular Isi 3 Toples', 'description' => '3 toples reguler, Hardbox Premium, Free Greeting Card', 'price' => 390000,]);
        Hamper::create(['name' => 'Hamper Regular Isi 4 Toples', 'description' => '4 toples reguler, Hardbox Premium, Free Greeting Card', 'price' => 500000,]);
        Hamper::create(['name' => 'Hamper Regular Isi 6 Toples', 'description' => '6 toples reguler, Hardbox Premium, Free Greeting Card', 'price' => 730000,]);

        Hamper::create(['name' => 'Hamper Regular Isi 2 Jar', 'description' => '2 jar reguler, Hardbox Premium, Free Greeting Card', 'price' => 275000,]);
        Hamper::create(['name' => 'Hamper Regular Isi 3 Jar', 'description' => '3 jar reguler, Hardbox Premium, Free Greeting Card', 'price' => 390000,]);
        Hamper::create(['name' => 'Hamper Regular Isi 4 Jar', 'description' => '4 jar reguler, Hardbox Premium, Free Greeting Card', 'price' => 500000,]);
    }
}
