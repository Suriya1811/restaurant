import React from 'react';
import OutstandingReportsHub from './OutstandingReportsHub';

const AccountsPayable = ({ isEmbedded = false }) => {
    return <OutstandingReportsHub defaultTab="payable" isEmbedded={isEmbedded} />;
};

export default AccountsPayable;
