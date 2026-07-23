import React from 'react';
import OutstandingReportsHub from './OutstandingReportsHub';

const CustomerOutstanding = ({ isEmbedded = false }) => {
    return <OutstandingReportsHub defaultTab="customer" isEmbedded={isEmbedded} />;
};

export default CustomerOutstanding;
