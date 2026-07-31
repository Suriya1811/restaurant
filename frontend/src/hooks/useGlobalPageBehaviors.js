import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const isModalOpen = () => {
    if (typeof document === 'undefined') return false;
    const fixedOverlays = document.querySelectorAll('[class*="fixed inset-0"], [class*="fixed inset-0 "], [data-modal-open="true"]');
    for (const el of fixedOverlays) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
            return true;
        }
    }
    return false;
};

const getGlobalFocusableElements = (root = document) => {
    if (!root) return [];
    return Array.from(root.querySelectorAll(
        'input:not([disabled]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([readonly]), select:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])'
    )).filter(el => {
        if (!el || !(el instanceof HTMLElement)) return false;
        if (el.offsetParent === null) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
        }
        while (el && el !== document.body) {
            const parentStyle = window.getComputedStyle(el);
            if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') return false;
            el = el.parentElement;
        }
        return true;
    });
};

export const useGlobalPageBehaviors = () => {
    const location = useLocation();

    // ---- Auto-focus first input on page/route change ----
    useEffect(() => {
        if (isModalOpen()) return;
        const timer = setTimeout(() => {
            const elements = getGlobalFocusableElements();
            if (elements.length > 0) {
                const dataAutoFocus = document.querySelector('[data-autofocus="true"]');
                if (dataAutoFocus && typeof dataAutoFocus.focus === 'function') {
                    try { dataAutoFocus.focus({ preventScroll: false }); } catch (_) {}
                } else {
                    const first = elements[0];
                    if (first && typeof first.focus === 'function') {
                        try {
                            first.focus({ preventScroll: false });
                            if (typeof first.select === 'function') {
                                try { first.select(); } catch (_) {}
                            }
                        } catch (_) {}
                    }
                }
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [location.pathname, location.search]);

    // ---- Global Enter / Backspace navigation ----
    const handleGlobalKeyDown = useCallback((e) => {
        if (typeof e === 'undefined' || !e.key || !e.target) return;
        if (e.defaultPrevented) return;

        const tag = (e.target.tagName || '').toUpperCase();
        const isEditable = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.target.isContentEditable;
        if (!isEditable) return;

        if (isModalOpen()) return;

        // Enter key -> move to next field (skip TEXTAREA for multi-line editing)
        if (e.key === 'Enter') {
            if (tag === 'TEXTAREA') return;
            if (e.target.closest('form')) {
                const formHasNav = e.target.closest('form')?.querySelector('[data-use-form-nav="true"]') ||
                                    e.target.closest('[data-form-nav-enabled="true"]');
                if (formHasNav) return;
            }

            const allEls = getGlobalFocusableElements();
            const idx = allEls.indexOf(e.target);
            if (idx > -1) {
                e.preventDefault();
                if (idx < allEls.length - 1) {
                    const nextEl = allEls[idx + 1];
                    if (nextEl && typeof nextEl.focus === 'function') {
                        try {
                            nextEl.focus();
                            if (typeof nextEl.select === 'function') {
                                try { nextEl.select(); } catch (_) {}
                            }
                        } catch (_) {}
                    }
                } else {
                    const submitBtn = e.target.closest('form')?.querySelector('button[type="submit"]:not([disabled])');
                    if (submitBtn && typeof submitBtn.click === 'function') {
                        try { submitBtn.click(); } catch (_) {}
                    }
                }
            }
        }
        // Backspace key -> move to previous field ONLY when empty
        else if (e.key === 'Backspace' && (tag === 'INPUT' || tag === 'TEXTAREA')) {
            if (e.target.closest('form')) {
                const formHasNav = e.target.closest('form')?.querySelector('[data-use-form-nav="true"]') ||
                                    e.target.closest('[data-form-nav-enabled="true"]');
                if (formHasNav) return;
            }

            const target = e.target;
            let emptyAndAtStart = false;
            try {
                if (typeof target.selectionStart === 'number') {
                    emptyAndAtStart = target.selectionStart === 0 && target.selectionEnd === 0 && target.value === '';
                } else {
                    emptyAndAtStart = target.value === '';
                }
            } catch (_) {
                emptyAndAtStart = target.value === '';
            }

            if (emptyAndAtStart) {
                const allEls = getGlobalFocusableElements();
                const idx = allEls.indexOf(target);
                if (idx > 0) {
                    e.preventDefault();
                    const prevEl = allEls[idx - 1];
                    if (prevEl && typeof prevEl.focus === 'function') {
                        try {
                            prevEl.focus();
                            if (typeof prevEl.select === 'function') {
                                try { prevEl.select(); } catch (_) {}
                            }
                        } catch (_) {}
                    }
                }
            }
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleGlobalKeyDown, false);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown, false);
    }, [handleGlobalKeyDown]);
};

export default useGlobalPageBehaviors;
