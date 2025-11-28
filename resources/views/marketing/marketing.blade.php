<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Marketing Report</title>

<style>
    body {
        font-family: DejaVu Sans, sans-serif;
        font-size: 12px;
        color: #000;
    }

    h2 {
        margin-top: 10px;
        margin-bottom: 10px;
        font-size: 16px;
        font-weight: bold;
    }

    .section {
        margin-bottom: 10px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
    }

    table th, table td {
        border: 1px solid #444;
        padding: 6px;
        font-size: 11px;
    }

    table th {
        background: #f0f0f0;
        font-weight: bold;
        text-align: left;
    }

    .title {
        text-align: center;
        font-size: 20px;
        margin-bottom: 10px;
        font-weight: bold;
    }

    .sub {
        font-size: 13px;
        margin-bottom: 4px;
    }

    .metrics-row {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    }

    .metrics-column {
        flex: 1;
    }

    .metrics-table {
        width: 100%;
        border-collapse: collapse;
    }

    .metrics-table th {
        background: #e9ecef;
        font-weight: bold;
        text-align: center;
        padding: 4px;
        font-size: 10px;
    }

    .metrics-table td {
        text-align: center;
        padding: 4px;
        font-size: 10px;
        border: 1px solid #444;
    }

    .metric-header {
        background: #f8f9fa !important;
        font-weight: bold;
    }

</style>
</head>

<body>

<div class="title">Marketing Report</div>
<div class="sub">Dibuat: {{ date('d M Y') }}</div>

{{-- ======================= --}}
{{-- EVENT / GENERAL INFO --}}
{{-- ======================= --}}
<div class="section">
    <h2>Informasi Umum</h2>
    <table>
        <tr>
            <th>User</th>
            <td>{{ $data['user_name'] }}</td>
        </tr>
        <tr>
            <th>Event</th>
            <td>{{ $data['name_event'] }}</td>
        </tr>
        <tr>
            <th>Status</th>
            <td>{{ $data['status'] }}</td>
        </tr>
    </table>
</div>



{{-- ======================= --}}
{{-- PLATFORM DETAILS --}}
{{-- ======================= --}}
<div class="section">
    <h2>Detail Platform</h2>

    @foreach($data['platforms'] as $pf)
        <table style="margin-bottom: 15px;">
            <tr>
                <th>Tanggal Mulai</th>
                <td>{{ $pf['start_date'] }}</td>

                <th>Tanggal Selesai</th>
                <td>{{ $pf['end_date'] }}</td>
            </tr>

            <tr>
                <th>Platform</th>
                <td>{{ $pf['platform_name'] }}</td>

                <th>Tujuan Iklan</th>
                <td>{{ $pf['goal_name'] }}</td>
            </tr>

            <tr>
                <th>Tipe Audiens</th>
                <td>{{ $pf['targetType'] }}</td>

                <th>Target Audiens</th>
                <td>{{ $pf['targetValue'] }}</td>
            </tr>

            <tr>
                <th>Budget Harian</th>
                <td>Rp. {{ $pf['daily_budget'] }}</td>

                <th>Usia Broad</th>
                <td>{{ $pf['age_broad'] }}</td>
            </tr>

            <tr>
                <th>Lokasi Broad</th>
                <td>{{ $pf['location_broad'] }}</td>

                <th>Usia Targeted</th>
                <td>{{ $pf['age_targeted'] }}</td>
            </tr>

            <tr>
                <th>Lokasi Targeted</th>
                <td>{{ $pf['location_targeted'] }}</td>

                <th>Tipe Targeted</th>
                <td>{{ $pf['type_targeted'] }}</td>
            </tr>

            <tr>
                <th>Nama Targeted</th>
                <td colspan="3">{{ $pf['name_targeted'] }}</td>
            </tr>
        </table>
    @endforeach
</div>



