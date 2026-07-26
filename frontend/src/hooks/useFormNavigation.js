import { useEffect, useRef, useCallback } from 'react';

export const useFormNavigation = (dependencies = [], onSubmitRequest) => {
    const formRef = useRef(null);

    const getFocusableElements = useCallback(() => {
        if (!formRef.current) return [];
        // Get all inputs, selects, textareas, and submit buttons that are not disabled or hidden
        return Array.from(formRef.current.querySelectorAll('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])'));
    }, []);

    useEffect(() => {
        // Focus the first element when dependencies change (e.g. form modal opens)
        const timer = setTimeout(() => {
            if (!formRef.current) return;
            const elements = getFocusableElements();
            if (elements.length > 0) {
                const autoFocusElement = formRef.current.querySelector('[data-autofocus="true"]');
                if (autoFocusElement && typeof autoFocusElement.focus === 'function') {
                    autoFocusElement.focus();
                } else if (elements[0] && typeof elements[0].focus === 'function') {
                    elements[0].focus();
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [getFocusableElements, ...dependencies]);

    const handleKeyDown = useCallback((e) => {
        if (!e || !e.key) return;

        if (e.key === 'Enter') {
            const elements = getFocusableElements();
            const index = elements.indexOf(e.target);

            if (index > -1) {
                // Do not prevent default if it's a textarea or button submit
                if (e.target.tagName === 'TEXTAREA') return;

                e.preventDefault();

                // If not the last element and not a button, move to next
                if (index < elements.length - 1 && e.target.tagName !== 'BUTTON') {
                    const nextEl = elements[index + 1];
                    if (nextEl && typeof nextEl.focus === 'function') {
                        nextEl.focus();
                        if (typeof nextEl.select === 'function') {
                            try { nextEl.select(); } catch (err) {}
                        }
                    }
                } else if (onSubmitRequest) {
                    // Trigger submit confirmation when Enter is pressed on the last field or submit button
                    onSubmitRequest();
                }
            }
        } else if (e.key === 'Backspace') {
            const target = e.target;
            // Only navigate back if it is an input/textarea and it's completely empty
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                // Guard against selectionStart DOMException on non-text input types
                let isCursorAtStart = false;
                try {
                    if (typeof target.selectionStart === 'number') {
                        isCursorAtStart = target.selectionStart === 0 && target.selectionEnd === 0;
                    } else {
                        isCursorAtStart = target.value === '';
                    }
                } catch (err) {
                    isCursorAtStart = target.value === '';
                }

                if (isCursorAtStart && target.value === '') {
                    const elements = getFocusableElements();
                    const index = elements.indexOf(target);
                    if (index > 0) {
                        e.preventDefault();
                        const prevEl = elements[index - 1];
                        if (prevEl && typeof prevEl.focus === 'function') {
                            prevEl.focus();
                            if (typeof prevEl.select === 'function') {
                                try { prevEl.select(); } catch (err) {}
                            }
                        }
                    }
                }
            }
        }
    }, [getFocusableElements, onSubmitRequest]);

    return { formRef, handleKeyDown };
};
