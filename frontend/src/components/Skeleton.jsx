import React from 'react';

export const Skeleton = ({ className, width, height, borderRadius }) => {
    const style = {
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '4px',
    };

    return <div className={`skeleton ${className || ''}`} style={style} />;
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
    return (
        <>
            {[...Array(rows)].map((_, i) => (
                <tr key={i}>
                    {[...Array(cols)].map((_, j) => (
                        <td key={j}>
                            <Skeleton height="24px" width={j === 0 ? "150px" : "80px"} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export const CardSkeleton = ({ count = 6 }) => {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <div key={i} className="pos-product-card skeleton" style={{ height: '125px' }}>
                    {/* The .skeleton class in index.css handles the animation */}
                </div>
            ))}
        </>
    );
};
