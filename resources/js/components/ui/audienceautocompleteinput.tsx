'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { History, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AudienceAutocompleteInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
    historySuggestions?: string[];
}

export function AudienceAutocompleteInput({
    value,
    onChange,
    placeholder = 'Detail audiens (contoh: Hukum Pajak, Perguruan Tinggi...)',
    className,
    error,
    historySuggestions = [],
}: AudienceAutocompleteInputProps) {
    const [searchQuery, setSearchQuery] = useState(value || '');
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearchQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateFiltered = (query: string) => {
        if (!historySuggestions || historySuggestions.length === 0) {
            setFilteredSuggestions([]);
            return;
        }

        const trimmed = query.trim();
        if (trimmed.length === 0) {
            // Tampilkan semua saran
            setFilteredSuggestions(historySuggestions);
        } else {
            // Ambil token terakhir setelah koma untuk pencarian parsial
            const lastToken = trimmed.split(',').pop()?.trim().toLowerCase() || '';
            const fullKeyword = trimmed.toLowerCase();

            const matched = historySuggestions.filter((item) => {
                const lower = item.toLowerCase();
                return lower.includes(fullKeyword) || (lastToken && lower.includes(lastToken));
            });
            setFilteredSuggestions(matched);
        }
    };

    const handleInputChange = (text: string) => {
        setSearchQuery(text);
        onChange(text);
        updateFiltered(text);
        setIsOpen(true);
    };

    const handleSelectSuggestion = (selected: string) => {
        const current = searchQuery.trim();
        let newVal = '';

        if (!current) {
            newVal = selected;
        } else {
            // Cek apakah item sudah terpilih
            const existingParts = current.split(',').map((s) => s.trim()).filter(Boolean);
            if (existingParts.includes(selected)) {
                setIsOpen(false);
                return;
            }

            // Jika token terakhir sedang diketik, gantikan token terakhir dengan saran
            const hasTrailingComma = current.endsWith(',');
            if (hasTrailingComma) {
                newVal = `${current} ${selected}`;
            } else {
                // Gantikan kata terakhir yang cocok, atau tambahkan dengan koma
                const lastCommaIdx = current.lastIndexOf(',');
                if (lastCommaIdx !== -1) {
                    const prefix = current.substring(0, lastCommaIdx + 1).trim();
                    newVal = `${prefix} ${selected}`;
                } else {
                    newVal = selected;
                }
            }
        }

        setSearchQuery(newVal);
        onChange(newVal);
        setIsOpen(false);
    };

    const handleClear = () => {
        setSearchQuery('');
        onChange('');
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative space-y-1">
            <div className="relative">
                <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
                <Input
                    className={cn('pl-9 pr-8', error ? 'border-red-400' : '', className)}
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                        updateFiltered(searchQuery);
                        setIsOpen(historySuggestions.length > 0);
                    }}
                    autoComplete="off"
                />
                {searchQuery && (
                    <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        onClick={handleClear}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                {/* Dropdown History Audiens */}
                {isOpen && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md shadow-lg z-500 max-h-60 overflow-y-auto">
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-400 uppercase tracking-wide bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                                <History className="h-3 w-3" /> Audiens sebelumnya
                            </span>
                            <span className="text-[9px] text-gray-400">Klik untuk memilih</span>
                        </div>
                        {filteredSuggestions.map((item, idx) => (
                            <button
                                key={`aud-${idx}`}
                                type="button"
                                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-zinc-200 hover:bg-blue-50 dark:hover:bg-zinc-800 hover:text-blue-700 dark:hover:text-blue-400 border-b border-gray-50 dark:border-zinc-800/50 last:border-0 flex items-start gap-2 transition-colors"
                                onClick={() => handleSelectSuggestion(item)}
                            >
                                <History className="h-3 w-3 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                                <span className="line-clamp-2 leading-relaxed">{item}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
