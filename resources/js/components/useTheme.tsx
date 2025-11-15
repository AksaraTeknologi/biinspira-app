import { useEffect, useState } from 'react';

export function useTheme() {
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
    });

    // update state bila tab lain mengubah theme
    useEffect(() => {
        const handler = () => {
            const newTheme =
                (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
            setTheme(newTheme);
        };

        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    return { theme, setTheme };
}
