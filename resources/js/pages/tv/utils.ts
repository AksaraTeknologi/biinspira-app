import { AFTERNOON_QUOTES, EVENING_QUOTES, FAREWELL_QUOTES, MORNING_QUOTES } from './constants';
import type { TimeBasedMessage } from './types';

export function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatCompactCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

function getDayOfYear(date: Date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();

    return Math.floor(diff / 86400000);
}

function pickMessageByDay(messages: string[], date: Date) {
    return messages[getDayOfYear(date) % messages.length];
}

export function getTimeBasedMessage(date: Date): TimeBasedMessage {
    const hour = date.getHours();

    if (hour < 11) {
        return {
            emoji: '🌅',
            title: 'Selamat Pagi',
            message: pickMessageByDay(MORNING_QUOTES, date),
        };
    }

    if (hour < 15) {
        return {
            emoji: '☀️',
            title: 'Selamat Siang',
            message: pickMessageByDay(AFTERNOON_QUOTES, date),
        };
    }

    if (hour < 16) {
        return {
            emoji: '🌇',
            title: 'Selamat Sore',
            message: pickMessageByDay(EVENING_QUOTES, date),
        };
    }

    return {
        emoji: '👋',
        title: 'Waktunya Pulang',
        message: pickMessageByDay(FAREWELL_QUOTES, date),
    };
}
