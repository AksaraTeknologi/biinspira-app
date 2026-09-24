<?php

namespace Database\Seeders;

use App\Models\AdSpendStat;
use App\Models\BrevetStat;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DataStatisticsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Brevet Stats from user's Excel template
        if (BrevetStat::count() === 0) {
            // Sekolah Pajak (exact data from screenshot)
            BrevetStat::create([
                'platform' => 'sekolahpajak',
                'batch' => 'Batch 100 (weekend), 35 (weekday), 85 (beasiswa)',
                'month' => 'Agustus',
                'year' => 2026,
                'weekend' => 8,
                'weekday' => 22,
                'scholarship' => 27,
                'other_brevet' => 0,
            ]);

            BrevetStat::create([
                'platform' => 'sekolahpajak',
                'batch' => 'Batch 101 (weekend), 36 (weekday), 86 (beasiswa)',
                'month' => 'Agustus',
                'year' => 2026,
                'weekend' => 12,
                'weekday' => 18,
                'scholarship' => 17,
                'other_brevet' => 0,
            ]);

            BrevetStat::create([
                'platform' => 'sekolahpajak',
                'batch' => 'Batch 102 (weekend), 37 (weekday), 87 (beasiswa)',
                'month' => 'September',
                'year' => 2026,
                'weekend' => 15,
                'weekday' => 6,
                'scholarship' => 23,
                'other_brevet' => 1,
            ]);

            // SmartCounting sample data
            BrevetStat::create([
                'platform' => 'smartcounting',
                'batch' => 'Batch 48 (weekend), 12 (weekday), 30 (beasiswa)',
                'month' => 'Agustus',
                'year' => 2026,
                'weekend' => 10,
                'weekday' => 14,
                'scholarship' => 15,
                'other_brevet' => 0,
            ]);

            BrevetStat::create([
                'platform' => 'smartcounting',
                'batch' => 'Batch 49 (weekend), 13 (weekday), 31 (beasiswa)',
                'month' => 'September',
                'year' => 2026,
                'weekend' => 14,
                'weekday' => 9,
                'scholarship' => 20,
                'other_brevet' => 2,
            ]);

            // Biinspira sample data
            BrevetStat::create([
                'platform' => 'biinspira',
                'batch' => 'Batch 20 (weekend), 08 (weekday)',
                'month' => 'Agustus',
                'year' => 2026,
                'weekend' => 6,
                'weekday' => 12,
                'scholarship' => 8,
                'other_brevet' => 0,
            ]);

            BrevetStat::create([
                'platform' => 'biinspira',
                'batch' => 'Batch 21 (weekend), 09 (weekday)',
                'month' => 'September',
                'year' => 2026,
                'weekend' => 11,
                'weekday' => 10,
                'scholarship' => 14,
                'other_brevet' => 1,
            ]);

            // Kompeten sample data
            BrevetStat::create([
                'platform' => 'kompeten',
                'batch' => 'Batch 15 (weekend), 05 (weekday)',
                'month' => 'Agustus',
                'year' => 2026,
                'weekend' => 7,
                'weekday' => 8,
                'scholarship' => 10,
                'other_brevet' => 0,
            ]);

            BrevetStat::create([
                'platform' => 'kompeten',
                'batch' => 'Batch 16 (weekend), 06 (weekday)',
                'month' => 'September',
                'year' => 2026,
                'weekend' => 9,
                'weekday' => 11,
                'scholarship' => 12,
                'other_brevet' => 1,
            ]);

            // Talenta sample data
            BrevetStat::create([
                'platform' => 'talenta',
                'batch' => 'Batch 10 (weekend)',
                'month' => 'Agustus',
                'year' => 2026,
                'weekend' => 8,
                'weekday' => 5,
                'scholarship' => 6,
                'other_brevet' => 0,
            ]);

            // Aksademy sample data
            BrevetStat::create([
                'platform' => 'aksademy',
                'batch' => 'Batch 05 (weekend), 02 (beasiswa)',
                'month' => 'September',
                'year' => 2026,
                'weekend' => 12,
                'weekday' => 7,
                'scholarship' => 15,
                'other_brevet' => 0,
            ]);

            // LevelUp Accounting sample data
            BrevetStat::create([
                'platform' => 'levelup',
                'batch' => 'Batch 01 (reguler)',
                'month' => 'September',
                'year' => 2026,
                'weekend' => 5,
                'weekday' => 10,
                'scholarship' => 8,
                'other_brevet' => 0,
            ]);

            // Skill Grow sample data
            BrevetStat::create([
                'platform' => 'skillgrow',
                'batch' => 'Batch 05 (weekend), 02 (weekday)',
                'month' => 'September',
                'year' => 2026,
                'weekend' => 6,
                'weekday' => 8,
                'scholarship' => 5,
                'other_brevet' => 0,
            ]);
        }

        // 2. Seed Ad Spend Stats sample data for 2026
        if (AdSpendStat::count() === 0) {
            $platforms = ['biinspira', 'smartcounting', 'sekolahpajak', 'kompeten', 'talenta', 'levelup', 'aksademy', 'skillgrow'];
            $channels = ['boost_post', 'meta', 'tiktok', 'google'];

            // Seed monthly records for 2026 up to current month (September)
            $months = [
                1 => ['2026-01-15', 8500000],
                2 => ['2026-02-14', 9200000],
                3 => ['2026-03-20', 11000000],
                4 => ['2026-04-18', 12500000],
                5 => ['2026-05-15', 14000000],
                6 => ['2026-06-22', 13200000],
                7 => ['2026-07-16', 15800000],
                8 => ['2026-08-20', 16500000],
                9 => ['2026-09-10', 12800000],
            ];

            foreach ($platforms as $pIdx => $platform) {
                $multiplier = 1.0 + ($pIdx * 0.2); // slight variation per platform
                foreach ($months as $m => [$dateStr, $baseAmount]) {
                    foreach ($channels as $cIdx => $channel) {
                        $channelWeight = match ($channel) {
                            'meta' => 0.50,
                            'tiktok' => 0.25,
                            'google' => 0.15,
                            'boost_post' => 0.10,
                        };

                        $amount = round(($baseAmount * $multiplier * $channelWeight) / 10000) * 10000;
                        $date = Carbon::parse($dateStr)->addDays($cIdx * 2);

                        AdSpendStat::create([
                            'platform' => $platform,
                            'date' => $date->format('Y-m-d'),
                            'amount' => $amount,
                            'ad_channel' => $channel,
                            'notes' => 'Alokasi kampanye ' . AdSpendStat::CHANNELS[$channel] . ' ' . $date->translatedFormat('F Y'),
                        ]);
                    }
                }
            }
        }
    }
}
