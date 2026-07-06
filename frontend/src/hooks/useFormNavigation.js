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
            const elements = getFocusableElements();
            if (elements.length > 0) {
                elements[0].focus();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [getFocusableElements, ...dependencies]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            const elements = getFocusableElements();
            const index = elements.indexOf(e.target);
            
            if (index > -1) {
                e.preventDefault(); 
                
                // If not the last element and not a button, move to next
                if (index < elements.length - 1 && e.target.tagName !== 'BUTTON') {
                    elements[index + 1].focus();
                } else if (onSubmitRequest) {
                    // Trigger submit confirmation when Enter is pressed on the last field or submit button
                    onSubmitRequest();
                }
            }
        } else if (e.key === 'Backspace') {
            const target = e.target;
            // Only navigate back if it is an input/textarea and it's completely empty
            if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target.value === '') {
                e.preventDefault();
                const elements = getFocusableElements();
                const index = elements.indexOf(target);
                if (index > 0) {
                    elements[index - 1].focus();
                }
            }
        }
    }, [getFocusableElements, onSubmitRequest]);

    return { formRef, handleKeyDown };
};
