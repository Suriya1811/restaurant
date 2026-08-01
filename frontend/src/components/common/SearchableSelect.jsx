import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

/* ─── Shared Searchable Dropdown Select Component ─── */
const SearchableSelect = memo(({
    name,
    value,
    options = [],
    placeholder = "Select...",
    onChange,
    onKeyDown,
    inputRef,
    required = false,
    className = "",
    uppercase = false,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const displayBtnRef = useRef(null);

    const normalizedOptions = useMemo(() => {
        if (!Array.isArray(options)) return [];
        return options.map(opt => {
            if (typeof opt === 'object' && opt !== null) {
                const val = opt.value !== undefined ? opt.value : (opt.name !== undefined ? opt.name : (opt._id !== undefined ? opt._id : (opt.percentage !== undefined ? String(opt.percentage) : '')));
                const labelStr = opt.label || (opt.percentage !== undefined ? `${opt.name || 'GST'} (${opt.percentage}%)` : opt.name) || String(val || '');
                return { value: String(val), label: String(labelStr) };
            }
            return { value: String(opt), label: String(opt) };
        });
    }, [options]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return normalizedOptions;
        const term = searchTerm.toLowerCase();
        return normalizedOptions.filter(o =>
            String(o.label).toLowerCase().includes(term) ||
            String(o.value).toLowerCase().includes(term)
        );
    }, [normalizedOptions, searchTerm]);

    const selectedOption = useMemo(() => {
        return normalizedOptions.find(o => String(o.value) === String(value));
    }, [normalizedOptions, value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setHighlightedIndex(0);
            setTimeout(() => {
                if (searchInputRef.current) searchInputRef.current.focus();
            }, 50);
        }
    }, [isOpen]);

    const handleSelect = (optValue) => {
        if (onChange) {
            onChange({ target: { name, value: optValue, type: 'select-one' } });
        }
        setIsOpen(false);
        setSearchTerm('');
        if (displayBtnRef.current) displayBtnRef.current.focus();
    };

    const handleBtnKeyDown = (e) => {
        if (disabled) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setIsOpen(true);
        } else if (onKeyDown) {
            onKeyDown(e, name);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % Math.max(1, filteredOptions.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % Math.max(1, filteredOptions.length));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                handleSelect(filteredOptions[highlightedIndex].value);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
            if (displayBtnRef.current) displayBtnRef.current.focus();
        } else if (e.key === 'Tab') {
            setIsOpen(false);
            if (onKeyDown) onKeyDown(e, name);
        }
    };

    const setRef = (node) => {
        displayBtnRef.current = node;
        if (inputRef) {
            if (typeof inputRef === 'function') inputRef(node);
            else inputRef.current = node;
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {required && (
                <input
                    tabIndex={-1}
                    value={value || ''}
                    onChange={() => {}}
                    required={required}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
                />
            )}

            <button
                ref={setRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                onKeyDown={handleBtnKeyDown}
                className={`w-full text-left flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold ${uppercase ? 'uppercase' : ''} ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
            >
                <span className={`truncate ${!selectedOption ? 'text-slate-400 font-normal' : 'text-slate-800'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
            </button>

            {isOpen && !disabled && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-orange-200 rounded-md shadow-2xl z-[9999] overflow-hidden animate-in fade-in duration-150">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setHighlightedIndex(0);
                            }}
                            onKeyDown={handleSearchKeyDown}
                            className="w-full bg-transparent text-xs outline-none font-semibold text-slate-800 placeholder-slate-400"
                        />
                        {searchTerm && (
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); setSearchTerm(''); }} className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1">
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-0.5 pointer-events-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-slate-400 font-medium text-center">
                                No matching options
                            </div>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const isSelected = String(opt.value) === String(value);
                                const isHighlighted = idx === highlightedIndex;
                                return (
                                    <div
                                        key={`${opt.value}-${idx}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelect(opt.value);
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelect(opt.value);
                                        }}
                                        onMouseEnter={() => setHighlightedIndex(idx)}
                                        className={`px-3 py-2 text-xs rounded cursor-pointer transition-colors flex items-center justify-between font-semibold select-none pointer-events-auto ${
                                            isSelected ? 'bg-orange-50 text-orange-700 font-bold' : isHighlighted ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                                        } ${uppercase ? 'uppercase' : ''}`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && <Check size={14} className="text-orange-600 shrink-0 ml-2" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

export default SearchableSelect;
