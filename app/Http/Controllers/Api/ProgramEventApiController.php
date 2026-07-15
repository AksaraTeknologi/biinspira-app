<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProgramEvent;
use Illuminate\Http\Request;

class ProgramEventApiController extends Controller
{
    /**
     * Return list of published program events.
     * Optionally filter by type: ?type=webinar|bootcamp|certification_program
     */
    public function index(Request $request)
    {
        $query = ProgramEvent::with(['schedules' => function ($q) {
            $q->orderBy('schedule_date');
        }])->orderBy('created_at', 'desc');

        // Filter by type
        if ($request->has('type') && in_array($request->type, ['webinar', 'bootcamp', 'certification_program'])) {
            $query->where('type', $request->type);
        }

        $programs = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $programs,
        ]);
    }

    /**
     * Return detail of a single program event with schedules.
     */
    public function show(string $id)
    {
        $program = ProgramEvent::with(['schedules' => function ($q) {
            $q->orderBy('schedule_date');
        }])->find($id);

        if (!$program) {
            return response()->json([
                'success' => false,
                'message' => 'Program Event not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $program,
        ]);
    }
}