{{-- ======================= --}}
{{-- RESULT DATA --}}
{{-- ======================= --}}
<div class="section">
    <h2>Result Summary</h2>

    @foreach($data['result'] as $result)
        <table style="margin-bottom: 10px;">
            <tr>
                <th>Jumlah Checkout</th>
                <td>{{ $result['checkout_count'] }}</td>

                <th>Omset Per Event</th>
                <td>Rp. {{ $result['revenue'] }}</td>
            </tr>
        </table>

        {{-- PLATFORM METRICS --}}
        @foreach($result['result_platforms'] as $rp)
            <h4 style="font-weight:bold; margin-top:10px;">
                Platform: {{ $rp['platform_name'] }}
            </h4>

            <table style="margin-bottom: 10px;">
                <tr>
                    <th>Total Biaya Iklan</th>
                    <td>Rp. {{$rp['total_cost'] }}</td>
                </tr>
            </table>

            {{-- METRICS - 7 KOLOM DIBAGI 2 BARIS --}}
            @foreach($rp['metrics'] as $m)
            <div class="metrics-row">
                {{-- KOLOM 1-7 --}}
                <div class="metrics-column">
                    <table class="metrics-table">
                        <thead>
                            <tr>
                                <th>Reach</th>
                                <th>Impressions</th>
                                <th>Cost Per Result</th>
                                <th>Clicks</th>
                                <th>Likes</th>
                                <th>Saves</th>
                                <th>Shares</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{{ $m['reach'] }}</td>
                                <td>{{ $m['impressions'] }}</td>
                                <td>Rp. {{ $m['cpr'] }}</td>
                                <td>{{ $m['clicks'] }}</td>
                                <td>{{ $m['likes'] }}</td>
                                <td>{{ $m['saves'] }}</td>
                                <td>{{ $m['shares'] }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {{-- KOLOM 8-14 --}}
                <div class="metrics-column">
                    <table class="metrics-table">
                        <thead>
                            <tr>
                                <th>Profile Visits</th>
                                <th>Follows</th>
                                <th>Direct Message</th>
                                <th>External Clicks</th>
                                <th>Result Ads</th>
                                <th>Click Whatsapp</th>
                                <th>Chat Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{{ $m['profile_visits'] }}</td>
                                <td>{{ $m['follows'] }}</td>
                                <td>{{ $m['direct_messages'] }}</td>
                                <td>{{ $m['external_link_clicks'] }}</td>
                                <td>{{ $m['result_ads'] }}</td>
                                <td>{{ $m['click_whatsapp'] }}</td>
                                <td>{{ $m['chat_admin'] }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            @endforeach
        @endforeach

    @endforeach
</div>




{{-- ======================= --}}
{{-- EVALUATION --}}
{{-- ======================= --}}
<div class="section">
    <h2>Evaluation</h2>

    @foreach($data['evaluation'] as $ev)
        <table style="margin-bottom: 10px;">

            <tr>
                <th>Previous Event</th>
                <td colspan="3">{{ $ev['previous_event'] }}</td>
            </tr>

            <tr>
                <th>Previous Checkout</th>
                <td>{{ $ev['previous_checkout'] }}</td>

                <th>Current Checkout</th>
                <td>{{ $ev['current_checkout'] }}</td>
            </tr>

            <tr>
                <th>Previous Ad Performance</th>
                <td>{{ $ev['previous_ad_performance'] }}</td>

                <th>Current Ad Performance</th>
                <td>{{ $ev['current_ad_performance'] }}</td>
            </tr>

            <tr>
                <th>Previous Other Performance</th>
                <td>{{ $ev['previous_other_performance'] }}</td>

                <th>Current Other Performance</th>
                <td>{{ $ev['current_other_performance'] }}</td>
            </tr>

            <tr>
                <th>Next Ad Strategy</th>
                <td colspan="3">{{ $ev['next_ad_strategy'] }}</td>
            </tr>

        </table>
    @endforeach
</div>

</body>
</html>
