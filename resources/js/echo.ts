import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<'reverb'>;
    }
}

window.Pusher = Pusher;

let echoInstance: Echo<'reverb'> | null = null;

export function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (meta?.content) return meta.content;

    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);

    return '';
}

export function getEcho(): Echo<'reverb'> | null {
    if (typeof window === 'undefined') return null;
    if (echoInstance) return echoInstance;

    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
    const reverbHost = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
    const reverbPort = import.meta.env.VITE_REVERB_PORT || '8080';
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

    if (!reverbKey) {
        return null;
    }

    try {
        echoInstance = new Echo({
            broadcaster: 'reverb',
            key: reverbKey,
            wsHost: reverbHost,
            wsPort: Number(reverbPort),
            wssPort: Number(reverbPort),
            forceTLS: reverbScheme === 'https',
            enabledTransports: ['ws', 'wss'],
            authEndpoint: '/broadcasting/auth',
            auth: {
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            },
        });
        window.Echo = echoInstance;
    } catch (e) {
        console.warn('Failed to initialize Laravel Echo:', e);
    }

    return echoInstance;
}

export default getEcho;
