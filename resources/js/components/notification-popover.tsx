'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getCsrfToken, getEcho } from '@/echo';
import { router, usePage } from '@inertiajs/react';
import { CheckCheck, MessageSquare, MessageSquareDot } from 'lucide-react';
import { useEffect, useState } from 'react';

type NotificationItem = {
    id: number;
    revision_request_id: number;
    ticket_title: string;
    sender_name: string;
    comment_body: string;
    is_unread: boolean;
    created_at: string;
};

type PageProps = {
    auth?: {
        user?: {
            id: string | number;
            name: string;
        };
        unread_notifications_count?: number;
    };
};

export function NotificationPopover() {
    const { auth } = usePage<PageProps>().props;
    const userId = auth?.user?.id;

    const [unreadCount, setUnreadCount] = useState<number>(auth?.unread_notifications_count ?? 0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Sync initial count from Inertia props
    useEffect(() => {
        if (auth?.unread_notifications_count !== undefined) {
            setUnreadCount(auth.unread_notifications_count);
        }
    }, [auth?.unread_notifications_count]);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch('/notifications', {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unread_count ?? 0);
                setNotifications(data.notifications ?? []);
            }
        } catch {
            // Silently fail if offline
        } finally {
            setLoading(false);
        }
    };

    // Polling interval (every 20 seconds)
    useEffect(() => {
        if (!userId) return;
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 20000);
        return () => clearInterval(interval);
    }, [userId]);

    // Sinkronisasi saat notifikasi tiket tertentu dibaca dari TaskModal
    useEffect(() => {
        const handleTicketCleared = (e: any) => {
            const ticketId = e.detail?.ticketId;
            if (!ticketId) return;

            setNotifications((prev) => {
                let cleared = 0;
                const next = prev.map((n) => {
                    if (n.revision_request_id === ticketId && n.is_unread) {
                        cleared++;
                        return { ...n, is_unread: false };
                    }
                    return n;
                });
                if (cleared > 0) {
                    setUnreadCount((c) => Math.max(0, c - cleared));
                }
                return next;
            });
        };

        window.addEventListener('ticket-notifications-cleared', handleTicketCleared);
        return () => window.removeEventListener('ticket-notifications-cleared', handleTicketCleared);
    }, []);

    // Reverb Echo real-time listener
    useEffect(() => {
        if (!userId) return;
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(`App.Models.User.${userId}`);

        channel.listen('.comment.posted', (e: any) => {
            const activeOpenTicketId = typeof window !== 'undefined' ? (window as any).__ACTIVE_OPEN_TICKET_ID__ : null;
            const isTicketCurrentlyOpen = String(activeOpenTicketId) === String(e.ticket_id);

            setNotifications((prev) => [
                {
                    id: e.comment?.id ?? Date.now(),
                    revision_request_id: e.ticket_id,
                    ticket_title: e.ticket_title,
                    sender_name: e.comment?.user_name ?? 'User',
                    comment_body: e.comment?.body ?? '',
                    is_unread: !isTicketCurrentlyOpen,
                    created_at: 'Baru saja',
                },
                ...prev,
            ]);

            if (!isTicketCurrentlyOpen) {
                setUnreadCount((prev) => prev + 1);
            }
        });

        return () => {
            channel.stopListening('.comment.posted');
        };
    }, [userId]);

    // Mark single notification as read & navigate to ticket
    const handleNotificationClick = async (notif: NotificationItem) => {
        // Tandai seluruh notifikasi tiket ini telah dibaca seketika di UI
        setNotifications((prev) =>
            prev.map((n) => (n.revision_request_id === notif.revision_request_id ? { ...n, is_unread: false } : n)),
        );

        setUnreadCount((prev) => {
            const unreadOnTicket = notifications.filter(
                (n) => n.revision_request_id === notif.revision_request_id && n.is_unread,
            ).length;
            return Math.max(0, prev - (unreadOnTicket || 1));
        });

        // Tandai tiket telah dibaca di backend
        fetch(`/notifications/ticket/${notif.revision_request_id}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
        }).catch(() => {});

        setIsOpen(false);

        // Buka langsung task modal tiket jika sedang berada di board requests
        window.dispatchEvent(
            new CustomEvent('open-ticket-task', {
                detail: { taskId: notif.revision_request_id, openChat: true },
            }),
        );

        // Navigasi ke URL tiket
        const targetUrl = `/requests?open_task=${notif.revision_request_id}&open_chat=1`;
        if (typeof window !== 'undefined' && window.location.pathname === '/requests') {
            window.history.pushState({}, '', targetUrl);
        } else {
            router.visit(targetUrl);
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_unread: false })));

        try {
            await fetch('/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
        } catch {
            // Ignore error
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) fetchNotifications();
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="relative rounded-full p-2! transition-all hover:bg-gray-100 dark:hover:bg-zinc-800"
                    title="Notifikasi Diskusi Tiket"
                >
                    <MessageSquareDot className="h-5 w-5 text-gray-700 dark:text-zinc-200" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 sm:w-96 p-0 shadow-2xl rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-gray-50/70 dark:bg-zinc-800/50 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-primary dark:bg-blue-950 dark:text-blue-300">
                                {unreadCount} baru
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1 text-xs text-primary hover:underline dark:text-blue-400"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Tandai semua dibaca
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-90 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800/60">
                    {loading && notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                            Memuat notifikasi...
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/60 ${
                                    notif.is_unread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                                }`}
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold mt-0.5">
                                    {notif.sender_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <p className="text-xs font-semibold text-zinc-900 truncate dark:text-zinc-100">
                                            {notif.sender_name}
                                        </p>
                                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 shrink-0">
                                            {notif.created_at}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 truncate mt-0.5">
                                        📌 {notif.ticket_title}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-zinc-300 line-clamp-2 mt-1 leading-relaxed">
                                        {notif.comment_body}
                                    </p>
                                </div>
                                {notif.is_unread && (
                                    <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-zinc-500">
                            <MessageSquare className="h-8 w-8 text-gray-300 dark:text-zinc-600 mb-2" />
                            <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400">Belum ada notifikasi</p>
                            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                Diskusi baru pada tiket Anda akan muncul di sini.
                            </p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
