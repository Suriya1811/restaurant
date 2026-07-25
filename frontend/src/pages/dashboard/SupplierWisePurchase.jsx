import React from 'react';
import PurchaseSummaryHub from './PurchaseSummaryHub';

const SupplierWisePurchase = ({ isEmbedded = false }) => {
    return <PurchaseSummaryHub defaultTab="supplier" isEmbedded={isEmbedded} />;
};

export default SupplierWisePurchase;
