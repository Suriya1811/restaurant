import { useState, Children, cloneElement, isValidElement } from 'react';
import Footer from './Footer';

/**
 * Dashboard shell: Sidebar (left column, full height with Logout at bottom)
 * + Main (right column, with Header + Content + Footer-info at bottom).
 *
 * The footer info (Company, User, FY, Date, Time) starts AFTER the sidebar
 * and occupies only the main column — matching the unified-bottom-row design.
 */
const DashboardPageShell = ({ children, companyName, className = '' }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleMobileSidebar = () => setIsMobileOpen(prev => !prev);
    const closeMobileSidebar = () => setIsMobileOpen(false);

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

    const wrappedSidebarEl = sidebarEl && isValidElement(sidebarEl)
        ? cloneElement(sidebarEl, {
            isMobileOpen: sidebarEl.props.isMobileOpen !== undefined ? sidebarEl.props.isMobileOpen : isMobileOpen,
            onMobileClose: sidebarEl.props.onMobileClose || closeMobileSidebar
        })
        : sidebarEl;

    const injectHeaderToggle = (node) => {
        if (!isValidElement(node)) return node;

        const isHeaderNode =
            node.type?.name === 'Header' ||
            (node.props && (node.props.title !== undefined || node.props.isMaster !== undefined));

        if (isHeaderNode) {
            return cloneElement(node, {
                toggleSidebar: node.props.toggleSidebar || toggleMobileSidebar
            });
        }

        if (node.props && node.props.children) {
            if (Array.isArray(node.props.children)) {
                return cloneElement(node, {
                    children: Children.map(node.props.children, child => injectHeaderToggle(child))
                });
            } else if (isValidElement(node.props.children)) {
                return cloneElement(node, {
                    children: injectHeaderToggle(node.props.children)
                });
            }
        }

        return node;
    };

    const wrappedMainEls = mainEls.map((child) => {
        if (!isValidElement(child)) return child;
        const childProps = child.props;
        const isMain =
            (child.type === 'main') ||
            (childProps?.className && String(childProps.className).includes('dashboard-main'));

        if (!isMain) return child;

        const existingChildren = childProps.children;
        const mainInlineStyle = childProps.style || {};

        const enhancedChildren = Children.map(existingChildren, item => injectHeaderToggle(item));

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
                    {enhancedChildren}
                    <Footer companyName={companyName} />
                </>
            )
        });
    });

    return (
        <div className={shellClass}>
            {wrappedSidebarEl}
            {wrappedMainEls}
        </div>
    );
};

export default DashboardPageShell;
