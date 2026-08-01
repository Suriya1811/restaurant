import { Children, cloneElement, isValidElement } from 'react';
import Footer from './Footer';

/**
 * Dashboard shell: Sidebar (left column, full height with Logout at bottom)
 * + Main (right column, with Header + Content + Footer-info at bottom).
 *
 * The footer info (Company, User, FY, Date, Time) starts AFTER the sidebar
 * and occupies only the main column — matching the unified-bottom-row design.
 */
const DashboardPageShell = ({ children, companyName, className = '' }) => {
    const childArray = Children.toArray(children);
    const firstChild = childArray[0];
    const isFirstChildMain = firstChild && isValidElement(firstChild) && (
        firstChild.type === 'main' || 
        (firstChild.props?.className && String(firstChild.props.className).includes('dashboard-main'))
    );

    const sidebarEl = isFirstChildMain ? null : childArray[0];
    const mainEls = isFirstChildMain ? childArray : childArray.slice(1);

    const shellClass = ['dashboard-layout', className]
        .filter(Boolean)
        .join(' ');

    const wrappedMainEls = mainEls.map((child, idx) => {
        if (!isValidElement(child)) return child;
        const childProps = child.props;
        const isMain =
            (child.type === 'main') ||
            (childProps?.className && String(childProps.className).includes('dashboard-main'));

        if (!isMain) return child;

        const existingChildren = childProps.children;
        const mainInlineStyle = childProps.style || {};

        return cloneElement(child, {
            ...childProps,
            style: {
                ...mainInlineStyle,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                height: '100%'
            },
            children: (
                <>
                    {existingChildren}
                    <Footer companyName={companyName} />
                </>
            )
        });
    });

    return (
        <div className={shellClass}>
            {sidebarEl}
            {wrappedMainEls}
        </div>
    );
};

export default DashboardPageShell;
