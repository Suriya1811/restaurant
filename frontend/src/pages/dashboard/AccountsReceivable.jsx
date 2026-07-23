import React from 'react';
import OutstandingReportsHub from './OutstandingReportsHub';

const AccountsReceivable = ({ isEmbedded = false }) => {
    return <OutstandingReportsHub defaultTab="receivable" isEmbedded={isEmbedded} />;
};

export default AccountsReceivable;
