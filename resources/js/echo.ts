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
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);

    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (meta?.content) return meta.content;

    return '';
}

export function getEcho(): Echo<'reverb'> | null {
    if (typeof window === 'undefined') return null;
    if (echoInstance) return echoInstance;

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
    const envHost = import.meta.env.VITE_REVERB_HOST;
    const reverbHost = (!isLocal && (!envHost || envHost === 'localhost' || envHost === '127.0.0.1'))
        ? window.location.hostname
        : (envHost || window.location.hostname);

    const envPort = import.meta.env.VITE_REVERB_PORT;
    const reverbPort = isHttps
        ? (envPort && envPort !== '8080' ? envPort : '443')
        : (envPort || '8080');

    const reverbScheme = isHttps ? 'https' : (import.meta.env.VITE_REVERB_SCHEME || 'http');

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
            forceTLS: reverbScheme === 'https' || isHttps,
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
