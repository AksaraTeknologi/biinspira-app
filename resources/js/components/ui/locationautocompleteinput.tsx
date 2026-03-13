'use client';

import { Input } from '@/components/ui/input';
import { useRef, useState, useEffect } from 'react';
import { MapPin, Loader2, X, Search, History } from 'lucide-react';
import { cn } from '@/lib/utils';

type GeoResult = {
    display_name: string;
    lat: string;
    lon: string;
};

interface LocationAutocompleteInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
    historySuggestions?: string[]; // 
}

export function LocationAutocompleteInput({
    value,
    onChange,
    placeholder = 'Contoh: Universitas Brawijaya Malang...',
    className,
    error,
    historySuggestions = [],
}: LocationAutocompleteInputProps) {
    const [searchQuery,    setSearchQuery]    = useState(value);
    const [geoSuggestions, setGeoSuggestions] = useState<GeoResult[]>([]);
    const [histFiltered,   setHistFiltered]   = useState<string[]>([]);
    const [isSearching,    setIsSearching]    = useState(false);
    const [searchError,    setSearchError]    = useState('');
    const [showHistory,    setShowHistory]    = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef  = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearchQuery(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setGeoSuggestions([]);
                setHistFiltered([]);
                setShowHistory(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length < 3) {
            setGeoSuggestions([]);
            setSearchError('');

            // ── Tampilkan history jika query kosong atau pendek ──
            if (searchQuery.trim().length === 0 && historySuggestions.length > 0) {
                setHistFiltered(historySuggestions);
                setShowHistory(true);
            } else if (searchQuery.trim().length > 0) {
                // Filter history sesuai keyword
                const kw = searchQuery.toLowerCase();
                const match = historySuggestions.filter(s => s.toLowerCase().includes(kw));
                setHistFiltered(match);
                setShowHistory(match.length > 0);
            } else {
                setShowHistory(false);
            }
            return;
        }

        // Filter history juga saat mengetik
        const kw = searchQuery.toLowerCase();
        const match = historySuggestions.filter(s => s.toLowerCase().includes(kw));
        setHistFiltered(match);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchGeo(searchQuery), 500);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]);

    const fetchGeo = async (q: string) => {
        setIsSearching(true);
        setSearchError('');
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=id`,
                { headers: { 'Accept-Language': 'id' } }
            );
            const data: GeoResult[] = await res.json();
            setGeoSuggestions(data);
            if (data.length === 0 && histFiltered.length === 0) setSearchError('Alamat tidak ditemukan.');
        } catch {
            setSearchError('Gagal mencari alamat.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectGeo = (result: GeoResult) => {
        setSearchQuery(result.display_name);
        onChange(result.display_name);
        setGeoSuggestions([]);
        setHistFiltered([]);
        setShowHistory(false);
        setSearchError('');
    };

    const handleSelectHistory = (val: string) => {
        setSearchQuery(val);
        onChange(val);
        setGeoSuggestions([]);
        setHistFiltered([]);
        setShowHistory(false);
        setSearchError('');
    };

    const handleClear = () => {
        setSearchQuery('');
        onChange('');
        setGeoSuggestions([]);
        setHistFiltered([]);
        setShowHistory(false);
        setSearchError('');
    };

    const hasDropdown = histFiltered.length > 0 || geoSuggestions.length > 0;

    return (
        <div ref={wrapperRef} className="space-y-1">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                    className={cn('pl-9 pr-8', error ? 'border-red-400' : '', className)}
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                        // Tampilkan semua history saat fokus dan field kosong
                        if (searchQuery.trim().length === 0 && historySuggestions.length > 0) {
                            setHistFiltered(historySuggestions);
                            setShowHistory(true);
                        }
                    }}
                    autoComplete="off"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 animate-spin" />
                )}
                {!isSearching && searchQuery && (
                    <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        onClick={handleClear}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                {/* ── Dropdown gabungan history + Nominatim ── */}
                {hasDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[500] max-h-64 overflow-y-auto">

                        {/* Section: History lokasi */}
                        {histFiltered.length > 0 && (
                            <>
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b flex items-center gap-1">
                                    <History className="h-3 w-3" /> Lokasi sebelumnya
                                </div>
                                {histFiltered.map((s, i) => (
                                    <button
                                        key={`hist-${i}`}
                                        type="button"
                                        className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-50 last:border-0 flex items-start gap-2"
                                        onClick={() => handleSelectHistory(s)}
                                    >
                                        <History className="h-3 w-3 mt-0.5 shrink-0 text-gray-300" />
                                        <span className="line-clamp-2">{s}</span>
                                    </button>
                                ))}
                            </>
                        )}

                        {/* Section: Hasil pencarian Nominatim */}
                        {geoSuggestions.length > 0 && (
                            <>
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Hasil pencarian
                                </div>
                                {geoSuggestions.map((s, i) => (
                                    <button
                                        key={`geo-${i}`}
                                        type="button"
                                        className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-50 last:border-0 flex items-start gap-2"
                                        onClick={() => handleSelectGeo(s)}
                                    >
                                        <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-gray-400" />
                                        <span className="line-clamp-2">{s.display_name}</span>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
            {searchError && !hasDropdown && <p className="text-xs text-red-500">{searchError}</p>}
            <p className="text-xs text-gray-400">Ketik alamat lalu pilih saran yang muncul.</p>
        </div>
    );
}