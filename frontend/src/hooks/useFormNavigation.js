import { useEffect, useRef, useCallback } from 'react';

export const useFormNavigation = (dependencies = [], onSubmitRequest) => {
    const formRef = useRef(null);

    // Mark the form with a data attribute so global navigation handler skips it
    useEffect(() => {
        if (formRef.current && formRef.current instanceof HTMLElement) {
            formRef.current.setAttribute('data-form-nav-enabled', 'true');
            formRef.current.dataset.formNavEnabled = 'true';
        }
    }, []);

    const getFocusableElements = useCallback(() => {
        if (!formRef.current) return [];
        return Array.from(formRef.current.querySelectorAll('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])'));
    }, []);

    useEffect(() => {
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
                if (e.target.tagName === 'TEXTAREA') return;

                e.preventDefault();

                if (index < elements.length - 1 && e.target.tagName !== 'BUTTON') {
                    const nextEl = elements[index + 1];
                    if (nextEl && typeof nextEl.focus === 'function') {
                        nextEl.focus();
                        if (typeof nextEl.select === 'function') {
                            try { nextEl.select(); } catch (err) {}
                        }
                    }
                } else if (onSubmitRequest) {
                    onSubmitRequest();
                }
            }
        } else if (e.key === 'Backspace') {
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
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

    const formNavProps = {
        ref: formRef,
        onKeyDown: handleKeyDown,
        'data-form-nav-enabled': 'true',
    };

    return { formRef, handleKeyDown, formNavProps };
};

export default useFormNavigation;
