import React from 'react';
import OutstandingReportsHub from './OutstandingReportsHub';

const SupplierOutstanding = ({ isEmbedded = false }) => {
    return <OutstandingReportsHub defaultTab="supplier" isEmbedded={isEmbedded} />;
};

export default SupplierOutstanding;
