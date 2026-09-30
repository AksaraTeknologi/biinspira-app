<?php

namespace App\Http\Controllers;

use App\Models\TicketNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Ambil notifikasi pengguna saat ini
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['unread_count' => 0, 'notifications' => []]);
        }

        $unreadCount = TicketNotification::where('user_id', $user->id)
            ->unread()
            ->count();

        $notifications = TicketNotification::where('user_id', $user->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($notif) {
                return [
                    'id'                  => $notif->id,
                    'revision_request_id' => $notif->revision_request_id,
                    'ticket_title'        => $notif->ticket_title,
                    'sender_name'         => $notif->sender_name,
                    'comment_body'        => $notif->comment_body,
                    'is_unread'           => $notif->read_at === null,
                    'created_at'          => $notif->created_at?->diffForHumans() ?? 'Baru saja',
                ];
            });

        return response()->json([
            'unread_count'  => $unreadCount,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Tandai satu notifikasi telah dibaca
     */
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        $notification = TicketNotification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }

    /**
     * Tandai semua notifikasi untuk tiket tertentu telah dibaca (saat modal dibuka)
     */
    public function markTicketAsRead(Request $request, $ticketId)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        TicketNotification::where('user_id', $user->id)
            ->where('revision_request_id', $ticketId)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Tandai semua notifikasi telah dibaca
     */
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        TicketNotification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }
}
